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

      <textarea
        name="description"
        defaultValue={description ?? ""}
        placeholder="Description"
        rows={3}
      />

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
