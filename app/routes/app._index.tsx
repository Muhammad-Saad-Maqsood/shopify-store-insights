import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";

import { OrderTable } from "../components/orders/OrderTable";
import { STORE_INSIGHTS_QUERY } from "../graphql/dashboard";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(STORE_INSIGHTS_QUERY);

    const result = (await response.json()) as {
      data?: {
        shop?: {
          currencyCode?: string;
        };

        products?: {
          nodes?: Array<{
            id: string;
            title: string;
            status: string;
            totalInventory: number;
            featuredImage?: {
              url: string;
              altText?: string | null;
            } | null;
          }>;
        };

        productsCount?: {
          count: number;
        };

        ordersCount?: {
          count: number;
        };

        orders?: {
          nodes?: Array<{
            id: string;
            name: string;
            createdAt: string;
            displayFinancialStatus: string;
            displayFulfillmentStatus?: string | null;
            currentTotalPriceSet?: {
              shopMoney?: {
                amount: string;
                currencyCode: string;
              };
            };
          }>;
        };

        revenueOrders?: {
          nodes?: Array<{
            currentTotalPriceSet?: {
              shopMoney?: {
                amount: string;
                currencyCode: string;
              };
            };
          }>;
        };
      };
      errors?: Array<{
        message: string;
      }>;
    };

    if (result.errors?.length) {
      return {
        products: [],
        orders: [],
        orderCount: 0,
        totalRevenue: "0.00",
        currency: "USD",
        error: "Shopify could not load the store data.",
      };
    }

    const products = result.data?.products?.nodes ?? [];
    const orders = result.data?.orders?.nodes ?? [];
    const revenueOrders = result.data?.revenueOrders?.nodes ?? [];

    const totalRevenue = revenueOrders.reduce((total, order) => {
      return (
        total + Number(order.currentTotalPriceSet?.shopMoney?.amount ?? 0)
      );
    }, 0);

    const currency =
      result.data?.shop?.currencyCode ??
      revenueOrders[0]?.currentTotalPriceSet?.shopMoney?.currencyCode ??
      "USD";

    return {
      products,
      orders,
      productCount: result.data?.productsCount?.count ?? 0,
      orderCount: result.data?.ordersCount?.count ?? 0,
      totalRevenue: totalRevenue.toFixed(2),
      currency,
      error: null,
    };
  } catch {
    return {
      products: [],
      orders: [],
      orderCount: 0,
      totalRevenue: "0.00",
      currency: "USD",
      error: "Unable to connect to Shopify.",
    };
  }
}

function formatStatus(status?: string | null) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Dashboard() {
  const {
    products,
    orders,
    productCount,
    orderCount,
    totalRevenue,
    currency,
    error,
  } = useLoaderData<typeof loader>();

  const revalidator = useRevalidator();

  const isRefreshing = revalidator.state === "loading";

  return (
    <s-page heading="Store Insights">
      <s-button
        slot="primary-action"
        onClick={() => revalidator.revalidate()}
        {...(isRefreshing ? { loading: true } : {})}
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </s-button>

      {error && (
        <s-banner heading="Unable to load store data" tone="critical">
          {error}
        </s-banner>
      )}

      {isRefreshing && (
        <s-banner heading="Refreshing store data" tone="info">
          Getting the latest information from Shopify...
        </s-banner>
      )}

      <div className="dashboard-intro">
        <h2>Store performance</h2>
        <p>Monitor your latest orders, revenue, and product inventory.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total revenue</span>
          <strong>
            {currency} {totalRevenue}
          </strong>
          <span className="kpi-meta">Across all orders</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Orders</span>
          <strong>{orderCount}</strong>
          <span className="kpi-meta">Total orders</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Products</span>
          <strong>{productCount}</strong>
          <span className="kpi-meta">Active catalog</span>
        </div>
      </div>

      <s-section heading="Recent orders">
        {orders.length === 0 ? (
          <div className="empty-state">
            <strong>No orders yet</strong>
            <p>Orders will appear here when customers place orders.</p>
          </div>
        ) : (
          <OrderTable orders={orders} />
        )}
      </s-section>

      <s-section heading="Products">
        {products.length === 0 ? (
          <div className="empty-state">
            <strong>No products found</strong>
            <p>Create a product in Shopify Admin and refresh this page.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div className="product-card" key={product.id}>
                {product.featuredImage?.url ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                  />
                ) : (
                  <div className="product-image-placeholder">No image</div>
                )}

                <div className="product-info">
                  <div className="product-title-row">
                    <strong>{product.title}</strong>

                    <s-badge tone="success">
                      {formatStatus(product.status)}
                    </s-badge>
                  </div>

                  <span>{product.totalInventory} units in stock</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </s-section>

      <style>{`
        .dashboard-intro {
          margin: 4px 0 20px;
        }

        .dashboard-intro h2 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 650;
        }

        .dashboard-intro p {
          margin: 0;
          font-size: 14px;
          opacity: 0.65;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .kpi-card {
          min-height: 120px;
          padding: 20px;
          border: 1px solid var(--s-color-border);
          border-radius: 12px;
          background: var(--s-color-bg-surface);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }

        .kpi-label {
          font-size: 13px;
          opacity: 0.7;
        }

        .kpi-card strong {
          font-size: 28px;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .kpi-meta {
          font-size: 12px;
          opacity: 0.55;
        }

        .empty-state {
          padding: 36px 20px;
          text-align: center;
          border: 1px dashed var(--s-color-border);
          border-radius: 10px;
        }

        .empty-state strong {
          display: block;
          margin-bottom: 6px;
        }

        .empty-state p {
          margin: 0;
          opacity: 0.6;
          font-size: 13px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .product-card {
          overflow: hidden;
          border: 1px solid var(--s-color-border);
          border-radius: 12px;
          background: var(--s-color-bg-surface);
        }

        .product-card img,
        .product-image-placeholder {
          width: 100%;
          height: 170px;
          object-fit: contain;
          display: block;
        }

        .product-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--s-color-bg-surface-secondary);
          opacity: 0.6;
        }

        .product-info {
          padding: 14px;
        }

        .product-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }

        .product-info > span {
          font-size: 13px;
          opacity: 0.6;
        }

        @media (max-width: 800px) {
          .kpi-grid,
          .product-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </s-page>
  );
}
