import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import type { ProductVariantItem, ProductVariantsData } from "../../types";
import styles from "./VariantInventory.module.css";

const LOW_STOCK_THRESHOLD = 5;
const DEFAULT_VARIANT_TITLE = "Default Title";

type VariantPatch = {
  id: string;
  price: string;
  inventoryQuantity: number;
};

type VariantInventoryProps = {
  productId: string;
  productTitle: string;
  variantPatch?: VariantPatch | null;
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

function applyVariantPatch(
  variants: ProductVariantItem[],
  patch: VariantPatch | null | undefined,
) {
  if (!patch) {
    return variants;
  }

  return variants.map((variant) =>
    variant.id === patch.id
      ? {
          ...variant,
          price: patch.price,
          inventoryQuantity: patch.inventoryQuantity,
        }
      : variant,
  );
}

export function VariantInventory({
  productId,
  productTitle,
  variantPatch = null,
  onClose,
}: VariantInventoryProps) {
  const fetcher = useFetcher<ProductVariantsData>();
  const variantsPath = `/app/product-variants?productId=${encodeURIComponent(
    productId,
  )}`;
  const [variants, setVariants] = useState<ProductVariantItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetcher.load(variantsPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher identity is unstable
  }, [variantsPath]);

  useEffect(() => {
    if (!fetcher.data || fetcher.state !== "idle") {
      return;
    }

    if (fetcher.data.error) {
      setLoadError(fetcher.data.error);
      setHasLoaded(true);
      return;
    }

    setLoadError(null);
    setVariants(applyVariantPatch(fetcher.data.variants, variantPatch));
    setHasLoaded(true);
  }, [fetcher.data, fetcher.state, variantPatch]);

  useEffect(() => {
    if (!variantPatch || !hasLoaded) {
      return;
    }

    setVariants((current) => applyVariantPatch(current, variantPatch));
  }, [variantPatch, hasLoaded]);

  function renderContent() {
    if (!hasLoaded || (fetcher.state !== "idle" && variants.length === 0)) {
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

    if (loadError) {
      return (
        <div className={styles.status}>
          <s-banner heading="Unable to load variants" tone="critical">
            {loadError}
          </s-banner>

          <s-button onClick={() => fetcher.load(variantsPath)}>Retry</s-button>
        </div>
      );
    }

    const visibleVariants = variants.filter(
      (variant) => variantLabel(variant) !== null,
    );

    if (visibleVariants.length === 0) {
      return (
        <div className={styles.status}>
          <strong>No variant inventory available.</strong>

          <span>
            This product uses the default Shopify variant with{" "}
            {totalUnits(variants)} units in stock.
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
            {visibleVariants.map((variant) => {
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
          {visibleVariants.length}{" "}
          {visibleVariants.length === 1 ? "variant" : "variants"} ·{" "}
          {totalUnits(visibleVariants)} units
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
