import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import {
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useEffect, useState } from "react";

import { ProductCard } from "../components/products/ProductCard";
import { ProductCreateForm } from "../components/products/ProductCreateForm";
import productsStyles from "../components/products/products.module.css";
import {
  handleProductAction,
  loadProductsPage,
} from "../services/products.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  return loadProductsPage(admin);
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  return handleProductAction(admin, formData);
}

export default function ProductsPage() {
  const { products, locations, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [openEditId, setOpenEditId] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success) {
      setOpenEditId(null);
    }
  }, [actionData]);

  const isCreating =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "create";

  return (
    <s-page heading="Products">
      {error && (
        <s-banner heading="Unable to load products" tone="critical">
          {error}
        </s-banner>
      )}

      {actionData?.success && (
        <s-banner heading="Success" tone="success">
          {"message" in actionData ? actionData.message : undefined}
        </s-banner>
      )}

      {actionData &&
        "message" in actionData &&
        actionData.message &&
        !actionData.success && (
          <s-banner heading="Action failed" tone="critical">
            {actionData.message}
          </s-banner>
        )}

      <s-section heading="Create product">
        <ProductCreateForm locations={locations} isCreating={isCreating} />
      </s-section>

      <s-section heading="Product catalog">
        <div className={productsStyles.catalogHeader}>
          <div>
            <strong>{products.length} products</strong>
          </div>
        </div>

        {products.length === 0 ? (
          <div className={productsStyles.emptyState}>
            <strong>No products found</strong>

            <p>Create your first product above.</p>
          </div>
        ) : (
          <div className={productsStyles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isEditOpen={openEditId === product.id}
                onEditToggle={setOpenEditId}
              />
            ))}
          </div>
        )}
      </s-section>
    </s-page>
  );
}
