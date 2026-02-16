import express from 'express';

export function startReloadServer(port = 3456) {
  const app = express();

  let lastChange = Date.now();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get('/__reload', (req, res) => {
    res.json({ ts: lastChange });
  });

  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`🔄 Reload server running on http://127.0.0.1:${port}`);
  });

  function markChanged() {
    lastChange = Date.now();
  }

  function close() {
    server.close();
  }

  return { markChanged, close };
}
