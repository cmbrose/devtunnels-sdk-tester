# devtunnels-sdk-tester

This is a basic tester app for the `@microsoft/dev-tunnels-ssh` package.

## Setup

You'll need to install `tsx` with `npm install --global tsx`.

Additionally, you'll need to run `npm install` in `src` and, if you want to use the `express` demo, `npm install` in `demos/express`.

Finally, this will use your `localhost` ssh connection, so ensure that your `/etc/ssh/sshd_config` is set up to use `AuthorizedKeysFile`.

## Usage

### exec

To run the app, run `tsx src/exec.ts`. By default this will run the `demos/express` demo server. To change the command, update `commandToRun` in `exec.ts`.

### server

This is a WIP server (by WIP I mean really I'm just playing with it and adding as I need to). It will start an ssh server on `:2222` which can be connected to using, say, `exec.ts`.

Currently it only supports `exec` commands and doesn't really shut down nicely :sweat_smile: