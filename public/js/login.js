document.addEventListener("DOMContentLoaded", function () {
  if (window.lucide) {
    lucide.createIcons();
  }

  const passwordInput = document.getElementById("password");

  const passwordToggle = document.getElementById("password-toggle");

  const showPasswordIcon = document.getElementById("show-password");

  const hidePasswordIcon = document.getElementById("hide-password");

  if (passwordInput && passwordToggle && showPasswordIcon && hidePasswordIcon) {
    passwordToggle.addEventListener("click", function () {
      const passwordIsHidden = passwordInput.type === "password";

      passwordInput.type = passwordIsHidden ? "text" : "password";

      showPasswordIcon.classList.toggle("hidden", passwordIsHidden);

      hidePasswordIcon.classList.toggle("hidden", !passwordIsHidden);
    });
  }

  const preloader = document.querySelector(".page-loading");

  if (preloader) {
    setTimeout(function () {
      preloader.classList.remove("active");

      setTimeout(function () {
        preloader.remove();
      }, 500);
    }, 800);
  }
});
