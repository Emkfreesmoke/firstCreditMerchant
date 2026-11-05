function pinInterface() {
  return {
    pin: "",
    maxLength: 4,

    isProcessing: false,

    errorMessage: "",
    successMessage: "",

    init() {
      this.$nextTick(() => {
        refreshPinIcons();
        focusDesktopPin();
      });
    },

    addDigit(digit) {
      if (this.isProcessing || this.pin.length >= this.maxLength) {
        return;
      }

      this.pin += String(digit);

      refreshPinIcons();
    },

    removeDigit() {
      if (this.isProcessing) {
        return;
      }

      this.pin = this.pin.slice(0, -1);

      refreshPinIcons();
    },

    clearPin() {
      if (this.isProcessing) {
        return;
      }

      this.pin = "";

      this.errorMessage = "";
      this.successMessage = "";

      refreshPinIcons();
    },

    previewVerification() {
      this.errorMessage = "";
      this.successMessage = "";

      if (this.pin.length !== this.maxLength) {
        this.errorMessage = "Please enter all 4 digits.";

        return;
      }

      /*
       * UI-only prototype.
       *
       * No PIN is transmitted and no
       * credential validation occurs here.
       */
      this.isProcessing = true;

      setTimeout(() => {
        this.isProcessing = false;

        this.successMessage = "PIN entry is complete.";

        refreshPinIcons();
      }, 500);
    },
  };
}

document.addEventListener("DOMContentLoaded", function () {
  refreshPinIcons();
  initializePinLoader();
  focusDesktopPin();
});

function refreshPinIcons() {
  if (window.lucide) {
    setTimeout(function () {
      lucide.createIcons();
    }, 0);
  }
}

function focusDesktopPin() {
  if (window.innerWidth < 768) {
    return;
  }

  const input = document.getElementById("desktop-pin");

  if (input) {
    input.focus();
  }
}

function initializePinLoader() {
  const loader = document.querySelector(".page-loading");

  if (!loader) {
    return;
  }

  setTimeout(function () {
    loader.classList.remove("active");

    setTimeout(function () {
      loader.remove();
    }, 500);
  }, 800);
}
