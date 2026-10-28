using System;
using System.IO.Ports;
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
            Log("جارٍ فحص منافذ COM للبحث عن أجهزة الأندرويد...");
            
            string[] ports = SerialPort.GetPortNames();
            if (ports.Length == 0)
            {
                Log("❌ لم يتم العثور على أي منافذ COM. تأكد من توصيل الهاتف في وضع EDL/BROM.");
                return;
            }

            foreach (string port in ports)
            {
                Log($"✅ تم العثور على منفذ: {port}");
                Log($"🔍 [تحليل] المنفذ {port} جاهز لاستقبال الأوامر.");
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