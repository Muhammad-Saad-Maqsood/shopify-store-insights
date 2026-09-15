(function () {
  function readVariants(root) {
    const script = root.parentElement?.querySelector(
      "[data-store-insights-stock-variants]",
    );

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
      return;
    }

    const quantity = Number(variant.inventory_quantity ?? 0);
    message.hidden = false;
    message.className = "store-insights-stock__message";

    if (!variant.available || quantity <= 0) {
      message.textContent = "Out of stock";
      message.classList.add("store-insights-stock__message--critical");
      return;
    }

    if (quantity <= threshold) {
      message.textContent = `Only ${quantity} left in stock`;
      message.classList.add("store-insights-stock__message--warning");
      return;
    }

    message.textContent = "In stock";
    message.classList.add("store-insights-stock__message--success");
  }

  function bindVariantChanges(root, variants) {
    const productForm = root.closest("form[action*='/cart/add']");

    if (!productForm) {
      return;
    }

    productForm.addEventListener("change", (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.name !== "id") {
        return;
      }

      renderMessage(root, variants, target.value);
    });
  }

  document.querySelectorAll("[data-store-insights-stock]").forEach((root) => {
    const variants = readVariants(root);
    const initialVariantId = root.dataset.initialVariantId;

    renderMessage(root, variants, initialVariantId);
    bindVariantChanges(root, variants);
  });
})();
