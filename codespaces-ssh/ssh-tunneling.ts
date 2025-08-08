// import { RemoteProvider } from '@github/codespaces-ssh-tunneling';
// import * as fs from 'fs';

/* This requires a GH NPM PAT to pull the private package - it works, I'm just too lazy to automate it, so commenting it out by default to not break npm installs */

// async function main(): Promise<void> {
//     const tunnel = undefined as any; // use get-tunnel-props.sh and copy-paste the output object here
//     const rp = new RemoteProvider(tunnel);

//     const chan = await rp.getCommandChannel();

//     const base64 = 
//       'eyJ0b29sTmFtZSI6ImNvbW1hbmQtYnJva2VyIiwiY29tbWFuZCI6ImJhc2giLCJhcmdzIjpbIi1jIiwiZm9yIGkgaW4gezEuLjE1fTsgZG8gZWNobyBcIkhlbGxvIHRoZXJlOiAkaVwiOyBzbGVlcCAxOyBkb25lIl0sImFjdGl2aXR5SWQiOjExMX0='

//     await chan.executeCommand(`nohup node /workspaces/command-broker.js -c /workspaces/.file-syncer.config -p ${base64} -s https://legendary-waddle-v6w5w6769xvhx677-3000.app.github.dev -t 60000 &`);

//     await new Promise<void>(resolve => {
//       setTimeout(() => {
//         chan.close()
//         console.log("Closed!")
//         resolve();
//       }, 5000)
//     });

//     process.exit(0)
// }

// main()
