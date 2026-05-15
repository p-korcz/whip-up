import { createApp } from './app.js';

const PORT = Number(process.env['PORT'] ?? 3001);

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
