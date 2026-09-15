import { useMemo, useState } from "react";
import type { FetcherWithComponents } from "react-router";

import type {
  ProductActionResult,
  ProductUpdateSnapshot,
} from "../../services/products.server";
import type { ProductListItem } from "../../types";
import { ProductEditForm } from "./ProductEditForm";
import { VariantInventory } from "./VariantInventory";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: ProductListItem;
  fetcher: FetcherWithComponents<ProductActionResult>;
  productUpdate: ProductUpdateSnapshot | null;
  isEditOpen: boolean;
  onEditToggle: (productId: string | null) => void;
};

export function ProductCard({
  product,
  fetcher,
  productUpdate,
  isEditOpen,
  onEditToggle,
}: ProductCardProps) {
  const [isVariantsOpen, setIsVariantsOpen] = useState(false);

  const displayProduct = useMemo(() => {
    if (!productUpdate) {
      return product;
    }

    return {
      ...product,
      title: productUpdate.title,
      description: productUpdate.description,
      totalInventory: productUpdate.totalInventory,
    };
  }, [product, productUpdate]);

  const price = product.variants?.nodes?.[0]?.price;

  const isDeleting =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "delete" &&
    fetcher.formData?.get("productId") === product.id;

  return (
    <article className={styles.card}>
      {displayProduct.featuredImage?.url ? (
        <img
          src={displayProduct.featuredImage.url}
          alt={
            displayProduct.featuredImage.altText || displayProduct.title
          }
        />
      ) : (
        <div className={styles.imagePlaceholder}>No image</div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3>{displayProduct.title}</h3>

          <s-badge tone="success">{displayProduct.status}</s-badge>
        </div>

        <div className={styles.meta}>
          <span>{price ? `$${price}` : "No price"}</span>

          <span>{displayProduct.totalInventory ?? 0} units</span>
        </div>

        <div className={styles.variantsRow}>
          <s-button onClick={() => setIsVariantsOpen(!isVariantsOpen)}>
            {isVariantsOpen ? "Hide variants" : "View variants"}
          </s-button>
        </div>

        {isVariantsOpen && (
          <div className={styles.variantsPanel}>
            <VariantInventory
              productId={product.id}
              productTitle={displayProduct.title}
              variantPatch={productUpdate?.variant ?? null}
              onClose={() => setIsVariantsOpen(false)}
            />
          </div>
        )}

        <div className={styles.actions}>
          {isEditOpen ? (
            <div className={styles.editPanel}>
              <ProductEditForm
                fetcher={fetcher}
                productId={product.id}
                title={displayProduct.title}
                description={displayProduct.description}
                onCancel={() => onEditToggle(null)}
              />
            </div>
          ) : (
            <s-button onClick={() => onEditToggle(product.id)}>Edit</s-button>
          )}

          <fetcher.Form
            method="post"
            onSubmit={(event) => {
              if (!window.confirm(`Delete "${displayProduct.title}"?`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="productId" value={product.id} />
            <s-button type="submit" loading={isDeleting} disabled={isDeleting}>
              Delete
            </s-button>
          </fetcher.Form>
        </div>
      </div>
    </article>
  );
}
