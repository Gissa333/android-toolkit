import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

function run(cmd: string, timeout = 60000): Promise<{ ok: boolean; out: string; err: string }> {
  return new Promise(async (resolve) => {
    try {
      const { stdout } = await execAsync(cmd, { timeout, maxBuffer: 10 * 1024 * 1024 });
      resolve({ ok: true, out: stdout, err: '' });
    } catch (e: any) {
      resolve({ ok: false, out: e.stdout || '', err: e.stderr || e.message });
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, backgroundColor: '#1E1E1E',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

ipcMain.handle('adb:devices', async () => {
  const r = await run('adb devices -l');
  return r.out.split('\n').slice(1).filter(l => l.trim()).map(l => {
    const p = l.trim().split(/\s+/);
    return { serial: p[0], state: p[2] || 'unknown' };
  });
});
ipcMain.handle('adb:shell', (_, s, c) => run(`adb -s ${s} shell ${c}`));
ipcMain.handle('adb:reboot', (_, s, m = '') => run(`adb -s ${s} reboot ${m}`));
ipcMain.handle('adb:install', async (_, s) => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'APK', extensions: ['apk'] }] });
  if (r.canceled) return { ok: false, err: 'canceled' };
  return run(`adb -s ${s} install -r "${r.filePaths[0]}"`, 300000);
});
ipcMain.handle('adb:uninstall', (_, s, p) => run(`adb -s ${s} uninstall ${p}`));
ipcMain.handle('adb:resetPattern', (_, s) =>
  run(`adb -s ${s} shell rm -f /data/system/gesture.key /data/system/password.key && adb -s ${s} reboot`));

ipcMain.handle('fastboot:devices', async () => {
  const r = await run('fastboot devices');
  return r.out.split('\n').filter(l => l.trim()).map(l => l.split('\t')[0].trim());
});
ipcMain.handle('fastboot:flash', async (_, s, p) => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'Image', extensions: ['img'] }] });
  if (r.canceled) return { ok: false, err: 'canceled' };
  return run(`fastboot -s ${s} flash ${p} "${r.filePaths[0]}"`, 600000);
});
ipcMain.handle('fastboot:unlock', (_, s) => run(`fastboot -s ${s} flashing unlock`));
ipcMain.handle('fastboot:wipe', (_, s) => run(`fastboot -s ${s} -w`));
ipcMain.handle('fastboot:reboot', (_, s, t = '') => run(`fastboot -s ${s} reboot ${t}`));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
