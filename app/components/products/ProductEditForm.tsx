import { useEffect, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { useFetcher } from "react-router";

import type { ProductActionResult } from "../../services/products.server";
import type { ProductVariantItem, ProductVariantsData } from "../../types";
import styles from "./ProductEditForm.module.css";

const DEFAULT_VARIANT_TITLE = "Default Title";

type ProductEditFormProps = {
  fetcher: FetcherWithComponents<ProductActionResult>;
  productId: string;
  title: string;
  description?: string | null;
  onCancel: () => void;
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
    : "Default variant";
}

export function ProductEditForm({
  fetcher,
  productId,
  title,
  description,
  onCancel,
}: ProductEditFormProps) {
  const variantsFetcher = useFetcher<ProductVariantsData>();
  const variantsPath = `/app/product-variants?productId=${encodeURIComponent(
    productId,
  )}`;

  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantInventory, setVariantInventory] = useState("");

  useEffect(() => {
    variantsFetcher.load(variantsPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher identity is unstable
  }, [variantsPath]);

  const data = variantsFetcher.data;
  const variants = data?.variants ?? [];
  const isLoadingVariants =
    variantsFetcher.state !== "idle" || !data;

  useEffect(() => {
    if (!variants.length || selectedVariantId) {
      return;
    }

    setSelectedVariantId(variants[0].id);
    setVariantPrice(variants[0].price);
    setVariantInventory(String(variants[0].inventoryQuantity ?? 0));
  }, [variants, selectedVariantId]);

  const isSaving =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "update" &&
    fetcher.formData?.get("productId") === productId;

  function handleVariantChange(nextVariantId: string) {
    const variant = variants.find((entry) => entry.id === nextVariantId);

    if (!variant) {
      return;
    }

    setSelectedVariantId(variant.id);
    setVariantPrice(variant.price);
    setVariantInventory(String(variant.inventoryQuantity ?? 0));
  }

  return (
    <fetcher.Form method="post" className={styles.form}>
      <input type="hidden" name="intent" value="update" />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={selectedVariantId} />

      <div className={styles.field}>
        <label htmlFor={`title-${productId}`}>Name</label>

        <input
          id={`title-${productId}`}
          name="title"
          defaultValue={title}
          placeholder="Product title"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`description-${productId}`}>Description</label>

        <textarea
          id={`description-${productId}`}
          name="description"
          defaultValue={description ?? ""}
          placeholder="Product description"
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.sectionLabel}>Variant details</span>

        {isLoadingVariants && (
          <div className={styles.variantStatus} aria-live="polite">
            <s-spinner size="base" accessibilityLabel="Loading variants" />
            <span>Loading variants…</span>
          </div>
        )}

        {!isLoadingVariants && data?.error && (
          <div className={styles.variantStatus}>
            <s-banner heading="Unable to load variants" tone="critical">
              {data.error}
            </s-banner>

            <s-button
              type="button"
              onClick={() => variantsFetcher.load(variantsPath)}
            >
              Retry
            </s-button>
          </div>
        )}

        {!isLoadingVariants && !data?.error && variants.length > 0 && (
          <>
            <label htmlFor={`variant-${productId}`}>Variant</label>

            <select
              id={`variant-${productId}`}
              value={selectedVariantId}
              onChange={(event) => handleVariantChange(event.target.value)}
              required
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variantLabel(variant)}
                </option>
              ))}
            </select>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor={`variant-price-${productId}`}>Price</label>

                <div className={styles.inputWithPrefix}>
                  <span>$</span>

                  <input
                    id={`variant-price-${productId}`}
                    name="variantPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={variantPrice}
                    onChange={(event) => setVariantPrice(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor={`variant-inventory-${productId}`}>
                  Inventory
                </label>

                <input
                  id={`variant-inventory-${productId}`}
                  name="variantInventory"
                  type="number"
                  min="0"
                  step="1"
                  value={variantInventory}
                  onChange={(event) => setVariantInventory(event.target.value)}
                  required
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <s-button
          type="submit"
          variant="primary"
          loading={isSaving}
          disabled={
            isLoadingVariants || Boolean(data?.error) || variants.length === 0
          }
        >
          {isSaving ? "Saving..." : "Save changes"}
        </s-button>
        <s-button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </s-button>
      </div>
    </fetcher.Form>
  );
}
