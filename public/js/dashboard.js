document.addEventListener("DOMContentLoaded", function () {
  initDashboardIcons();
  updateDashboardDate();
  initDashboardLoader();
});

function initDashboardIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function updateDashboardDate() {
  const elements = document.querySelectorAll("[data-dashboard-date]");

  if (!elements.length) {
    return;
  }

  const date = new Date();

  const formatted = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  elements.forEach(function (element) {
    element.textContent = formatted;
  });
}

function initDashboardLoader() {
  const loader = document.querySelector(".page-loading");

  if (!loader) {
    return;
  }

  setTimeout(function () {
    loader.classList.remove("active");

    setTimeout(function () {
      loader.remove();
    }, 400);
  }, 600);
}
function customerKycDocuments() {
  return {
    step: 1,

    documentType: "national-id",

    legalName: "",
    dateOfBirth: "",
    nationality: "",

    documentNumber: "",
    issueDate: "",
    expiryDate: "",

    address: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",

    front: {
      file: null,
      url: "",
      name: "",
      size: "",
      kind: "",
    },

    back: {
      file: null,
      url: "",
      name: "",
      size: "",
      kind: "",
    },

    additional: {
      file: null,
      url: "",
      name: "",
      size: "",
      kind: "",
    },

    goToDocuments() {
      if (
        !this.legalName ||
        !this.dateOfBirth ||
        !this.nationality ||
        !this.address ||
        !this.country
      ) {
        return;
      }

      this.step = 2;

      this.scrollTop();
    },

    goToReview() {
      if (!this.documentNumber || !this.front.file) {
        return;
      }

      this.step = 3;

      this.scrollTop();
    },

    previousStep() {
      if (this.step > 1) {
        this.step -= 1;
      }

      this.scrollTop();
    },

    selectFile(event, target) {
      const input = event.target;

      if (!input.files || !input.files.length) {
        return;
      }

      const file = input.files[0];

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Please select a JPG, PNG, WEBP, or PDF file.");

        input.value = "";

        return;
      }

      const maximumSize = 10 * 1024 * 1024;

      if (file.size > maximumSize) {
        alert("The selected file must not exceed 10 MB.");

        input.value = "";

        return;
      }

      this.revokeUrl(target);

      this[target] = {
        file: file,

        url: URL.createObjectURL(file),

        name: file.name,

        size: this.formatFileSize(file.size),

        kind: file.type === "application/pdf" ? "pdf" : "image",
      };

      this.refreshIcons();
    },

    clearFile(target) {
      this.revokeUrl(target);

      this[target] = {
        file: null,
        url: "",
        name: "",
        size: "",
        kind: "",
      };

      const inputIds = {
        front: "customer-kyc-front",

        back: "customer-kyc-back",

        additional: "customer-kyc-additional",
      };

      const input = document.getElementById(inputIds[target]);

      if (input) {
        input.value = "";
      }

      this.refreshIcons();
    },

    openPreview(item) {
      if (!item.url) {
        return;
      }

      window.open(item.url, "_blank", "noopener,noreferrer");
    },

    revokeUrl(target) {
      if (this[target] && this[target].url) {
        URL.revokeObjectURL(this[target].url);
      }
    },

    formatFileSize(bytes) {
      if (!bytes) {
        return "0 bytes";
      }

      const units = ["bytes", "KB", "MB", "GB"];

      const index = Math.floor(Math.log(bytes) / Math.log(1024));

      const value = bytes / Math.pow(1024, index);

      return value.toFixed(index === 0 ? 0 : 1) + " " + units[index];
    },

    refreshIcons() {
      this.$nextTick(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    },

    scrollTop() {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  };
}
