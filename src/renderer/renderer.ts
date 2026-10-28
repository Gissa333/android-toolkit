const api: any = (window as any).api;
let selectedAdb: string | null = null;
let selectedFb: string | null = null;

// دالة تسجيل الأحداث في الـ Console
function log(m: string) {
  const e = document.getElementById('log-container');
  if (e) {
    e.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${m}</div>`;
    e.scrollTop = e.scrollHeight;
  }
}

// دالة تغيير الصفحات
(window as any).show = (page: string) => {
  // تحديث الزر النشط في القائمة الجانبية
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(page));
  if (activeBtn) activeBtn.classList.add('active');

  const c = document.getElementById('content')!;
  
  if (page === 'dashboard') {
    c.innerHTML = `
      <div class="panel">
        <div class="panel-title">👋 مرحباً بك في Android Toolkit Pro</div>
        <p style="color: #aaa; line-height: 1.6;">هذا البرنامج الشامل مصمم لإدارة وصيانة هواتف الأندرويد. اختر أداة من القائمة الجانبية للبدء.</p>
      </div>
      <div class="panel">
        <div class="panel-title">📊 حالة النظام</div>
        <div class="row">
          <button class="btn success" onclick="checkEnv()">فحص البيئة</button>
        </div>
        <div id="env-status" style="color: #aaa;">لم يتم الفحص بعد.</div>
      </div>
    `;
  } 
  else if (page === 'adb') {
    c.innerHTML = `
      <div class="panel">
        <div class="panel-title">📱 إدارة ADB (وضع التطبيقات)</div>
        <div class="row">
          <button class="btn" onclick="adbRefresh()">🔄 تحديث الأجهزة</button>
          <button class="btn" onclick="adbInstall()">📦 تثبيت APK</button>
          <button class="btn" onclick="adbUninstall()">🗑 إزالة تطبيق</button>
          <button class="btn danger" onclick="adbReset()">🔓 فتح النمط</button>
          <button class="btn" onclick="adbReboot()">🔄 إعادة تشغيل</button>
        </div>
        <div id="adbDevices" style="margin-top: 20px;">
          <p style="color: #888;">اضغط على "تحديث" للبحث عن أجهزة.</p>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">📋 سجل العمليات (Console)</div>
        <div id="log-container"></div>
      </div>
    `;
  } 
  else if (page === 'fastboot') {
    c.innerHTML = `
      <div class="panel">
        <div class="panel-title">⚡ إدارة Fastboot (وضع التفليش)</div>
        <div class="row">
          <button class="btn" onclick="fbRefresh()">🔄 تحديث الأجهزة</button>
          <button class="btn" onclick="fbUnlock()">🔓 فتح Bootloader</button>
          <button class="btn" onclick="fbFlash('boot')">🔥 تفليش boot</button>
          <button class="btn" onclick="fbFlash('recovery')">🔥 تفليش recovery</button>
          <button class="btn danger" onclick="fbWipe()">🗑 مسح البيانات</button>
          <button class="btn" onclick="fbReboot()">🔄 إعادة تشغيل</button>
        </div>
        <div id="fbDevices" style="margin-top: 20px;">
          <p style="color: #888;">اضغط على "تحديث" للبحث عن أجهزة.</p>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">📋 سجل العمليات (Console)</div>
        <div id="log-container"></div>
      </div>
    `;
  }
  else if (page === 'samsung') {
    c.innerHTML = `<div class="panel"><div class="panel-title">🔷 أدوات سامسونج (Odin)</div><p style="color:#aaa;">قيد التطوير في التحديث القادم...</p></div>`;
  }
  else if (page === 'mtk') {
    c.innerHTML = `<div class="panel"><div class="panel-title">🔶 أدوات MediaTek</div><p style="color:#aaa;">قيد التطوير في التحديث القادم...</p></div>`;
  }
};

// --- دوال ADB ---
(window as any).adbRefresh = async () => {
  log("⏳ جارٍ البحث عن أجهزة ADB...");
  const list = await api.adb.devices();
  const d = document.getElementById('adbDevices')!;
  if (list.length === 0) {
    d.innerHTML = '<p style="color: #ff6b6b;">❌ لا توجد أجهزة متصلة. تأكد من تفعيل USB Debugging.</p>';
    return;
  }
  d.innerHTML = '';
  list.forEach((x: any) => {
    const el = document.createElement('div');
    el.className = 'device'; 
    el.innerHTML = `<span>📱 ${x.serial}</span> <span style="color: #28a745;">[${x.state}]</span>`;
    el.onclick = () => {
      document.querySelectorAll('#adbDevices .device').forEach(e => e.classList.remove('active'));
      el.classList.add('active'); selectedAdb = x.serial;
      log(`✅ تم تحديد الجهاز: ${x.serial}`);
    };
    d.appendChild(el);
  });
};

(window as any).adbInstall = async () => {
  if (!selectedAdb) return alert('الرجاء تحديد جهاز أولاً!');
  log(`⏳ جارٍ تثبيت APK على ${selectedAdb}...`);
  const r = await api.adb.install(selectedAdb); 
  log(r.ok ? '✅ تم التثبيت بنجاح.' : `❌ فشل التثبيت: ${r.err}`);
};

(window as any).adbUninstall = async () => {
  if (!selectedAdb) return alert('الرجاء تحديد جهاز أولاً!');
  const p = prompt('أدخل اسم الحزمة (مثال: com.facebook.katana):'); if (!p) return;
  log(`⏳ جارٍ إزالة ${p}...`);
  const r = await api.adb.uninstall(selectedAdb, p); 
  log(r.ok ? '✅ تمت الإزالة.' : `❌ فشل: ${r.err}`);
};

(window as any).adbReset = async () => {
  if (!selectedAdb) return alert('الرجاء تحديد جهاز أولاً!');
  if (!confirm('⚠️ تحذير: سيتم مسح النمط/كلمة المرور. متابعة؟')) return;
  log(`⏳ جارٍ مسح ملفات القفل...`);
  const r = await api.adb.resetPattern(selectedAdb); 
  log(r.ok ? '✅ تم المسح بنجاح.' : `❌ فشل: ${r.err}`);
};

(window as any).adbReboot = async () => {
  if (!selectedAdb) return alert('الرجاء تحديد جهاز أولاً!');
  log(`⏳ جارٍ إعادة التشغيل...`);
  await api.adb.reboot(selectedAdb);
};

// --- دوال Fastboot ---
(window as any).fbRefresh = async () => {
  log("⏳ جارٍ البحث عن أجهزة Fastboot...");
  const list = await api.fastboot.devices();
  const d = document.getElementById('fbDevices')!;
  if (list.length === 0) {
    d.innerHTML = '<p style="color: #ff6b6b;">❌ لا توجد أجهزة في وضع Fastboot.</p>';
    return;
  }
  d.innerHTML = '';
  list.forEach((s: string) => {
    const el = document.createElement('div');
    el.className = 'device'; el.innerHTML = `<span>⚡ ${s}</span>`;
    el.onclick = () => {
      document.querySelectorAll('#fbDevices .device').forEach(e => e.classList.remove('active'));
      el.classList.add('active'); selectedFb = s;
      log(`✅ تم تحديد جهاز Fastboot: ${s}`);
    };
    d.appendChild(el);
  });
};

(window as any).fbFlash = async (p: string) => {
  if (!selectedFb) return alert('الرجاء تحديد جهاز أولاً!');
  log(`⏳ جارٍ تفليش ${p}...`);
  const r = await api.fastboot.flash(selectedFb, p); 
  log(r.ok ? `✅ تم تفليش ${p} بنجاح.` : `❌ فشل التفليش: ${r.err}`);
};

(window as any).fbUnlock = async () => {
  if (!selectedFb) return alert('الرجاء تحديد جهاز أولاً!');
  log("⏳ جارٍ محاولة فتح Bootloader...");
  await api.fastboot.unlock(selectedFb);
};

(window as any).fbWipe = async () => {
  if (!selectedFb) return alert('الرجاء تحديد جهاز أولاً!');
  if (!confirm('⚠️ تحذير: سيتم مسح جميع بيانات الهاتف. متابعة؟')) return;
  log("⏳ جارٍ مسح البيانات...");
  const r = await api.fastboot.wipe(selectedFb); 
  log(r.ok ? '✅ تم المسح.' : `❌ فشل: ${r.err}`);
};

(window as any).fbReboot = async () => {
  if (selectedFb) await api.fastboot.reboot(selectedFb);
};

// --- دوال النظام ---
(window as any).checkEnv = async () => {
  const e = document.getElementById('env-status');
  if (e) {
    e.innerHTML = '⏳ جارٍ الفحص...';
    // نتحقق من وجود الهاتف فقط كمؤشر
    const list = await api.adb.devices();
    if (list.length > 0) {
      e.innerHTML = '<span style="color: #28a745;">✅ النظام جاهز والأجهزة متصلة.</span>';
    } else {
      e.innerHTML = '<span style="color: #ffc107;">⚠️ الأدوات جاهزة، لكن لا يوجد هاتف متصل.</span>';
    }
  }
};

// 🟢 تشغيل البرنامج
async function init() {
  const c = document.getElementById('content')!;
  
  // عرض شريط التحميل
  c.innerHTML = `
    <div style="text-align:center; padding-top: 100px;">
      <h2 style="font-size: 24px; color: #007ACC; margin-bottom: 10px;">⏳ جاري تحميل الأدوات اللازمة...</h2>
      <p style="color: #888; margin-bottom: 30px;">يتم تحميل أدوات ADB و Fastboot لأول مرة (مرة واحدة فقط).</p>
      
      <div class="progress-container" style="width: 60%; margin: 0 auto;">
        <div id="progress-bar" class="progress-bar"></div>
      </div>
      
      <p id="progress-text" style="font-weight: bold; font-size: 20px; color: #fff; margin-top: 15px;">0%</p>
    </div>
  `;

  api.app.onProgress((percent: number) => {
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (bar && text) {
      bar.style.width = `${percent}%`;
      text.innerText = percent === 99 ? 'جاري فك الضغط (قد يستغرق دقيقة)...' : `${percent}%`;
    }
  });

  await api.app.startDownload();
  
  setTimeout(() => {
    (window as any).show('dashboard');
  }, 500);
}

init();