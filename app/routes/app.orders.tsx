import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { OrderTable } from "../components/orders/OrderTable";
import styles from "../components/orders/OrderTable.module.css";
import { loadOrdersPage } from "../services/orders.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  return loadOrdersPage(admin);
}

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof loader>();

  const totalRevenue = orders.reduce(
    (total, order) =>
      total + Number(order.currentTotalPriceSet?.shopMoney?.amount ?? 0),
    0,
  );

  const currency =
    orders[0]?.currentTotalPriceSet?.shopMoney?.currencyCode ?? "USD";

  return (
    <s-page heading="Orders">
      <s-section heading="Order overview">
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span>Total orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className={styles.statCard}>
            <span>Recent revenue</span>
            <strong>
              {currency} {totalRevenue.toFixed(2)}
            </strong>
          </div>
        </div>
      </s-section>

      <s-section heading="Recent orders">
        {orders.length === 0 ? (
          <s-paragraph>No orders were found in this store.</s-paragraph>
        ) : (
          <OrderTable orders={orders} />
        )}
      </s-section>
    </s-page>
  );
}
