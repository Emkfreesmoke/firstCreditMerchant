document.addEventListener("DOMContentLoaded", function () {
  const configElement = document.getElementById("deposit-page-config");

  const methodSelect = document.getElementById("deposit-method");

  const cryptoSelect = document.getElementById("crypto-asset");

  const traditionalSection = document.getElementById(
    "traditional-deposit-section",
  );

  const cryptoSection = document.getElementById("crypto-deposit-section");

  const cryptoWalletDetails = document.getElementById("crypto-wallet-details");

  const cryptoSubmissionFields = document.getElementById(
    "crypto-submission-fields",
  );

  const cryptoTransactionHash = document.getElementById("transactionHash");

  const copyButton = document.getElementById("copy-wallet-address");

  /*
   * This script is included globally,
   * so quietly stop on pages that are
   * not the Deposits page.
   */

  if (!configElement || !methodSelect) {
    return;
  }

  /* =====================================================
       HELPERS
    ====================================================== */

  function decode(value) {
    try {
      return decodeURIComponent(value || "");
    } catch (error) {
      return value || "";
    }
  }

  function show(element) {
    if (!element) {
      return;
    }

    element.classList.remove("hidden");
  }

  function hide(element) {
    if (!element) {
      return;
    }

    element.classList.add("hidden");
  }

  /* =====================================================
       ADMIN-CONFIGURED TRADITIONAL METHODS
    ====================================================== */

  const traditionalInstructions = {
    "Bank Transfer": decode(configElement.dataset.bankInstructions),

    "Wire Transfer": decode(configElement.dataset.wireInstructions),

    "Cash Deposit": decode(configElement.dataset.cashInstructions),

    Check: decode(configElement.dataset.checkInstructions),

    Other: decode(configElement.dataset.otherInstructions),
  };

  /* =====================================================
       ADMIN-CONFIGURED CRYPTO METHODS
    ====================================================== */

  const cryptoSettings = {
    BTC: {
      name: "Bitcoin (BTC)",

      network: decode(configElement.dataset.btcNetwork),

      address: decode(configElement.dataset.btcAddress),

      instructions: decode(configElement.dataset.btcInstructions),
    },

    USDT: {
      name: "USDT",

      network: decode(configElement.dataset.usdtNetwork),

      address: decode(configElement.dataset.usdtAddress),

      instructions: decode(configElement.dataset.usdtInstructions),
    },

    ETH: {
      name: "Ethereum (ETH)",

      network: decode(configElement.dataset.ethNetwork),

      address: decode(configElement.dataset.ethAddress),

      instructions: decode(configElement.dataset.ethInstructions),
    },
  };

  /* =====================================================
       RESET CRYPTO DETAILS
    ====================================================== */

  function resetCryptoDetails() {
    hide(cryptoWalletDetails);

    hide(cryptoSubmissionFields);

    if (cryptoTransactionHash) {
      cryptoTransactionHash.required = false;
    }
  }

  /* =====================================================
       DEPOSIT METHOD SELECTION
    ====================================================== */

  function updateDepositMethod() {
    const method = methodSelect.value;

    hide(traditionalSection);

    hide(cryptoSection);

    resetCryptoDetails();

    if (!method) {
      return;
    }

    /*
     * Cryptocurrency gets a second
     * selector for BTC / USDT / ETH.
     */

    if (method === "Cryptocurrency") {
      show(cryptoSection);

      /*
       * Restore selected crypto if the
       * server sent the form back after
       * validation.
       */

      if (cryptoSelect && cryptoSelect.value) {
        updateCryptoDetails();
      }

      return;
    }

    /*
     * Traditional methods show their
     * Admin-configured instructions.
     */

    const methodName = document.getElementById("traditional-method-name");

    const instructions = document.getElementById("traditional-instructions");

    if (methodName) {
      methodName.textContent = method;
    }

    if (instructions) {
      instructions.textContent =
        traditionalInstructions[method] ||
        "Follow the deposit instructions provided by the administrator.";
    }

    show(traditionalSection);
  }

  /* =====================================================
       CRYPTO SELECTION
    ====================================================== */

  function updateCryptoDetails() {
    if (!cryptoSelect) {
      return;
    }

    const asset = cryptoSelect.value;

    const crypto = cryptoSettings[asset];

    if (!crypto) {
      resetCryptoDetails();

      return;
    }

    const cryptoName = document.getElementById("crypto-name");

    const cryptoNetwork = document.getElementById("crypto-network");

    const cryptoAddress = document.getElementById("crypto-address");

    const instructionsContainer = document.getElementById(
      "crypto-instructions-container",
    );

    const instructions = document.getElementById("crypto-instructions");

    if (cryptoName) {
      cryptoName.textContent = crypto.name;
    }

    if (cryptoNetwork) {
      cryptoNetwork.textContent = crypto.network;
    }

    if (cryptoAddress) {
      cryptoAddress.textContent = crypto.address;
    }

    if (crypto.instructions) {
      if (instructions) {
        instructions.textContent = crypto.instructions;
      }

      show(instructionsContainer);
    } else {
      hide(instructionsContainer);
    }

    /*
     * The wallet address/network came
     * from Admin Deposit Settings.
     */

    show(cryptoWalletDetails);

    show(cryptoSubmissionFields);

    /*
     * Transaction hash is required only
     * after a cryptocurrency has actually
     * been selected.
     */

    if (cryptoTransactionHash) {
      cryptoTransactionHash.required = true;
    }
  }

  /* =====================================================
       COPY WALLET ADDRESS
    ====================================================== */

  async function copyWalletAddress() {
    const addressElement = document.getElementById("crypto-address");

    if (!addressElement) {
      return;
    }

    const address = addressElement.textContent.trim();

    if (!address) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(address);

        if (copyButton) {
          const originalText = copyButton.innerHTML;

          copyButton.textContent = "Copied";

          window.setTimeout(function () {
            copyButton.innerHTML = originalText;

            /*
             * Rebuild Lucide icon after
             * restoring button HTML.
             */

            if (window.lucide) {
              window.lucide.createIcons();
            }
          }, 1200);
        }
      } catch (error) {
        console.error("Unable to copy wallet address.", error);
      }
    }
  }

  /* =====================================================
       EVENTS
    ====================================================== */

  methodSelect.addEventListener("change", updateDepositMethod);

  if (cryptoSelect) {
    cryptoSelect.addEventListener("change", updateCryptoDetails);
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyWalletAddress);
  }

  /* =====================================================
       INITIAL PAGE STATE
    ====================================================== */

  updateDepositMethod();
});
