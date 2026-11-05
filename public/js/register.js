document.addEventListener("DOMContentLoaded", function () {
  if (window.lucide) {
    lucide.createIcons();
  }

  const usernameInput = document.getElementById("username");

  if (usernameInput) {
    usernameInput.addEventListener("keydown", function (event) {
      if (event.key === " ") {
        event.preventDefault();
      }
    });
  }

  const pinInput = document.getElementById("pin");

  if (pinInput) {
    pinInput.addEventListener("input", function () {
      pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 4);
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
