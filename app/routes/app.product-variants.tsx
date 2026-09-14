import type { LoaderFunctionArgs } from "react-router";

import { getProductVariants } from "../services/products.server";
import { authenticate } from "../shopify.server";

// Read-only resource route so the products page can load one product's
// variants on demand instead of loading them for the whole catalog.
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const productId = new URL(request.url).searchParams.get("productId") ?? "";

  return getProductVariants(admin, productId);
}
