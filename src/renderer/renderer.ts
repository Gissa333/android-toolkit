const api: any = (window as any).api;
let selectedAdb: string | null = null;
let selectedFb: string | null = null;

function log(m: string) {
  const e = document.getElementById('log');
  if (e) e.textContent += `\n${m}`;
}

// دالة عرض الواجهة الرئيسية
(window as any).show = (page: string) => {
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

// أكواد أزرار ADB
(window as any).adbRefresh = async () => {
  log("جارٍ البحث عن أجهزة...");
  const list = await api.adb.devices();
  const d = document.getElementById('adbDevices')!;
  d.innerHTML = list.length ? '' : '<p>لا توجد أجهزة متصلة</p>';
  list.forEach((x: any) => {
    const el = document.createElement('div');
    el.className = 'device'; el.textContent = `${x.serial} [${x.state}]`;
    el.onclick = () => {
      document.querySelectorAll('#adbDevices .device').forEach(e => e.classList.remove('active'));
      el.classList.add('active'); selectedAdb = x.serial;
    };
    d.appendChild(el);
  });
};
(window as any).adbInstall = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  const r = await api.adb.install(selectedAdb); log(r.ok ? '✅ تم التثبيت' : `❌ ${r.err}`);
};
(window as any).adbUninstall = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  const p = prompt('اسم الحزمة:'); if (!p) return;
  const r = await api.adb.uninstall(selectedAdb, p); log(r.ok ? '✅ تم' : `❌ ${r.err}`);
};
(window as any).adbReset = async () => {
  if (!selectedAdb) return alert('اختر جهازاً');
  if (!confirm('⚠ سيتم مسح كل البيانات')) return;
  const r = await api.adb.resetPattern(selectedAdb); log(r.ok ? '✅ تم' : `❌ ${r.err}`);
};
(window as any).adbReboot = async () => { if (selectedAdb) await api.adb.reboot(selectedAdb); };

// أكواد أزرار Fastboot
(window as any).fbRefresh = async () => {
  log("جارٍ البحث...");
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
(window as any).fbFlash = async (p: string) => {
  if (!selectedFb) return alert('اختر جهازاً');
  const r = await api.fastboot.flash(selectedFb, p); log(r.ok ? `✅ ${p}` : `❌ ${r.err}`);
};
(window as any).fbUnlock = async () => { if (selectedFb) await api.fastboot.unlock(selectedFb); };
(window as any).fbWipe = async () => {
  if (!selectedFb) return alert('اختر جهازاً');
  if (!confirm('مسح البيانات؟')) return;
  const r = await api.fastboot.wipe(selectedFb); log(r.ok ? '✅' : `❌ ${r.err}`);
};
(window as any).fbReboot = async () => { if (selectedFb) await api.fastboot.reboot(selectedFb); };

// 🟢 تشغيل البرنامج وعرض شريط التحميل إذا لزم الأمر
async function init() {
  const c = document.getElementById('content')!;
  c.innerHTML = `
    <div class="panel" style="text-align:center; padding-top:50px;">
      <h2 style="font-size: 22px; color: #007ACC;">⏳ جاري تحميل الأدوات اللازمة...</h2>
      <p style="color: #888;">يرجى الانتظار، يتم تحميل أدوات ADB و Fastboot لأول مرة.</p>
      <div style="width: 80%; margin: 20px auto; background: #333; border-radius: 10px; overflow: hidden; height: 20px;">
        <div id="progress-bar" style="height: 100%; width: 0%; background: #007ACC; transition: width 0.3s;"></div>
      </div>
      <p id="progress-text" style="font-weight: bold; font-size: 18px;">0%</p>
    </div>
  `;

  // استقبال نسبة التحميل وتحديث الشريط
  api.app.onProgress((percent: number) => {
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (bar && text) {
      bar.style.width = `${percent}%`;
      text.innerText = percent === 99 ? 'جاري فك الضغط...' : `${percent}%`;
    }
  });

  // بدء التحميل
  await api.app.startDownload();
  
  // بعد انتهاء التحميل، نفتح واجهة ADB
  (window as any).show('adb');
}

init();