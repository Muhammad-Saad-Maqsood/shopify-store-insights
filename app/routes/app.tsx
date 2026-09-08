import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import {
  Outlet,
  useLoaderData,
  useNavigation,
  useRouteError,
} from "react-router";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  
  const isNavigating = navigation.state !== "idle";

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Dashboard</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/orders">Orders</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>

      {isNavigating && (
        <div className="navigation-loading">
          <s-spinner
            size="small"
            accessibilityLabel="Loading page"
          />
          <span>Loading...</span>
        </div>
      )}
      <Outlet />
      
        <style>{`
        .navigation-loading {
          position: fixed;
          top: 72px;
          right: 24px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #e1e3e5;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          font-size: 13px;
        }
      `}</style>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
