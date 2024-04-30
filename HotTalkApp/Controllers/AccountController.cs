using HotTalkApp.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotTalkApp.Controllers
{
    public class AccountController : Controller
    {
        public ViewResult FormIn()
        {

            return View();
        }

        [HttpPost]
        [ActionName("FormIn")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> FormIn(FormModel loginModel, string returnUrl = null)
        {
            if (ModelState.IsValid)
            {
                var claims = new[] {
                new Claim(ClaimTypes.Name, loginModel.Name),
                // Adicione outros claims conforme necessário
            };

                var claimsIdentity = new ClaimsIdentity(
                    claims, CookieAuthenticationDefaults.AuthenticationScheme);

                var authProperties = new AuthenticationProperties
                {
                    // Personalize as propriedades de autenticação conforme necessário
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(20) // Exemplo de expiração do cookie
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);

                return RedirectToAction("Index", "Home");
            }

            return View(loginModel);
        }

        [HttpPost]
        [ActionName("SignOut")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignOut()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("FormIn", "Account");
        }

    }
}
