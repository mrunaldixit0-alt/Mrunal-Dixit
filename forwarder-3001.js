const http = require('http');

const PORT = 3001;
const TARGET_PORT = 3000;

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Port ${TARGET_PORT} dev server is unreachable: ${err.message}` }));
    }
  });

  req.pipe(proxyReq, { end: true });
});

// Support WebSocket upgrading (Vite HMR)
server.on('upgrade', (req, socket, head) => {
  const proxySocket = http.request({
    hostname: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`
    }
  });

  proxySocket.on('upgrade', (proxyRes, upstreamSocket, proxyHead) => {
    socket.write(
      `HTTP/${req.httpVersion} 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n'
    );
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });

  proxySocket.on('error', () => {
    socket.destroy();
  });

  proxySocket.end();
});

server.listen(PORT, () => {
  console.log(`Port ${PORT} forwarder active -> proxying to http://localhost:${TARGET_PORT}`);
});
