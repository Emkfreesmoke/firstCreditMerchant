"use strict";

/* =========================================================
   REGISTER PAGE
========================================================= */

/* =========================================================
   REMOVE REGISTRATION LOADER
========================================================= */

function removeRegisterLoader() {
  const loader = document.querySelector(".page-loading");

  if (!loader) {
    return;
  }

  /*
   * Start CSS fade-out.
   */

  loader.classList.remove("active");

  /*
   * Safety styles.
   */

  loader.style.opacity = "0";

  loader.style.visibility = "hidden";

  loader.style.pointerEvents = "none";

  /*
   * Remove completely after fade-out.
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
       LOADER
    ====================================================== */

  setTimeout(removeRegisterLoader, 500);

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
       USERNAME
       Prevent spaces in username.
    ====================================================== */

  const usernameInput = document.getElementById("username");

  if (usernameInput) {
    usernameInput.addEventListener("keydown", function (event) {
      if (event.key === " ") {
        event.preventDefault();
      }
    });
  }

  /* =====================================================
       TRANSACTION PIN
       Numbers only, maximum four digits.
    ====================================================== */

  const pinInput = document.getElementById("pin");

  if (pinInput) {
    pinInput.addEventListener("input", function () {
      pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 4);
    });
  }
});

/* =========================================================
   WINDOW LOAD
========================================================= */

window.addEventListener("load", function () {
  removeRegisterLoader();
});

/* =========================================================
   EMERGENCY LOADER FALLBACK

   Even if an external resource fails,
   Registration must remain accessible.
========================================================= */

setTimeout(function () {
  removeRegisterLoader();
}, 2000);
