const api: any = (window as any).api;
let selectedAdb: string | null = null;
let selectedFb: string | null = null;

(window as any).show = (page: string) => {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(page));
  if (activeBtn) activeBtn.classList.add('active');

  const c = document.getElementById('content')!;
  
  if (page === 'dashboard') {
    c.innerHTML = `<div class="panel"><div class="panel-title">👋 مرحباً بك</div><p>هذا البرنامج الشامل لإدارة وصيانة هواتف الأندرويد. اختر أداة من القائمة.</p></div>
    <div class="panel"><div class="panel-title">📊 حالة النظام</div><div class="row"><button class="btn" onclick="checkEnv()">فحص الاتصال</button></div><div id="env-status">لم يتم الفحص.</div></div>`;
  } 
  else if (page === 'adb') {
    c.innerHTML = `<div class="panel"><div class="panel-title">📱 إدارة ADB</div>
      <div class="row">
        <button class="btn" onclick="adbRefresh()">🔄 تحديث</button>
        <button class="btn" onclick="adbInstall()">📦 تثبيت APK</button>
        <button class="btn" onclick="adbUninstall()">🗑 إزالة</button>
        <button class="btn danger" onclick="adbReset()">🔓 فتح النمط</button>
      </div><div id="adbDevices"></div></div>
      <div class="panel"><div class="panel-title">📋 السجل</div><div id="log-container"></div></div>`;
  } 
  else if (page === 'fastboot') {
    c.innerHTML = `<div class="panel"><div class="panel-title">⚡ إدارة Fastboot</div>
      <div class="row">
        <button class="btn" onclick="fbRefresh()">🔄 تحديث</button>
        <button class="btn" onclick="fbFlash('boot')">🔥 تفليش boot</button>
        <button class="btn" onclick="fbWipe()">🗑 مسح البيانات</button>
      </div><div id="fbDevices"></div></div>
      <div class="panel"><div class="panel-title">📋 السجل</div><div id="log-container"></div></div>`;
  }
  else {
    c.innerHTML = `<div class="panel"><div class="panel-title">🚧 قيد التطوير</div><p>هذه الميزة ستضاف في الخطوة القادمة.</p></div>`;
  }
};

(window as any).checkEnv = async () => {
  const list = await api.adb.devices();
  document.getElementById('env-status')!.innerText = list.length > 0 ? '✅ الهاتف متصل وجاهز.' : '⚠️ لا يوجد هاتف متصل.';
};

// --- دوال ADB ---
(window as any).adbRefresh = async () => {
  const d = document.getElementById('adbDevices')!;
  d.innerHTML = '<p>جارٍ البحث...</p>';
  const list = await api.adb.devices();
  if (list.length === 0) { d.innerHTML = '<p>❌ لا توجد أجهزة. تأكد من تفعيل USB Debugging.</p>'; return; }
  d.innerHTML = '';
  list.forEach((x: any) => {
    const el = document.createElement('div'); el.className = 'device'; el.innerHTML = `📱 ${x.serial} <span>[${x.state}]</span>`;
    el.onclick = () => { document.querySelectorAll('.device').forEach(e => e.classList.remove('active')); el.classList.add('active'); selectedAdb = x.serial; };
    d.appendChild(el);
  });
};
(window as any).adbInstall = async () => { if (!selectedAdb) return alert('اختر جهازاً'); await api.adb.install(selectedAdb); };
(window as any).adbUninstall = async () => { if (!selectedAdb) return alert('اختر جهازاً'); const p = prompt('اسم الحزمة:'); if(p) await api.adb.uninstall(selectedAdb, p); };
(window as any).adbReset = async () => { if (!selectedAdb) return alert('اختر جهازاً'); if(confirm('مسح القفل؟')) await api.adb.resetPattern(selectedAdb); };

// --- دوال Fastboot ---
(window as any).fbRefresh = async () => {
  const d = document.getElementById('fbDevices')!;
  d.innerHTML = '<p>جارٍ البحث...</p>';
  const list = await api.fastboot.devices();
  if (list.length === 0) { d.innerHTML = '<p>❌ لا توجد أجهزة في وضع Fastboot.</p>'; return; }
  d.innerHTML = '';
  list.forEach((s: string) => {
    const el = document.createElement('div'); el.className = 'device'; el.innerText = `⚡ ${s}`;
    el.onclick = () => { document.querySelectorAll('.device').forEach(e => e.classList.remove('active')); el.classList.add('active'); selectedFb = s; };
    d.appendChild(el);
  });
};
(window as any).fbFlash = async (p: string) => { if (!selectedFb) return alert('اختر جهازاً'); await api.fastboot.flash(selectedFb, p); };
(window as any).fbWipe = async () => { if (!selectedFb) return alert('اختر جهازاً'); if(confirm('مسح البيانات؟')) await api.fastboot.wipe(selectedFb); };

// 🟢 تشغيل البرنامج
async function init() {
  const c = document.getElementById('content')!;
  c.innerHTML = `<div style="text-align:center; padding-top: 100px;"><h2>⏳ جاري التحميل...</h2><div style="width: 60%; margin: 20px auto; background: #333; height: 20px; border-radius: 10px;"><div id="p-bar" style="height: 100%; width: 0%; background: #007acc; transition: 0.3s;"></div></div><p id="p-txt">0%</p></div>`;
  api.app.onProgress((percent: number) => {
    document.getElementById('p-bar')!.style.width = `${percent}%`;
    document.getElementById('p-txt')!.innerText = percent === 99 ? 'جاري فك الضغط...' : `${percent}%`;
  });
  await api.app.startDownload();
  setTimeout(() => { (window as any).show('dashboard'); }, 500);
}
init();