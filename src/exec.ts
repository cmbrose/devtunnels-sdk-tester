import { CommandRequestMessage, SshExtendedDataType } from "@microsoft/dev-tunnels-ssh";
import { ChannelSignalMessage } from "@microsoft/dev-tunnels-ssh/messages/connectionMessages";
import { connectSession } from "./lib/connectSession";
import { TerminalRequestMessage } from "./lib/terminalRequestMessage";
import { parseArgs } from 'util'

const defaultCommandToRun = 'for i in {1..15}; do echo \"Hello there: $i\" >> /workspaces/devtunnels-sdk-tester/log; sleep 1; done';

async function main(): Promise<void> {
    const {port, tty, command} = getArgs();

    const session = await connectSession(port);
    const channel = await session.openChannel();

    channel.onDataReceived(e => {
        const str = e.toString("utf-8")
        if (str) {
            console.log(`STDOUT: ${str}`)
        }
    });
    
    channel.onExtendedDataReceived(e => {
        if (e.dataTypeCode !== SshExtendedDataType.STDERR) {
            return
        }
        const str = e.toString()
        if (str) {
            console.log(`STDERR: ${str}`)
        }
    });

    channel.onClosed(e => {
        console.log(`CLOSED: ${JSON.stringify(e)}`)
        process.exit(0)
    });

    if (tty) {
        const terminalRequestMessage = new TerminalRequestMessage();
        await channel.request(terminalRequestMessage);
    }

    const execRequestMessage = new CommandRequestMessage();
    execRequestMessage.command = command;
    await channel.request(execRequestMessage);

    console.log('Command sent. You can now type to write to stdin or use the following commands - remember to hit return!');
    console.log(' - !i => SIGINT');
    console.log(' - !t => SIGTERM');
    console.log(' - !k => SIGKILL');
    console.log(' - !q => close and exit');
    console.log('');

    const sendSignal = async (signal: 'INT' | 'TERM' | 'KILL' | 'FOO' | '') => {
        const signalMessage = new ChannelSignalMessage();
        signalMessage.signal = signal;
        await channel.request(signalMessage);
    };

    process.stdin.addListener("data", async function(d) {
        const c = d.toString().trim();

        if (c === '!q') {
            console.log("closing and exiting");
            await channel.close();
            process.exit(0)
        } else if (c === '!i') {
            console.log("sending sigint");
            await sendSignal('INT');
        } else if (c === '!t') {
            console.log("sending sigterm");
            await sendSignal('TERM');
        } else if (c === '!k') {
            console.log("sending sigkill");
            await sendSignal('KILL');
        } else {
            // Writing to stdin
            await channel.send(Buffer.from(c))
        }
    });
}

function getArgs(): {port: number, tty: boolean, command: string} {
    const {
        values: {
            port,
            tty,
            command,
            help,
        }
    } = parseArgs({
        options: {
            tty: {
                type: 'boolean',
                short: 't',
                default: false
            },
            port: {
                type: 'string',
                short: 'p',
                default: '2222'
            },
            command: {
                type: 'string',
                short: 'c',
                default: defaultCommandToRun
            },
            help: {
                type: 'boolean',
                short: 'h',
                default: false,
            }
        }
    })

    if (help) {
        console.log('Execute commands over the Dev Tunnel SDK using a local SSH server')
        console.log('')
        console.log('Usage: tsx main.ts [OPTIONS]')
        console.log('')
        console.log('Options:')
        console.log("  -t, --tty      Use a pty to execute the command (allows interactive bash shells)")
        console.log("  -p, --port     localhost port the SSH server is listening on")
        console.log("  -c, --command  The command to execute (or hardcode it in the app)")
        console.log('')

        process.exit(0);
    }

    return {
        port: Number(port),
        tty,
        command,
    }
}

main()