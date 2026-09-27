/**
 * Production entry point for Node.js hosts that start the app from the project
 * root — most importantly Hostinger Node.js web apps (hPanel "Entry file").
 *
 * It serves the same Next.js build as `next start`, but binds explicitly to
 * 0.0.0.0 and to the PORT the platform injects. Hostinger's proxy reaches the
 * app over the network, so listening on 127.0.0.1 only would return 502.
 */
const { createServer } = require('node:http');
const next = require('next');

const port = Number.parseInt(process.env.PORT, 10) || 3000;
// Deliberately not `process.env.HOSTNAME`: on Linux that holds the machine's
// hostname, not a bind address. BIND_HOST is ours to define.
const hostname = process.env.BIND_HOST || '0.0.0.0';
// Default to a production run. `next build` already produced an optimised
// bundle, so a missing NODE_ENV must NOT silently flip us into dev mode and
// recompile on every request. Opt into dev explicitly.
const dev = process.env.NODE_ENV === 'development';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`> MarkazOS ready on http://${hostname}:${port} (dev=${dev})`);
  });
});
