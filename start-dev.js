const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '  Starting Smart Dine Restaurant System (Full Stack)   ');
console.log('\x1b[36m%s\x1b[0m', '  Backend:  http://localhost:5000                      ');
console.log('\x1b[36m%s\x1b[0m', '  Frontend: http://localhost:3000                      ');
console.log('\x1b[36m%s\x1b[0m', '=======================================================');

const isWin = process.platform === 'win32';

// Start Backend on Port 5000
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: ['inherit', 'pipe', 'pipe']
});

backend.stdout.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.log(`\x1b[32m[Backend]\x1b[0m ${line}`);
  });
});

backend.stderr.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.error(`\x1b[31m[Backend Error]\x1b[0m ${line}`);
  });
});

backend.on('close', (code) => {
  console.log(`\x1b[31m[Backend] Exited with code ${code}\x1b[0m`);
});

// Start Frontend Dev Server on Port 3000
const frontend = isWin
  ? spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: ['inherit', 'pipe', 'pipe']
    })
  : spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: ['inherit', 'pipe', 'pipe']
    });

frontend.stdout.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.log(`\x1b[34m[Frontend]\x1b[0m ${line}`);
  });
});

frontend.stderr.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.error(`\x1b[33m[Frontend Info]\x1b[0m ${line}`);
  });
});

frontend.on('close', (code) => {
  console.log(`\x1b[33m[Frontend] Exited with code ${code}\x1b[0m`);
});

// Start Port 3001 Forwarder
const forwarder = spawn('node', ['forwarder-3001.js'], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'pipe']
});

forwarder.stdout.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.log(`\x1b[35m[Forwarder 3001]\x1b[0m ${line}`);
  });
});

forwarder.stderr.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.error(`\x1b[31m[Forwarder Error]\x1b[0m ${line}`);
  });
});

// Keep event loop alive
const keepAlive = setInterval(() => {}, 1000 * 60 * 60);

let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(keepAlive);
  console.log('\n\x1b[33mStopping all Smart Dine servers gracefully...\x1b[0m');

  if (backend.pid) {
    if (isWin) {
      spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
    } else {
      backend.kill('SIGTERM');
    }
  }

  if (frontend.pid) {
    if (isWin) {
      spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
    } else {
      frontend.kill('SIGTERM');
    }
  }

  if (forwarder.pid) {
    if (isWin) {
      spawn('taskkill', ['/pid', forwarder.pid.toString(), '/f', '/t']);
    } else {
      forwarder.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
