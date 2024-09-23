# devtunnels-sdk-tester

This is a basic tester app for the `@microsoft/dev-tunnels-ssh` package.

## Setup

You'll need to install `tsk` with `npm install --global tsx`.

Additionally, you'll need to run `npm install` in `src` and, if you want to use the `express` demo, `npm install` in `demos/express`.

Finally, this will use your `localhost` ssh connection, so ensure that your `/etc/ssh/sshd_config` is set up to use `AuthorizedKeysFile`.

## Usage

To run the app, run `tsx src/main.ts`. By default this will run the `demos/express` demo server. To change the command, update `commandToRun` in `main.ts`.