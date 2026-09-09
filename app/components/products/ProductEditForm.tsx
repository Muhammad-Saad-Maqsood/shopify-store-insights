import { Form } from "react-router";

import styles from "./ProductEditForm.module.css";

type ProductEditFormProps = {
  productId: string;
  title: string;
  price?: string;
};

export function ProductEditForm({
  productId,
  title,
  price,
}: ProductEditFormProps) {
  return (
    <Form method="post" className={styles.form}>
      <input type="hidden" name="intent" value="update" />

      <input type="hidden" name="productId" value={productId} />

      <input
        name="title"
        defaultValue={title}
        placeholder="Product title"
        required
      />

      <input
        name="price"
        type="number"
        min="0"
        step="0.01"
        defaultValue={price ?? ""}
        placeholder="Price"
        required
      />

      <textarea name="description" placeholder="Description" rows={3} />

      <s-button type="submit" variant="primary">
        Save changes
      </s-button>
    </Form>
  );
}
