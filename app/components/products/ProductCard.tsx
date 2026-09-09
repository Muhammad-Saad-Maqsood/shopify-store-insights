import { Form } from "react-router";

import type { ProductListItem } from "../../types";
import { ProductEditForm } from "./ProductEditForm";
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

        <div className={styles.actions}>
          <details
            className={styles.editDetails}
            open={isEditOpen}
            onToggle={(event) => {
              onEditToggle(event.currentTarget.open ? product.id : null);
            }}
          >
            <summary>Edit</summary>

            <ProductEditForm
              productId={product.id}
              title={product.title}
              price={price}
            />
          </details>

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
