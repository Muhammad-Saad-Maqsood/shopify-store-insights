import { Form, useNavigation } from "react-router";

import styles from "./ProductEditForm.module.css";

type ProductEditFormProps = {
  productId: string;
  title: string;
  description?: string | null;
  price?: string;
  onCancel: () => void;
};

export function ProductEditForm({
  productId,
  title,
  description,
  price,
  onCancel,
}: ProductEditFormProps) {
  const navigation = useNavigation();
  const isSaving =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "update" &&
    navigation.formData?.get("productId") === productId;

  return (
    <Form method="post" className={styles.form}>
      <input type="hidden" name="intent" value="update" />
      <input type="hidden" name="productId" value={productId} />

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
        <label htmlFor={`price-${productId}`}>Price</label>

        <div className={styles.inputWithPrefix}>
          <span>$</span>

          <input
            id={`price-${productId}`}
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={price ?? ""}
            placeholder="0.00"
            required
          />
        </div>

        <span className={styles.fieldHelp}>Applies to all variants.</span>
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

      <div className={styles.actions}>
        <s-button type="submit" variant="primary">
          {isSaving ? "Saving..." : "Save changes"}
        </s-button>
        <s-button type="button" onClick={onCancel}>
          Cancel
        </s-button>
      </div>
    </Form>
  );
}
