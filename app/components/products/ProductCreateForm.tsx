import { Form } from "react-router";

import type { ProductLocation } from "../../types";
import styles from "./ProductCreateForm.module.css";

type ProductCreateFormProps = {
  locations: ProductLocation[];
  isCreating: boolean;
  onCancel: () => void;
};

export function ProductCreateForm({
  locations,
  isCreating,
  onCancel,
}: ProductCreateFormProps) {
  return (
    <Form method="post" encType="multipart/form-data">
      <input type="hidden" name="intent" value="create" />

      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title">Product title</label>

          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Premium Hoodie"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Description</label>

          <textarea
            id="description"
            name="description"
            placeholder="Add a short product description..."
            rows={4}
          />
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="price">Price</label>

            <div className={styles.inputWithPrefix}>
              <span>$</span>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="79.99"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="inventory">Inventory</label>

            <input
              id="inventory"
              name="inventory"
              type="number"
              min="0"
              step="1"
              placeholder="25"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="locationId">Inventory location</label>

          <select id="locationId" name="locationId" defaultValue="">
            <option value="">No Inventory Location</option>

            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="image">Product image</label>

          <input id="image" name="image" type="file" accept="image/*" />

          <span className={styles.fieldHelp}>
            JPG, PNG, WEBP or another standard image format. Maximum 10 MB.
          </span>
        </div>

        <div className={styles.actions}>
          <s-button type="submit" variant="primary" loading={isCreating}>
            {isCreating ? "Creating product..." : "Create product"}
          </s-button>

          <s-button type="button" onClick={onCancel} disabled={isCreating}>
            Cancel
          </s-button>
        </div>
      </div>
    </Form>
  );
}
