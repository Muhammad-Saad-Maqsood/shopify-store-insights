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

  function normalizeVariantId(value) {
    if (value == null || value === "") {
      return null;
    }

    const raw = String(value);
    const match = raw.match(/(\d+)\s*$/);
    return match ? match[1] : raw;
  }

  function findProductSection(root) {
    return (
      root.closest(
        "product-info, .product, .product-info, [data-product-id], [id^='MainProduct'], [data-section-type='main-product']",
      ) || root.parentElement || document
    );
  }

  function findProductForm(root) {
    const section = findProductSection(root);

    return (
      root.closest("form[action*='/cart/add']") ||
      section.querySelector("form[action*='/cart/add']") ||
      document.querySelector("form[action*='/cart/add']")
    );
  }

  function getOptionNames(root) {
    const raw = root.dataset.optionNames || "";
    return raw
      .split("|")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  function readOptionValue(scope, optionName) {
    if (!optionName) {
      return null;
    }

    const escaped = CSS.escape
      ? CSS.escape(optionName)
      : optionName.replace(/"/g, '\\"');

    const checkedRadio =
      scope.querySelector(
        `fieldset input[type="radio"][name="${escaped}"]:checked`,
      ) ||
      scope.querySelector(`input[type="radio"][name="${escaped}"]:checked`) ||
      scope.querySelector(
        `input[type="radio"][name="options[${escaped}]"]:checked`,
      );

    if (checkedRadio instanceof HTMLInputElement && checkedRadio.value) {
      return checkedRadio.value;
    }

    const select =
      scope.querySelector(`select[name="${escaped}"]`) ||
      scope.querySelector(`select[name="options[${escaped}]"]`);

    if (select instanceof HTMLSelectElement && select.value) {
      return select.value;
    }

    const selectedButton =
      scope.querySelector(
        `[data-option-name="${escaped}"] [aria-pressed="true"], [data-option-name="${escaped}"] .selected, [data-option-name="${escaped}"] [aria-checked="true"]`,
      ) ||
      scope.querySelector(
        `fieldset[data-option="${escaped}"] [aria-checked="true"], fieldset legend + * [aria-pressed="true"]`,
      );

    if (selectedButton) {
      return (
        selectedButton.getAttribute("data-value") ||
        selectedButton.getAttribute("value") ||
        selectedButton.textContent?.trim() ||
        null
      );
    }

    return null;
  }

  function getSelectedOptions(root) {
    const section = findProductSection(root);
    const form = findProductForm(root);
    const scope = form || section;
    const optionNames = getOptionNames(root);

    if (optionNames.length) {
      return optionNames.map((name) => readOptionValue(scope, name));
    }

    // Fallback: collect checked radios / selects that look like option pickers.
    const values = [];
    scope
      .querySelectorAll(
        'fieldset input[type="radio"]:checked, select[name^="options"]',
      )
      .forEach((el) => {
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
          values.push(el.value);
        }
      });

    return values;
  }

  function findVariantByOptions(variants, selectedOptions) {
    const options = (selectedOptions || []).filter(
      (value) => value != null && value !== "",
    );

    if (!options.length) {
      return null;
    }

    return (
      variants.find((variant) => {
        const variantOptions = Array.isArray(variant.options)
          ? variant.options
          : [variant.option1, variant.option2, variant.option3].filter(
              (value) => value != null && value !== "",
            );

        if (variantOptions.length !== options.length) {
          return false;
        }

        return variantOptions.every(
          (value, index) => String(value) === String(options[index]),
        );
      }) || null
    );
  }

  function findVariantById(variants, variantId) {
    const id = normalizeVariantId(variantId);

    if (!id) {
      return null;
    }

    return (
      variants.find((entry) => normalizeVariantId(entry.id) === id) || null
    );
  }

  function getIdFieldVariant(root, variants) {
    const form = findProductForm(root);
    const scope = form || findProductSection(root);
    const idField = scope.querySelector('[name="id"]');

    if (
      !(
        idField instanceof HTMLInputElement ||
        idField instanceof HTMLSelectElement
      )
    ) {
      return null;
    }

    return findVariantById(variants, idField.value);
  }

  function resolveCurrentVariant(root, variants, preferredId) {
    const selectedOptions = getSelectedOptions(root);
    const byOptions = findVariantByOptions(variants, selectedOptions);

    // Prefer option combination (Size + Color) when present — this is the
    // accurate selection for multi-option products.
    if (byOptions) {
      return byOptions;
    }

    // Selected options exist but no matching variant (e.g. Medium + White).
    if (selectedOptions.filter(Boolean).length >= 2 && !byOptions) {
      return null;
    }

    if (preferredId) {
      const byPreferred = findVariantById(variants, preferredId);
      if (byPreferred) {
        return byPreferred;
      }
    }

    const byIdField = getIdFieldVariant(root, variants);
    if (byIdField) {
      return byIdField;
    }

    const urlId = normalizeVariantId(
      new URLSearchParams(window.location.search).get("variant"),
    );
    if (urlId) {
      return findVariantById(variants, urlId);
    }

    return findVariantById(variants, root.dataset.initialVariantId);
  }

  function renderVariant(root, variants, preferredId) {
    const message = root.querySelector("[data-store-insights-stock-message]");
    const threshold = Number(root.dataset.threshold || "5");

    if (!message) {
      return;
    }

    const selectedOptions = getSelectedOptions(root);
    const hasFullSelection =
      getOptionNames(root).length > 0
        ? selectedOptions.filter(Boolean).length >= getOptionNames(root).length
        : selectedOptions.filter(Boolean).length >= 2;

    const variant = resolveCurrentVariant(root, variants, preferredId);

    // Size + Color picked, but that combo does not exist (e.g. Medium / White).
    if (!variant && hasFullSelection) {
      message.hidden = false;
      message.className =
        "store-insights-stock__message store-insights-stock__message--critical";
      message.textContent = "Unavailable";
      return;
    }

    if (!variant) {
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

    if (!variant.available || quantity <= 0) {
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

  function bindVariantChanges(root, variants) {
    const update = (preferredId) => {
      renderVariant(root, variants, preferredId);
    };

    const section = findProductSection(root);
    const form = findProductForm(root);

    const listenTarget = form || section;

    listenTarget.addEventListener("change", () => update());
    listenTarget.addEventListener("input", () => update());
    listenTarget.addEventListener("click", () => {
      window.setTimeout(() => update(), 0);
    });

    const idField = (form || section).querySelector('[name="id"]');
    if (idField) {
      const observer = new MutationObserver(() => update());
      observer.observe(idField, {
        attributes: true,
        attributeFilter: ["value"],
      });
    }

    document.addEventListener("variant:change", (event) => {
      const detail = event.detail || {};
      update(detail.variant?.id || detail.variantId || detail.id || null);
    });

    document.addEventListener("shopify:section:load", () => update());
    window.addEventListener("popstate", () => update());
  }

  function init() {
    document.querySelectorAll("[data-store-insights-stock]").forEach((root) => {
      if (root.dataset.stockBound === "true") {
        return;
      }

      root.dataset.stockBound = "true";

      const variants = readVariants(root);
      renderVariant(root, variants);
      bindVariantChanges(root, variants);

      window.setTimeout(() => renderVariant(root, variants), 0);
      window.setTimeout(() => renderVariant(root, variants), 250);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
