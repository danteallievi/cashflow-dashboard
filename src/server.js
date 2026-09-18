import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDashboard } from './services/dashboard.js';
import { safeError } from './utils/errors.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const root = dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(express.static(join(root, '..', 'public'), {
  etag: true,
  maxAge: '5m',
  setHeaders(response, filePath) {
    if (filePath.endsWith('index.html')) response.setHeader('Cache-Control', 'no-cache');
  },
}));

app.get('/api/dashboard', async (_request, response) => {
  try {
    response.setHeader('Cache-Control', 'no-store');
    response.json(await buildDashboard());
  } catch (error) {
    console.error(`[dashboard] unexpected error: ${safeError(error)}`);
    response.status(500).json({ error: 'The local dashboard could not be updated.' });
  }
});

app.listen(port, '127.0.0.1', (error) => {
  if (error) {
    console.error(`[server] could not bind to port ${port}: ${safeError(error)}`);
    process.exitCode = 1;
    return;
  }
  console.info(`[server] Crypto Dashboard running at http://localhost:${port}`);
});
