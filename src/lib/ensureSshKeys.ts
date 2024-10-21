import { subtle } from 'crypto';
import * as fs from 'fs';
import * as sshpk from 'sshpk';

export async function ensureSshKeys(): Promise<string> {
    const sshDir = '/home/codespace/.ssh';

    if (!fs.existsSync(sshDir)) {
        fs.mkdirSync(sshDir);
    }

    const sshdConfig = fs.readFileSync('/etc/ssh/sshd_config', 'utf8');
    if (sshdConfig.match(/#\s*AuthorizedKeysFile/)) {
        console.warn('--------------------------------------------------------------------------------');
        console.warn('It looks like you need to uncomment AuthorizedKeysFile in /etc/ssh/sshd_config!');
        console.warn('--------------------------------------------------------------------------------');
    }

    if (fs.existsSync(`${sshDir}/tunnels_ssh_test_app`)) {
        return fs.readFileSync(`${sshDir}/tunnels_ssh_test_app`, 'utf8');
    }

    const keyPair = await subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
    );

    const exportedPublicKey = await subtle.exportKey(
        "spki",
        keyPair.publicKey
    );
    const exportedPrivateKey = await subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
    );

    const privateKeyString = arrayBufferToPem(exportedPrivateKey, true);
    const publicKetString = arrayBufferToPem(exportedPublicKey);

    const sshPublicKey = sshpk.parseKey(publicKetString, "pem").toString('ssh');

    fs.writeFileSync(`${sshDir}/tunnels_ssh_test_app`, privateKeyString);
    fs.writeFileSync(`${sshDir}/tunnels_ssh_test_app.pub`, sshPublicKey);
    fs.appendFileSync(`${sshDir}/authorized_keys`, sshPublicKey);

    return privateKeyString;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
  
function arrayBufferToPem(buffer: ArrayBuffer, isPrivateKey = false) {
    const base64 = arrayBufferToBase64(buffer);
    const header = isPrivateKey ? '-----BEGIN PRIVATE KEY-----' : '-----BEGIN PUBLIC KEY-----';
    const footer = isPrivateKey ? '-----END PRIVATE KEY-----' : '-----END PUBLIC KEY-----';
    return `${header}\n${base64}\n${footer}`;
}