import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import {
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "react-router";
import { useEffect, useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

import { ProductCard } from "../components/products/ProductCard";
import { ProductCreateForm } from "../components/products/ProductCreateForm";
import productsStyles from "../components/products/products.module.css";
import {
  handleProductAction,
  loadProductsPage,
  type ProductActionResult,
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
  const fetcher = useFetcher<ProductActionResult>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();

  const [openEditId, setOpenEditId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const pendingSubmitRef = useRef(false);
  const handledResultRef = useRef<ProductActionResult | null>(null);

  const actionData = fetcher.data;
  const isSubmitting = fetcher.state !== "idle";
  const isCreating =
    isSubmitting && fetcher.formData?.get("intent") === "create";

  useEffect(() => {
    if (fetcher.state === "submitting" && fetcher.formData) {
      pendingSubmitRef.current = true;
    }
  }, [fetcher.state, fetcher.formData]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !actionData || !pendingSubmitRef.current) {
      return;
    }

    if (handledResultRef.current === actionData) {
      return;
    }

    handledResultRef.current = actionData;
    pendingSubmitRef.current = false;

    if (actionData.success) {
      setOpenEditId(null);

      const message =
        "message" in actionData && actionData.message
          ? actionData.message
          : "Product created successfully.";

      if ("product" in actionData) {
        setIsCreateOpen(false);
      }

      setFeedback({ heading: "Success", message, tone: "success" });
      setCatalogRevision((value) => value + 1);
      revalidator.revalidate();

      try {
        shopify.toast.show(message);
      } catch {
        // Toast is optional; page banner already shows success.
      }
      return;
    }

    const message =
      ("message" in actionData && actionData.message) ||
      ("error" in actionData && actionData.error) ||
      "Something went wrong.";

    setFeedback({ heading: "Action failed", message, tone: "critical" });
  }, [actionData, fetcher.state, revalidator, shopify]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

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
            fetcher={fetcher}
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
                fetcher={fetcher}
                catalogRevision={catalogRevision}
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
