using System;
using System.Management;
using System.Windows;
using Microsoft.Win32;
using System.IO;

namespace Gissa333.AndroidToolkit
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Log("مرحباً بك في Gissa333 Android Toolkit.");
            Log("هذا البرنامج مبني من الصفر بواسطة Gissa333.");
        }

        private void Log(string message)
        {
            LogList.Items.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
            LogList.ScrollIntoView(LogList.Items[LogList.Items.Count - 1]);
        }

        private void BtnUsb_Click(object sender, RoutedEventArgs e)
        {
            LogList.Items.Clear();
            Log("جارٍ فحص منافذ USB للبحث عن أجهزة الأندرويد...");
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PnPEntity WHERE Caption LIKE '%(COM%'"))
                {
                    var ports = searcher.Get();
                    bool found = false;
                    foreach (var port in ports)
                    {
                        string name = port["Caption"]?.ToString() ?? "";
                        Log($"✅ تم العثور على جهاز: {name}");
                        found = true;
                    }
                    if (!found) Log("❌ لم يتم العثور على أي منافذ COM.");
                }
            }
            catch (Exception ex) { Log($"❌ حدث خطأ: {ex.Message}"); }
        }

        private void BtnConnect_Click(object sender, RoutedEventArgs e)
        {
            Log("⏳ جارٍ البحث عن هواتف ADB...");
            try
            {
                var process = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "adb", Arguments = "devices", RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true
                    }
                };
                process.Start();
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();
                Log("نتيجة الفحص:\n" + output);
            }
            catch { Log("⚠️ أداة ADB غير مثبتة في النظام."); }
        }

        private void BtnLoadFirmware_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog();
            openFileDialog.Filter = "Flash Files (*.tar.md5;*.tgz;*.zip;*.bin)|*.tar.md5;*.tgz;*.zip;*.bin|All Files (*.*)|*.*";
            openFileDialog.Title = "اختر ملف الفلاشة (Firmware)";

            if (openFileDialog.ShowDialog() == true)
            {
                string filePath = openFileDialog.FileName;
                FileInfo fileInfo = new FileInfo(filePath);
                double sizeInMB = fileInfo.Length / (1024.0 * 1024.0);

                TxtFileInfo.Text = $"📄 {fileInfo.Name}\nالحجم: {sizeInMB:F2} MB";
                Log($"✅ تم تحميل ملف: {fileInfo.Name}");
                Log($"🔍 الحجم: {sizeInMB:F2} ميجابايت");
                Log("💡 الملف جاهز للتحليل.");
            }
        }
    }
}