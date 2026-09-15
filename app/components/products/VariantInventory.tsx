import { useEffect } from "react";
import { useFetcher } from "react-router";

import type { ProductVariantItem, ProductVariantsData } from "../../types";
import styles from "./VariantInventory.module.css";

const LOW_STOCK_THRESHOLD = 5;
const DEFAULT_VARIANT_TITLE = "Default Title";

type VariantInventoryProps = {
  productId: string;
  productTitle: string;
  onClose: () => void;
};

function variantLabel(variant: ProductVariantItem) {
  const options = (variant.selectedOptions ?? [])
    .map((option) => option.value)
    .filter((value) => value && value !== DEFAULT_VARIANT_TITLE);

  if (options.length) {
    return options.join(" / ");
  }

  return variant.title && variant.title !== DEFAULT_VARIANT_TITLE
    ? variant.title
    : null;
}

function formatPrice(price: string) {
  const amount = Number(price);

  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : price;
}

function stockBadge(quantity: number) {
  if (quantity <= 0) {
    return { tone: "critical" as const, label: "Out of stock" };
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return { tone: "warning" as const, label: "Low stock" };
  }

  return null;
}

function totalUnits(variants: ProductVariantItem[]) {
  return variants.reduce(
    (total, variant) => total + (variant.inventoryQuantity ?? 0),
    0,
  );
}

export function VariantInventory({
  productId,
  productTitle,
  onClose,
}: VariantInventoryProps) {
  const fetcher = useFetcher<ProductVariantsData>();
  const variantsPath = `/app/product-variants?productId=${encodeURIComponent(
    productId,
  )}`;

  useEffect(() => {
    fetcher.load(variantsPath);
    // Reload whenever this panel mounts or the product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher identity is unstable
  }, [variantsPath]);

  function renderContent() {
    const data = fetcher.data;

    if (fetcher.state !== "idle" || !data) {
      return (
        <div className={styles.status} aria-live="polite">
          <s-spinner
            size="base"
            accessibilityLabel="Loading variant inventory"
          />

          <span>Loading variants…</span>
        </div>
      );
    }

    if (data.error) {
      return (
        <div className={styles.status}>
          <s-banner heading="Unable to load variants" tone="critical">
            {data.error}
          </s-banner>

          <s-button onClick={() => fetcher.load(variantsPath)}>Retry</s-button>
        </div>
      );
    }

    const variants = data.variants.filter(
      (variant) => variantLabel(variant) !== null,
    );

    if (variants.length === 0) {
      return (
        <div className={styles.status}>
          <strong>No variant inventory available.</strong>

          <span>
            This product uses the default Shopify variant with{" "}
            {totalUnits(data.variants)} units in stock.
          </span>
        </div>
      );
    }

    return (
      <>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Variant</th>
              <th scope="col">Price</th>
              <th scope="col">Stock</th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant) => {
              const quantity = variant.inventoryQuantity ?? 0;
              const badge = stockBadge(quantity);

              return (
                <tr key={variant.id}>
                  <td>{variantLabel(variant)}</td>

                  <td className={styles.numeric}>
                    {formatPrice(variant.price)}
                  </td>

                  <td className={styles.numeric}>
                    <span className={styles.stock}>
                      {quantity}

                      {badge && (
                        <s-badge tone={badge.tone}>{badge.label}</s-badge>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className={styles.totals}>
          {variants.length} {variants.length === 1 ? "variant" : "variants"} ·{" "}
          {totalUnits(variants)} units
        </p>
      </>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label={`Variant inventory for ${productTitle}`}
    >
      <div className={styles.panelHeader}>
        <strong>Variant inventory</strong>

        <s-button onClick={onClose}>Close</s-button>
      </div>

      {renderContent()}
    </section>
  );
}
