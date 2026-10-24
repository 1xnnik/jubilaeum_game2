// Local start/stop controller. Controls only the server for this checkout.
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const id = crypto.createHash('sha256').update(root).digest('hex').slice(0, 20);
const pipe = process.platform === 'win32' ? `\\\\.\\pipe\\bringsmit-${id}` : path.join(os.tmpdir(), `bringsmit-${id}.sock`);
const port = Number(process.env.BRINGSMIT_PORT || 5173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Ungueltiger BRINGSMIT_PORT.');
const url = `http://localhost:${port}/`;
const runtime = path.join(root, '.bringsmit-runtime');
const log = path.join(runtime, 'server.log');
function request(command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(pipe);
    socket.setTimeout(1500);
    socket.once('connect', () => socket.write(command));
    socket.once('data', data => { socket.destroy(); resolve(data.toString()); });
    socket.once('error', reject);
    socket.once('timeout', () => { socket.destroy(); reject(new Error('Keine Antwort vom Spielserver.')); });
  });
}
function openBrowser() {
  if (process.env.BRINGSMIT_NO_BROWSER === '1') return;
  const options = { detached: true, windowsHide: true, stdio: 'ignore' };
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/c', 'start', '', url], options)
    : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], options);
  child.on('error', () => console.log(`Browser bitte selbst oeffnen: ${url}`));
  child.unref();
}
async function worker() {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { host: '127.0.0.1', port, strictPort: true, open: false } });
  await vite.listen();
  if (process.platform !== 'win32' && fs.existsSync(pipe)) fs.unlinkSync(pipe);
  const control = net.createServer(socket => {
    socket.once('data', async data => {
      if (data.toString() === 'stop') {
        await vite.close();
        socket.end('stopped');
        control.close();
      } else socket.end('ready');
    });
    socket.on('error', () => {});
  });
  control.on('error', async error => { console.error(error); await vite.close(); process.exit(1); });
  control.listen(pipe);
}
async function main() {
  const command = process.argv[2];
  if (command === 'worker') return worker();
  if (command === 'stop') {
    try { await request('stop'); console.log('Spielserver beendet. Dein Spielstand bleibt im Browser gespeichert.'); }
    catch (error) {
      if (['ENOENT', 'ECONNREFUSED'].includes(error.code)) console.log('Kein mit Start.bat gestarteter Spielserver aktiv.');
      else throw error;
    }
    return;
  }
  if (command !== 'start') throw new Error('Aufruf: node scripts/game.cjs start|stop');
  try { await request('ping'); openBrowser(); console.log(`Spiel laeuft bereits: ${url}`); return; }
  catch (error) { if (!['ENOENT', 'ECONNREFUSED'].includes(error.code)) throw error; }
  fs.mkdirSync(runtime, { recursive: true });
  const output = fs.openSync(log, 'w');
  const child = spawn(process.execPath, [__filename, 'worker'], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', output, output] });
  child.unref();
  fs.closeSync(output);
  let launchError;
  child.on('error', error => { launchError = error; });
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (launchError) throw launchError;
    try { await request('ping'); openBrowser(); console.log(`Spiel gestartet: ${url}`); return; } catch {}
  }
  throw new Error(`Spiel konnte nicht gestartet werden. Ist Port ${port} bereits belegt?\nDetails: ${log}\n${fs.readFileSync(log, 'utf8').slice(-3000)}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
