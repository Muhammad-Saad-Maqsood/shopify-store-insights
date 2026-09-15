(function () {
  function readVariants(root) {
    const script = root.querySelector("[data-store-insights-stock-variants]");

    if (!script?.textContent) {
      return [];
    }

    try {
      return JSON.parse(script.textContent);
    } catch {
      return [];
    }
  }

  function renderMessage(root, variants, variantId) {
    const message = root.querySelector("[data-store-insights-stock-message]");
    const threshold = Number(root.dataset.threshold || "5");
    const variant =
      variants.find((entry) => String(entry.id) === String(variantId)) ||
      variants[0];

    if (!message || !variant) {
      return;
    }

    if (variant.inventory_management !== "shopify") {
      message.hidden = true;
      message.textContent = "";
      return;
    }

    const quantity = Number(variant.inventory_quantity ?? 0);
    message.hidden = false;
    message.className = "store-insights-stock__message";

    if (quantity <= 0) {
      message.textContent = "Out of stock";
      message.classList.add("store-insights-stock__message--critical");
      return;
    }

    if (quantity <= threshold) {
      message.textContent = `Only ${quantity} left`;
      message.classList.add("store-insights-stock__message--warning");
      return;
    }

    message.textContent = "In stock";
    message.classList.add("store-insights-stock__message--success");
  }

  function getSelectedVariantId(productForm) {
    const idField = productForm.querySelector('[name="id"]');
    return idField instanceof HTMLInputElement ||
      idField instanceof HTMLSelectElement
      ? idField.value
      : null;
  }

  function bindVariantChanges(root, variants) {
    const productForm = root.closest("form[action*='/cart/add']");

    if (!productForm) {
      return;
    }

    const updateFromForm = () => {
      const variantId = getSelectedVariantId(productForm);

      if (variantId) {
        renderMessage(root, variants, variantId);
      }
    };

    productForm.addEventListener("change", updateFromForm);

    document.addEventListener("variant:change", (event) => {
      const variant = event.detail?.variant;

      if (variant?.id) {
        renderMessage(root, variants, variant.id);
      }
    });
  }

  document.querySelectorAll("[data-store-insights-stock]").forEach((root) => {
    const variants = readVariants(root);
    const initialVariantId = root.dataset.initialVariantId;

    renderMessage(root, variants, initialVariantId);
    bindVariantChanges(root, variants);
  });
})();
