using System;
using System.Management;
using System.Windows;

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
                // البحث عن أي أجهزة متصلة بمنافذ COM باستخدام مكتبة النظام
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

                    if (!found)
                    {
                        Log("❌ لم يتم العثور على أي منافذ COM. تأكد من توصيل الهاتف في وضع EDL/BROM.");
                    }
                }
            }
            catch (Exception ex)
            {
                Log($"❌ حدث خطأ أثناء الفحص: {ex.Message}");
            }
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
                        FileName = "adb",
                        Arguments = "devices",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                process.Start();
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();
                Log("نتيجة الفحص:\n" + output);
            }
            catch
            {
                Log("⚠️ لم يتم العثور على أداة ADB في النظام. (سيتم دمجها في التحديث القادم).");
            }
        }
    }
}