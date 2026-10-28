import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  app: {
    startDownload: () => ipcRenderer.invoke('app:startDownload'),
    onProgress: (cb: (percent: number) => void) => ipcRenderer.on('download-progress', (_e, percent) => cb(percent))
  },
  adb: {
    devices: () => ipcRenderer.invoke('adb:devices'),
    shell: (s: string, c: string) => ipcRenderer.invoke('adb:shell', s, c),
    reboot: (s: string, m?: string) => ipcRenderer.invoke('adb:reboot', s, m),
    install: (s: string) => ipcRenderer.invoke('adb:install', s),
    uninstall: (s: string, p: string) => ipcRenderer.invoke('adb:uninstall', s, p),
    resetPattern: (s: string) => ipcRenderer.invoke('adb:resetPattern', s)
  },
  fastboot: {
    devices: () => ipcRenderer.invoke('fastboot:devices'),
    flash: (s: string, p: string) => ipcRenderer.invoke('fastboot:flash', s, p),
    unlock: (s: string) => ipcRenderer.invoke('fastboot:unlock', s),
    wipe: (s: string) => ipcRenderer.invoke('fastboot:wipe', s),
    reboot: (s: string, t?: string) => ipcRenderer.invoke('fastboot:reboot', s, t)
  }
});