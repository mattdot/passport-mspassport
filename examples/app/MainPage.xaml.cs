using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.Security.Credentials;
using Windows.Security.Cryptography.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Windows.Web.Http;

// The Blank Page item template is documented at http://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x409

namespace PassportApp
{
    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            this.InitializeComponent();
        }

        protected async override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);

            await PassportStatusAsync();
        }

        private async Task PassportStatusAsync()
        {
            if (await KeyCredentialManager.IsSupportedAsync())
            {
                HelloCapable.Text = "supported";
            }
            else
            {
                HelloCapable.Text = "not supported";
            }

            //todo: check if logged in

            var kc = await KeyCredentialManager.OpenAsync("user1");
            if (kc.Status == KeyCredentialStatus.NotFound)
            {
                RegStatus.Text = "You have not registered with the sample app yet";
                RegisterPanel.Visibility = Visibility.Visible;
            }
            else if (kc.Status == KeyCredentialStatus.Success)
            {
                LoginButton.Visibility = Visibility.Visible;
                var pk = kc.Credential.RetrievePublicKey(Windows.Security.Cryptography.Core.CryptographicPublicKeyBlobType.X509SubjectPublicKeyInfo);
                RegStatus.Text = "You have registered and your public key is" + Convert.ToBase64String(pk.ToArray());
            }
        }

        private async void RegisterButton_Click(object sender, RoutedEventArgs e)
        {
            var kc = await KeyCredentialManager.RequestCreateAsync("user1", KeyCredentialCreationOption.ReplaceExisting);
            var pk = kc.Credential.RetrievePublicKey(CryptographicPublicKeyBlobType.X509SubjectPublicKeyInfo);
            var challenge = ""; //get challenge

            var user = new
            {
                preferredUsername = UsernameBox.Text,
                displayName = FirstNameBox.Text + " " + LastNameBox.Text,
                credentials = new
                {
                    keys = new[] { Convert.ToBase64String(pk.ToArray()) }
                }
            };

            var json = Newtonsoft.Json.JsonConvert.SerializeObject(user);
            Debug.WriteLine(json);

            using (var rest = new HttpClient())
            {
                var regResponse = await rest.PutAsync(new Uri("http://localhost:1339/register", UriKind.Absolute), new HttpStringContent(json, Windows.Storage.Streams.UnicodeEncoding.Utf8, "application/json"));
                RegStatus.Text = await regResponse.Content.ReadAsStringAsync();
            }
        }

        private async Task<string> GetChallengeViaHeaders(string pk)
        {
            using (var rest = new HttpClient())
            {
                var req = new HttpRequestMessage(HttpMethod.Post, new Uri("http://localhost:1339/auth/mspassport", UriKind.Absolute));
                req.Headers.Accept.Add(new Windows.Web.Http.Headers.HttpMediaTypeWithQualityHeaderValue("application/json"));
                req.Headers.Authorization = new Windows.Web.Http.Headers.HttpCredentialsHeaderValue("MSPassport",
                    $"key=\"{pk}\"");

                var res = await rest.SendRequestAsync(req);
                var auth = res.Headers.WwwAuthenticate.FirstOrDefault(x => "MSPassport".Equals(x.Scheme, StringComparison.OrdinalIgnoreCase));
                if (null != auth)
                {
                    return auth.Parameters.Where(x => "challenge".Equals(x.Name)).Select(x => x.Value).FirstOrDefault();
                }
                else
                {
                    return null;
                }
            }
        }

        private async Task AuthViaHeaders(string pk, string challenge, string signature)
        {
            using (var rest = new HttpClient())
            {
                var req = new HttpRequestMessage(HttpMethod.Post, new Uri("http://localhost:1339/auth/mspassport", UriKind.Absolute));
                req.Headers.Accept.Add(new Windows.Web.Http.Headers.HttpMediaTypeWithQualityHeaderValue("application/json"));
                req.Headers.Authorization = new Windows.Web.Http.Headers.HttpCredentialsHeaderValue("MSPassport",
                    $"key=\"{pk}\",challenge=\"{challenge}\",signature=\"{signature}\"\"");
            }
        }

        private async void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            var kc = await KeyCredentialManager.OpenAsync("user1");
            var pk = kc.Credential.RetrievePublicKey(CryptographicPublicKeyBlobType.X509SubjectPublicKeyInfo);
            var pk64 = Convert.ToBase64String(pk.ToArray());
            var challenge = await GetChallengeViaHeaders(pk64);
            Debug.Write(challenge);
        }

        private async void ResetButton_Click(object sender, RoutedEventArgs e)
        {
            await KeyCredentialManager.DeleteAsync("user1");
        }
    }
}