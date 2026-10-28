using System;
using System.Management;
using System.Windows;
using Microsoft.Win32;
using System.IO;
using System.Diagnostics;

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

        // دالة لتنفيذ أوامر ADB وقراءة النتيجة
        private string RunAdbCommand(string arguments)
        {
            try
            {
                Process process = new Process();
                process.StartInfo.FileName = "adb";
                process.StartInfo.Arguments = arguments;
                process.StartInfo.RedirectStandardOutput = true;
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.CreateNoWindow = true;
                process.Start();
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();
                return output.Trim();
            }
            catch { return "ERROR"; }
        }

        private void BtnConnect_Click(object sender, RoutedEventArgs e)
        {
            Log("⏳ جارٍ البحث عن هواتف ADB...");
            string output = RunAdbCommand("devices");
            if (output == "ERROR") { Log("⚠️ أداة ADB غير مثبتة في النظام."); return; }
            Log("نتيجة الفحص:\n" + output);
        }

        private void BtnGetInfo_Click(object sender, RoutedEventArgs e)
        {
            Log("⏳ جارٍ سحب معلومات الهاتف...");
            
            string model = RunAdbCommand("shell getprop ro.product.model");
            string androidVer = RunAdbCommand("shell getprop ro.build.version.release");
            string cpu = RunAdbCommand("shell getprop ro.product.cpu.abi");

            if (model == "ERROR" || string.IsNullOrEmpty(model))
            {
                Log("❌ فشل الاتصال. تأكد من توصيل الهاتف وتفعيل USB Debugging.");
                InfoPanel.Visibility = Visibility.Collapsed;
                return;
            }

            TxtModel.Text = $"📱 الموديل: {model}";
            TxtAndroid.Text = $"🤖 الأندرويد: {androidVer}";
            TxtCpu.Text = $"⚙️ المعالج: {cpu}";
            InfoPanel.Visibility = Visibility.Visible;

            Log($"✅ تم سحب المعلومات: {model} | Android {androidVer}");
        }

        private void BtnUsb_Click(object sender, RoutedEventArgs e)
        {
            LogList.Items.Clear();
            Log("جارٍ فحص منافذ USB...");
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PnPEntity WHERE Caption LIKE '%(COM%'"))
                {
                    var ports = searcher.Get();
                    bool found = false;
                    foreach (var port in ports)
                    {
                        string name = port["Caption"]?.ToString() ?? "";
                        Log($"✅ جهاز: {name}");
                        found = true;
                    }
                    if (!found) Log("❌ لم يتم العثور على أي منافذ COM.");
                }
            }
            catch (Exception ex) { Log($"❌ خطأ: {ex.Message}"); }
        }

        private void BtnLoadFirmware_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog();
            openFileDialog.Filter = "Flash Files (*.tar.md5;*.tgz;*.zip;*.bin)|*.tar.md5;*.tgz;*.zip;*.bin|All Files (*.*)|*.*";
            openFileDialog.Title = "اختر ملف الفلاشة";

            if (openFileDialog.ShowDialog() == true)
            {
                FileInfo fileInfo = new FileInfo(openFileDialog.FileName);
                double sizeInMB = fileInfo.Length / (1024.0 * 1024.0);
                TxtFileInfo.Text = $"📄 {fileInfo.Name}\nالحجم: {sizeInMB:F2} MB";
                Log($"✅ تم تحميل: {fileInfo.Name} ({sizeInMB:F2} MB)");
            }
        }
    }
}