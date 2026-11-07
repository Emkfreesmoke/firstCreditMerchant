"use strict";

/* =========================================================
   LOGIN PAGE
========================================================= */

/* =========================================================
   REMOVE LOGIN LOADER
========================================================= */

function removeLoginLoader() {
  const loader = document.querySelector(".page-loading");

  if (!loader) {
    return;
  }

  /*
   * Trigger the CSS fade-out.
   */

  loader.classList.remove("active");

  /*
   * Explicit styles are a safety fallback
   * in case the loader CSS does not transition
   * as expected.
   */

  loader.style.opacity = "0";

  loader.style.visibility = "hidden";

  loader.style.pointerEvents = "none";

  /*
   * Remove the loader completely after
   * the fade-out finishes.
   */

  setTimeout(function () {
    if (loader && loader.parentNode) {
      loader.remove();
    }
  }, 450);
}

/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  /* =====================================================
       LOGIN LOADER
    ====================================================== */

  setTimeout(removeLoginLoader, 500);

  /* =====================================================
       LUCIDE ICONS
    ====================================================== */

  if (
    typeof window.lucide !== "undefined" &&
    typeof window.lucide.createIcons === "function"
  ) {
    window.lucide.createIcons();
  }

  /* =====================================================
       PASSWORD ELEMENTS
    ====================================================== */

  const passwordInput = document.getElementById("password");

  const passwordToggle = document.getElementById("password-toggle");

  const showPasswordIcon = document.getElementById("show-password");

  const hidePasswordIcon = document.getElementById("hide-password");

  /* =====================================================
       PASSWORD SHOW / HIDE
    ====================================================== */

  if (passwordInput && passwordToggle && showPasswordIcon && hidePasswordIcon) {
    passwordToggle.addEventListener("click", function () {
      const passwordIsHidden = passwordInput.type === "password";

      passwordInput.type = passwordIsHidden ? "text" : "password";

      showPasswordIcon.classList.toggle("hidden", passwordIsHidden);

      hidePasswordIcon.classList.toggle("hidden", !passwordIsHidden);
    });
  }
});

/* =========================================================
   WINDOW LOAD
========================================================= */

window.addEventListener("load", function () {
  removeLoginLoader();
});

/* =========================================================
   EMERGENCY LOADER FALLBACK

   The Login page must never remain trapped behind
   the loading screen if another resource fails.
========================================================= */

setTimeout(function () {
  removeLoginLoader();
}, 2000);
