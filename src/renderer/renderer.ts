declare const window: any;
const api: any = window.api;
let selectedAdb: string | null = null;
let selectedFb: string | null = null;

function log(m: string) {
  const e = document.getElementById('log');
  if (e) e.textContent += `\n${m}`;
}

window.show = (page: string) => {
  const c = document.getElementById('content')!;
  if (page === 'adb') {
    c.innerHTML = `<div class="panel"><h2>📱 ADB</h2>
      <div class="row">
        <button class="btn" onclick="adbRefresh()">🔄 تحديث</button>
        <button class="btn" onclick="adbInstall()">📦 تثبيت APK</button>
        <button class="btn" onclick="adbUninstall()">🗑 إزالة</button>
        <button class="btn danger" onclick="adbReset()">🔓 فتح النمط</button>
        <button class="btn" onclick="adbReboot()">🔄 إعادة تشغيل</button>
      </div><div id="adbDevices"></div></div>
      <div class="panel"><h2>📋 السجل</h2><div id="log"></div></div>`;
  } else {
    c.innerHTML = `<div class="panel"><h2>⚡ Fastboot</h2>
      <div class="row">
        <button class="btn" onclick="fbRefresh()">🔄 تحديث</button>
        <button class="btn" onclick="fbUnlock()">🔓 فتح Bootloader</button>
        <button class="btn" onclick="fbFlash('boot')">🔥 boot</button>
        <button class="btn" onclick="fbFlash('recovery')">🔥 recovery</button>
        <button class="btn danger" onclick="fbWipe()">🗑 Wipe</button>
        <button class="btn" onclick="fbReboot()">🔄 إعادة تشغيل</button>
      </div><div id="fbDevices"></div></div>
      <div class="panel"><h2>📋 السجل</h2><div id="log"></div></div>`;
  }
};

window.adbRefresh = async () => {
  const list = await api.adb.devices();
  const d = document.getElementById('adbDevices')!;
  d.innerHTML = list.length ? '' : '<p>لا توجد أجهزة</p>';
  list.forEach((x: any) => {
    const el = document.createElement('div');
    el.className = 'device';
    el.textContent = `${x.serial} [${x.state}]`;
    el.onclick = () => {
      document.querySelectorAll('#adbDevices .device').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
      selectedAdb = x.serial;
    };
    d.appendChild(el);
  });
};

window.adbInstall = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  const r = await api.adb.install(selectedAdb);
  log(r.ok ? '✅ تم التثبيت' : `❌ ${r.err}`);
};
window.adbUninstall = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  const p = prompt('اسم الحزمة:'); if (!p) return;
  const r = await api.adb.uninstall(selectedAdb, p);
  log(r.ok ? '✅ تم' : `❌ ${r.err}`);
};
window.adbReset = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  if (!confirm('⚠ سيتم مسح كل البيانات')) return;
  const r = await api.adb.resetPattern(selectedAdb);
  log(r.ok ? '✅ تم' : `❌ ${r.err}`);
};
window.adbReboot = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  await api.adb.reboot(selectedAdb);
};

window.fbRefresh = async () => {
  const list = await api.fastboot.devices();
  const d = document.getElementById('fbDevices')!;
  d.innerHTML = list.length ? '' : '<p>لا توجد أجهزة</p>';
  list.forEach((s: string) => {
    const el = document.createElement('div');
    el.className = 'device'; el.textContent = s;
    el.onclick = () => {
      document.querySelectorAll('#fbDevices .device').forEach(e => e.classList.remove('active'));
      el.classList.add('active'); selectedFb = s;
    };
    d.appendChild(el);
  });
};
window.fbFlash = async (p: string) => {
  if (!selectedFb) return alert('اختر جهازاً');
  const r = await api.fastboot.flash(selectedFb, p);
  log(r.ok ? `✅ ${p}` : `❌ ${r.err}`);
};
window.fbUnlock = async () => {
  if (!selectedFb) return alert('اختر جهازاً');
  await api.fastboot.unlock(selectedFb);
};
window.fbWipe = async () => {
  if (!selectedFb) return alert('اختر جهازاً');
  if (!confirm('مسح البيانات؟')) return;
  const r = await api.fastboot.wipe(selectedFb);
  log(r.ok ? '✅' : `❌ ${r.err}`);
};
window.fbReboot = async () => {
  if (!selectedFb) return alert('اختر جهازاً');
  await api.fastboot.reboot(selectedFb);
};

window.show('adb');
