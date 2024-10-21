import { ChannelRequestMessage, CommandRequestMessage, SessionRequestMessage, SshAlgorithms, SshAuthenticatingEventArgs, SshExtendedDataType, SshRequestEventArgs, SshServerSession, SshSessionConfiguration } from "@microsoft/dev-tunnels-ssh";
import { parseArgs } from 'util'
import { SshServer } from "@microsoft/dev-tunnels-ssh-tcp";
import { spawn } from 'child_process';
import { ChannelSignalMessage } from "@microsoft/dev-tunnels-ssh/messages/connectionMessages";

const defaultCommandToRun = 'bash -cli "cd demos/express && npm run start"';

async function main(): Promise<void> {
    const server = new SshServer(new SshSessionConfiguration());

    var hostKey = await SshAlgorithms.publicKey['rsaWithSha256']!.generateKeyPair();
    server.credentials.publicKeys = [ hostKey ];

    server.acceptSessions(2222);

    server.onSessionOpened(async (e: SshServerSession) => {
        console.log('Accepted new connection');

        e.onAuthenticating((auth: SshAuthenticatingEventArgs) => {
            var authenticationType = auth.authenticationType;
            auth.authenticationPromise = new Promise((resolve) =>
            {
                // TODO verify auth...

                const result = {
                    username: auth.username,
                };
                resolve(result);
            });
        });

        const channel = await e.acceptChannel();

        channel.onRequest(async (req: SshRequestEventArgs<ChannelRequestMessage>) => {
            console.log(`Got request of type ${req.requestType}`);

            if (req.requestType === 'exec') {
                const execRequest = new CommandRequestMessage()
                req.request.convertTo(execRequest)

                console.log(`The command is: ${execRequest.command}`)

                var exec =  spawn('bash', ['-c', execRequest.command!]);
                exec.stdout.on('data', (data) => {
                    channel.send(data);
                })
                exec.stderr.on('data', (data) => {
                    channel.sendExtendedData(SshExtendedDataType.STDERR, data);
                })
                channel.onDataReceived((data: Buffer) => {
                    exec.stdin.write(data);
                })

                exec.on('close', (e) => {
                    channel.close(exec.exitCode!)
                })
            }
        });
    })
}

main()