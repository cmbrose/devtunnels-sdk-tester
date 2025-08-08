# devtunnels-sdk-tester

This is a basic tester app for the `@microsoft/dev-tunnels-ssh` package.

## Setup

> Note: if you're in a codespace you should be all good to go!

You'll need to install `tsx` with `npm install --global tsx`.

Additionally, you'll need to run `npm install` in `src` and, if you want to use the `express` demo, `npm install` in `demos/express`.

Finally, this will use your `localhost` ssh connection, so ensure that your `/etc/ssh/sshd_config` is set up to use `AuthorizedKeysFile`.

## Usage

### ssh

#### exec

To run the app, run `tsx ssh/exec.ts`. By default this will run the `demos/express` demo server. To change the command, update `commandToRun` in `exec.ts`.

#### server

To run the app, run `tsx ssh/server.ts`.

This is a WIP server (by WIP I mean really I'm just playing with it and adding as I need to). It will start an ssh server on `:2222` which can be connected to using, say, `exec.ts`.

Currently it only supports `exec` and `signal` commands and doesn't really shut down nicely :sweat_smile:

You may need to manually kill `sshd` if it's already running and using `:2222` or you can use `-p` to use a different port.

### port forwarding

TODO

server.ts starts a hello world app on `:5001` and `:5002` and connects to a dev tunnel to host them

client.ts mints a token on that tunnel scoped to `:5001` only, and then proves that it can only access that port and not `:5002`

set up is a pain right now