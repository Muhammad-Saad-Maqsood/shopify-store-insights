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
import { useAppBridge } from "@shopify/app-bridge-react";

import { ProductCard } from "../components/products/ProductCard";
import { ProductCreateForm } from "../components/products/ProductCreateForm";
import productsStyles from "../components/products/products.module.css";
import {
  handleProductAction,
  loadProductsPage,
} from "../services/products.server";
import { authenticate } from "../shopify.server";

type Feedback = {
  heading: string;
  message: string;
  tone: "success" | "critical";
};

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
  const shopify = useAppBridge();

  const [openEditId, setOpenEditId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!actionData) return;

    if (actionData.success) {
      setOpenEditId(null);
      const message =
        "message" in actionData
          ? actionData.message
          : "Product created successfully.";

      if ("product" in actionData) {
        setIsCreateOpen(false);
      }

      setFeedback({ heading: "Success", message, tone: "success" });
      shopify.toast.show(message);
      return;
    }

    const message =
      "message" in actionData ? actionData.message : actionData.error;

    setFeedback({ heading: "Action failed", message, tone: "critical" });
  }, [actionData, shopify]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const isCreating =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "create";

  return (
    <s-page heading="Products">
      {!isCreateOpen && (
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
        >
          Create product
        </s-button>
      )}

      {error && (
        <s-banner heading="Unable to load products" tone="critical">
          {error}
        </s-banner>
      )}

      {feedback && (
        <s-banner heading={feedback.heading} tone={feedback.tone}>
          {feedback.message}
        </s-banner>
      )}

      {isCreateOpen && (
        <s-section heading="Create product">
          <p className={productsStyles.createIntro}>
            Add the essentials now. You can update product details later.
          </p>
          <ProductCreateForm
            locations={locations}
            isCreating={isCreating}
            onCancel={() => setIsCreateOpen(false)}
          />
        </s-section>
      )}

      <s-section heading="Product catalog">
        <div className={productsStyles.catalogHeader}>
          <div>
            <strong>{products.length} products</strong>
          </div>
        </div>

        {products.length === 0 ? (
          <div className={productsStyles.emptyState}>
            <strong>No products found</strong>

            <p>Use Create product to add your first item.</p>
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
