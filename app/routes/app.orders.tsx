import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";

import { OrderTable } from "../components/orders/OrderTable";
import { loadOrdersPage } from "../services/orders.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  return loadOrdersPage(admin);
}

export default function OrdersPage() {
  const { orders, error } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const isRefreshing = revalidator.state === "loading";

  const totalRevenue = orders.reduce(
    (total, order) =>
      total + Number(order.currentTotalPriceSet?.shopMoney?.amount ?? 0),
    0,
  );

  const currency =
    orders[0]?.currentTotalPriceSet?.shopMoney?.currencyCode ?? "USD";

  return (
    <s-page heading="Orders">
      <s-button
        slot="primary-action"
        onClick={() => revalidator.revalidate()}
        loading={isRefreshing}
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </s-button>

      {error && (
        <s-banner heading="Unable to load orders" tone="critical">
          {error}
        </s-banner>
      )}

      <s-section heading="Order overview">
        <div className="store-insights-order-stats">
          <div className="store-insights-order-stat-card">
            <span>Total orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="store-insights-order-stat-card">
            <span>Recent revenue</span>
            <strong>
              {currency} {totalRevenue.toFixed(2)}
            </strong>
          </div>
        </div>
      </s-section>

      <s-section heading="Recent orders">
        {isRefreshing ? (
          <div className="store-insights-order-loading" aria-live="polite">
            <s-spinner size="base" accessibilityLabel="Refreshing orders" />
            <span>Refreshing orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="store-insights-order-empty">
            <strong>{error ? "Orders are unavailable" : "No orders yet"}</strong>
            <p>
              {error
                ? "Refresh to try loading your order data again."
                : "Orders will appear here when customers place them."}
            </p>
          </div>
        ) : (
          <OrderTable orders={orders} />
        )}
      </s-section>

      <style>{`
        .store-insights-order-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .store-insights-order-stat-card {
          min-height: 112px;
          padding: 20px;
          border: 1px solid var(--s-color-border, #e1e3e5);
          border-radius: 12px;
          background: var(--s-color-bg-surface, #fff);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .store-insights-order-stat-card span {
          display: block;
          margin-bottom: 8px;
          color: #616161;
          font-size: 13px;
        }

        .store-insights-order-stat-card strong {
          font-size: 28px;
          line-height: 1.15;
          letter-spacing: -0.4px;
        }

        .store-insights-order-empty,
        .store-insights-order-loading {
          min-height: 168px;
          padding: 24px;
          border: 1px dashed var(--s-color-border, #e1e3e5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          text-align: center;
        }

        .store-insights-order-empty p,
        .store-insights-order-loading {
          margin: 0;
          color: #616161;
          font-size: 14px;
        }

        @media (max-width: 700px) {
          .store-insights-order-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </s-page>
  );
}
