document.addEventListener("DOMContentLoaded", function () {
  initializeAdminIcons();
  initializeAdminLoader();
});

function initializeAdminIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function initializeAdminLoader() {
  const loader = document.querySelector(".admin-loading");

  if (!loader) {
    return;
  }

  window.setTimeout(function () {
    loader.classList.remove("active");

    window.setTimeout(function () {
      loader.remove();
    }, 350);
  }, 500);
}

/*
 * Loader fallback.
 */
window.setTimeout(function () {
  const loader = document.querySelector(".admin-loading");

  if (loader) {
    loader.remove();
  }
}, 3000);
function kycDocuments() {
    return {
        documentType: "national-id",

        front: {
            file: null,
            url: "",
            name: "",
            size: "",
            kind: ""
        },

        back: {
            file: null,
            url: "",
            name: "",
            size: "",
            kind: ""
        },

        additional: {
            file: null,
            url: "",
            name: "",
            size: "",
            kind: ""
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
                "application/pdf"
            ];


            if (!allowedTypes.includes(file.type)) {
                alert(
                    "Please select a JPG, PNG, WEBP, or PDF document."
                );

                input.value = "";

                return;
            }


            /*
             * 10 MB UI limit for the prototype.
             * Server-side validation must independently
             * enforce limits when uploads are implemented.
             */
            const maxSize =
                10 * 1024 * 1024;


            if (file.size > maxSize) {
                alert(
                    "The selected document is larger than 10 MB."
                );

                input.value = "";

                return;
            }


            this.revokeUrl(target);


            this[target] = {
                file: file,

                url:
                    URL.createObjectURL(file),

                name:
                    file.name,

                size:
                    this.formatFileSize(
                        file.size
                    ),

                kind:
                    file.type ===
                    "application/pdf"
                        ? "pdf"
                        : "image"
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
                kind: ""
            };


            const inputMap = {
                front:
                    "kyc-document-front",

                back:
                    "kyc-document-back",

                additional:
                    "kyc-additional-document"
            };


            const input =
                document.getElementById(
                    inputMap[target]
                );


            if (input) {
                input.value = "";
            }


            this.refreshIcons();
        },


        clearAll() {
            this.clearFile("front");
            this.clearFile("back");
            this.clearFile("additional");
        },


        openPreview(item) {
            if (!item.url) {
                return;
            }

            window.open(
                item.url,
                "_blank",
                "noopener,noreferrer"
            );
        },


        revokeUrl(target) {
            if (
                this[target] &&
                this[target].url
            ) {
                URL.revokeObjectURL(
                    this[target].url
                );
            }
        },


        formatFileSize(bytes) {
            if (!bytes) {
                return "0 bytes";
            }

            const units = [
                "bytes",
                "KB",
                "MB",
                "GB"
            ];

            const index =
                Math.floor(
                    Math.log(bytes) /
                    Math.log(1024)
                );

            const value =
                bytes /
                Math.pow(
                    1024,
                    index
                );


            return (
                value.toFixed(
                    index === 0
                        ? 0
                        : 1
                ) +
                " " +
                units[index]
            );
        },


        refreshIcons() {
            this.$nextTick(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
        }
    };
}