// devtunnels-port-token-test.ts
/**
 * Minimal test for requesting a port-scoped "connect" token and calling the web-forwarded URI.
 *
 * Prereqs:
 *   npm i -D ts-node typescript
 *   npm i @microsoft/dev-tunnels-management @microsoft/dev-tunnels-contracts axios
 *
 * Env (pick ONE identity: GitHub or AAD):
 *   export DEV_TUNNELS_USER_TOKEN="<your user access token>"
 *   export DEV_TUNNELS_AUTH_SCHEME="github"   # or "aad" (defaults to github)
 *
 * Target tunnel (choose by name OR by ids):
 *   export TUNNEL_ID="abc123xy"               # optional if using name
 *   export CLUSTER_ID="usw2"                  # optional if using name
 *   export TARGET_PORT="5001"                 # required; the port number which the token should be scoped to
 *
 * Optional:
 *   export TUNNEL_SERVICE_URI="https://global.rel.tunnels.api.visualstudio.com"  # default global
 *
 * Run:
 *   npx ts-node devtunnels-port-token-test.ts
 */

import { TunnelManagementHttpClient, ManagementApiVersions } from '@microsoft/dev-tunnels-management';
import {
    Tunnel,
    TunnelAccessScopes,
    TunnelHeaderNames,
} from '@microsoft/dev-tunnels-contracts';
import type { TunnelRequestOptions } from '@microsoft/dev-tunnels-management';
import axios from 'axios';

function requiredEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env: ${name}`);
    return v;
}

async function testPort(client: TunnelManagementHttpClient, uri: string, port: number, token: string) {
    console.log(`\n=== Testing port ${port} ===`);
    try {
        console.log('Token details:');
        console.log(`  Port:   ${port}`);
        console.log(`  Token (connect): ${token.slice(0, 20)}... (len=${token.length})`);
        console.log(`  URI:`, uri);

        console.log(`GET ${uri}`);
        const resp = await axios.get(uri, {
            headers: {
                [TunnelHeaderNames.XTunnelAuthorization]: `tunnel ${token}`,
                [TunnelHeaderNames.XTunnelSkipAntiPhishingPage]: '1',
            },
            validateStatus: () => true,
            timeout: 15_000,
        });
        const body = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        console.log(`Status: ${resp.status}`);
        console.log('Response (first 300 chars):');
        console.log(body.slice(0, 300));
        return { port: port, success: true, httpStatus: resp.status };
    } catch (e: any) {
        console.error(`Port ${port} FAILED:`, e?.response?.status, e?.response?.data ?? e?.message ?? e);
        return { port: port, success: false, error: e };
    }
}

async function main() {
    const userToken = requiredEnv('DEV_TUNNELS_USER_TOKEN');
    const authScheme = (process.env.DEV_TUNNELS_AUTH_SCHEME || 'github').toLowerCase();
    if (authScheme !== 'github' && authScheme !== 'aad') {
        throw new Error(`DEV_TUNNELS_AUTH_SCHEME must be "github" or "aad" (got "${authScheme}")`);
    }

    const targetPort = Number(process.env.TARGET_PORT || 0);
    if (!targetPort) throw new Error('Missing required env: TARGET_PORT');

    // Removed required PORT env; we now test fixed set of ports.
    const ports = [5001, 5002];

    const tunnelId = process.env.TUNNEL_ID;
    const clusterId = process.env.CLUSTER_ID;

    let tunnel: Tunnel;
    if (tunnelId && clusterId) {
        tunnel = { tunnelId, clusterId };
    } else {
        throw new Error('Specify both TUNNEL_ID and CLUSTER_ID');
    }

    const serviceUri = process.env.TUNNEL_SERVICE_URI; // optional
    const userAgent = { name: 'actions-ingress-port-scope-test', version: '0.1' };

    const client = new TunnelManagementHttpClient(
        userAgent,
        ManagementApiVersions.Version20230927preview,
        async () => `${authScheme} ${userToken}`,
        serviceUri
    );

    const options: TunnelRequestOptions = { tokenScopes: [TunnelAccessScopes.Connect] };
    const tp = await client.getTunnelPort(tunnel, targetPort, options);
    if (!tp) throw new Error('getTunnelPort returned null (tunnel/port not found)');
    const connectToken = tp.accessTokens?.[TunnelAccessScopes.Connect];
    if (!connectToken) throw new Error('No connect token returned. Check permissions and scope request.');

    const webUris = tp.portForwardingUris ?? [];
    const targetUri = webUris.find(u => u.startsWith('https://')) || webUris[0];

    const results = [] as Array<{ port: number; success: boolean }>;
    for (const p of ports) {
        const portUri = targetUri.replace(targetPort.toString(), p.toString());
        const r = await testPort(client, portUri, p, connectToken);
        results.push({ port: p, success: r.success });
    }

    console.log('\n=== Summary ===');
    for (const r of results) {
        console.log(`Port ${r.port}: ${r.success ? 'SUCCESS' : 'FAILURE'}`);
    }

    const anySuccess = results.some(r => r.success);
    const allFail = results.every(r => !r.success);
    if (allFail) {
        console.error('\nAll ports failed.');
        process.exit(1);
    }
    if (!anySuccess) {
        process.exit(1);
    }
    // Exit 0 if at least one success (expected scenario: one fails, one succeeds)
}

main().catch((e) => {
    console.error('\nFATAL ERROR:', e?.response?.status, e?.response?.data ?? e);
    process.exit(1);
});