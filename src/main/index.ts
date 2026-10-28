import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { createWriteStream } from 'fs';

const execAsync = promisify(exec);
const toolsDir = path.join(app.getPath('userData'), 'bin');
const adbPath = path.join(toolsDir, 'adb.exe');
const fastbootPath = path.join(toolsDir, 'fastboot.exe');

let mainWindow: BrowserWindow | null = null;

async function ensureTools(): Promise<boolean> {
  if (fs.existsSync(adbPath) && fs.existsSync(fastbootPath)) return true;
  if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

  return new Promise((resolve) => {
    const url = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
    const zipPath = path.join(toolsDir, 'platform-tools.zip');
    const file = createWriteStream(zipPath);

    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location!, (res) => {
          const totalSize = parseInt(res.headers['content-length'] || '0', 10);
          let downloadedSize = 0;

          res.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize > 0 && mainWindow) {
              const percent = Math.round((downloadedSize / totalSize) * 100);
              mainWindow.webContents.send('download-progress', percent);
            }
          });

          res.pipe(file);
          file.on('finish', () => {
            file.close();
            if (mainWindow) mainWindow.webContents.send('download-progress', 99); // 99% أثناء فك الضغط
            const psCmd = `Expand-Archive -Path "${zipPath}" -DestinationPath "${toolsDir}" -Force; Move-Item -Path "${toolsDir}\\platform-tools\\*" -Destination "${toolsDir}" -Force; Remove-Item -Path "${toolsDir}\\platform-tools" -Recurse -Force; Remove-Item -Path "${zipPath}" -Force`;
            exec(`powershell -Command "${psCmd}"`, () => {
              if (mainWindow) mainWindow.webContents.send('download-progress', 100);
              resolve(true);
            });
          });
        });
      }
    }).on('error', () => resolve(false));
  });
}

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
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, backgroundColor: '#1E1E1E',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  createWindow(); // نفتح النافذة أولاً لكي نرى شريط التحميل
  await ensureTools(); // ثم نبدأ التحميل
});

// استقبال طلب بدء التحميل من الواجهة
ipcMain.handle('app:startDownload', async () => {
  return await ensureTools();
});

ipcMain.handle('adb:devices', async () => {
  const r = await run(`"${adbPath}" devices -l`);
  return r.out.split('\n').slice(1).filter(l => l.trim()).map(l => {
    const p = l.trim().split(/\s+/);
    return { serial: p[0], state: p[2] || 'unknown' };
  });
});
ipcMain.handle('adb:shell', (_, s, c) => run(`"${adbPath}" -s ${s} shell ${c}`));
ipcMain.handle('adb:reboot', (_, s, m = '') => run(`"${adbPath}" -s ${s} reboot ${m}`));
ipcMain.handle('adb:install', async (_, s) => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'APK', extensions: ['apk'] }] });
  if (r.canceled) return { ok: false, err: 'canceled' };
  return run(`"${adbPath}" -s ${s} install -r "${r.filePaths[0]}"`, 300000);
});
ipcMain.handle('adb:uninstall', (_, s, p) => run(`"${adbPath}" -s ${s} uninstall ${p}`));
ipcMain.handle('adb:resetPattern', (_, s) =>
  run(`"${adbPath}" -s ${s} shell rm -f /data/system/gesture.key /data/system/password.key && "${adbPath}" -s ${s} reboot`));

ipcMain.handle('fastboot:devices', async () => {
  const r = await run(`"${fastbootPath}" devices`);
  return r.out.split('\n').filter(l => l.trim()).map(l => l.split('\t')[0].trim());
});
ipcMain.handle('fastboot:flash', async (_, s, p) => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'Image', extensions: ['img'] }] });
  if (r.canceled) return { ok: false, err: 'canceled' };
  return run(`"${fastbootPath}" -s ${s} flash ${p} "${r.filePaths[0]}"`, 600000);
});
ipcMain.handle('fastboot:unlock', (_, s) => run(`"${fastbootPath}" -s ${s} flashing unlock`));
ipcMain.handle('fastboot:wipe', (_, s) => run(`"${fastbootPath}" -s ${s} -w`));
ipcMain.handle('fastboot:reboot', (_, s, t = '') => run(`"${fastbootPath}" -s ${s} reboot ${t}`));

app.on('window-all-closed', () => app.quit());