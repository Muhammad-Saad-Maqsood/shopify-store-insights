import { useState } from "react";
import { Form } from "react-router";

import type { ProductListItem } from "../../types";
import { ProductEditForm } from "./ProductEditForm";
import { VariantInventory } from "./VariantInventory";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: ProductListItem;
  isEditOpen: boolean;
  onEditToggle: (productId: string | null) => void;
};

export function ProductCard({
  product,
  isEditOpen,
  onEditToggle,
}: ProductCardProps) {
  const price = product.variants?.nodes?.[0]?.price;
  const [isVariantsOpen, setIsVariantsOpen] = useState(false);

  return (
    <article className={styles.card}>
      {product.featuredImage?.url ? (
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText || product.title}
        />
      ) : (
        <div className={styles.imagePlaceholder}>No image</div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3>{product.title}</h3>

          <s-badge tone="success">{product.status}</s-badge>
        </div>

        <div className={styles.meta}>
          <span>{price ? `$${price}` : "No price"}</span>

          <span>{product.totalInventory ?? 0} units</span>
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
              productTitle={product.title}
              onClose={() => setIsVariantsOpen(false)}
            />
          </div>
        )}

        <div className={styles.actions}>
          {isEditOpen ? (
            <div className={styles.editPanel}>
              <ProductEditForm
                productId={product.id}
                title={product.title}
                description={product.description}
                price={price}
                onCancel={() => onEditToggle(null)}
              />
            </div>
          ) : (
            <s-button onClick={() => onEditToggle(product.id)}>Edit</s-button>
          )}

          <Form
            method="post"
            onSubmit={(event) => {
              if (!window.confirm(`Delete "${product.title}"?`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="productId" value={product.id} />
            <s-button type="submit">Delete</s-button>
          </Form>
        </div>
      </div>
    </article>
  );
}
