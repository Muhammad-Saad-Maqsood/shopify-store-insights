import type { OrderListItem } from "../../types";
import styles from "./OrderTable.module.css";

type OrderTableProps = {
  orders: OrderListItem[];
};

export function OrderTable({ orders }: OrderTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Financial status</th>
            <th>Fulfillment</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.name}</strong>
              </td>

              <td>{new Date(order.createdAt).toLocaleDateString()}</td>

              <td>
                <span className={styles.badge}>
                  {order.displayFinancialStatus ?? "Unknown"}
                </span>
              </td>

              <td>{order.displayFulfillmentStatus ?? "Unfulfilled"}</td>

              <td>
                {order.currentTotalPriceSet?.shopMoney?.currencyCode}{" "}
                {order.currentTotalPriceSet?.shopMoney?.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
