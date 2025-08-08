// server.js
import * as http from 'http';

const PORTS = [5001, 5002];
const HOST = process.env.HOST || '0.0.0.0';

const servers = PORTS.map((port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`hello from ${port}\n`);
    });
    server.listen(port, HOST, () => {
        console.log(`listening on http://${HOST}:${port}`);
    });
    return server;
});

// graceful shutdown
const stop = () => {
    console.log('shutting down...');
    let closed = 0;
    servers.forEach((server) => {
        server.close(() => {
            closed++;
            if (closed === servers.length) {
                process.exit(0);
            }
        });
    });
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);