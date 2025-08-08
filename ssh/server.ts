import { ChannelRequestMessage, CommandRequestMessage, SessionRequestMessage, SshAlgorithms, SshAuthenticatingEventArgs, SshExtendedDataType, SshRequestEventArgs, SshServerSession, SshSessionConfiguration } from "@microsoft/dev-tunnels-ssh";
import { parseArgs } from 'util'
import { SshServer } from "@microsoft/dev-tunnels-ssh-tcp";
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { ChannelFailureMessage, ChannelSignalMessage } from "@microsoft/dev-tunnels-ssh/messages/connectionMessages";

async function main(): Promise<void> {
    const { port, } = getArgs();

    const server = new SshServer(new SshSessionConfiguration());

    var hostKey = await SshAlgorithms.publicKey['rsaWithSha256']!.generateKeyPair();
    server.credentials.publicKeys = [hostKey];

    server.acceptSessions(port);

    server.onSessionOpened(async (e: SshServerSession) => {
        console.log('Accepted new connection');

        e.onAuthenticating((auth: SshAuthenticatingEventArgs) => {
            auth.authenticationPromise = new Promise((resolve) => {
                // TODO verify auth...

                const result = {
                    username: auth.username,
                };
                resolve(result);
            });
        });

        const channel = await e.acceptChannel();

        let exec: ChildProcessWithoutNullStreams | undefined = undefined;
        channel.onRequest(async (req: SshRequestEventArgs<ChannelRequestMessage>) => {
            console.log(`Got request of type ${req.requestType}`);

            if (req.requestType === 'exec') {
                const execRequest = new CommandRequestMessage();
                req.request.convertTo(execRequest);

                console.log(`The command is: ${execRequest.command}`)

                if (exec) {
                    const failure = new ChannelFailureMessage();
                    failure.recipientChannel = channel.remoteChannelId;
                    await channel.session.sendMessage(failure);
                    console.log("Received a second exec command a channel already running one")
                    return;
                }

                exec = spawn('bash', ['-c', execRequest.command!]);
                exec.stdout.on('data', (data) => {
                    channel.send(data);
                })
                exec.stderr.on('data', (data) => {
                    channel.sendExtendedData(SshExtendedDataType.STDERR, data);
                })
                channel.onDataReceived((data: Buffer) => {
                    exec?.stdin.write(data);
                })

                exec.on('close', (e) => {
                    channel.close(exec?.exitCode!)
                })
            } else if (req.requestType === 'signal') {
                const signalRequest = new ChannelSignalMessage();
                req.request.convertTo(signalRequest);

                if (!signalRequest.signal) {
                    return;
                }

                if (!exec) {
                    const failure = new ChannelFailureMessage();
                    failure.recipientChannel = channel.remoteChannelId;
                    await channel.session.sendMessage(failure);
                    return;
                }

                let signal = signalRequest.signal;
                if (!signal.startsWith("SIG")) {
                    signal = "SIG" + signal;
                }
                exec.kill(<NodeJS.Signals>signal);
            }
        });
    })
}


function getArgs(): { port: number, } {
    const {
        values: {
            port,
            help,
        }
    } = parseArgs({
        options: {
            port: {
                type: 'string',
                short: 'p',
                default: '2222'
            },
            help: {
                type: 'boolean',
                short: 'h',
                default: false,
            },
        }
    })

    if (help) {
        console.log('Start a basic ssh server which can accept exec and signal commands')
        console.log('')
        console.log('Usage: tsx server.ts [OPTIONS]')
        console.log('')
        console.log('Options:')
        console.log("  -p, --port     localhost port the SSH server should listen on")
        console.log('')

        process.exit(0);
    }

    return {
        port: Number(port),
    }
}


main()