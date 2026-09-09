import type { OrderListItem } from "../../types";

type OrderTableProps = {
  orders: OrderListItem[];
};

function formatStatus(status?: string | null) {
  if (!status) return "Unfulfilled";

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function financialTone(status?: string | null) {
  return status === "PAID" ? "success" : "warning";
}

function fulfillmentTone(status?: string | null) {
  return status === "FULFILLED" ? "success" : "info";
}

export function OrderTable({ orders }: OrderTableProps) {
  return (
    <>
      <style>{`
        .store-insights-order-table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--s-color-border, #e1e3e5);
          border-radius: 10px;
        }

        .store-insights-order-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .store-insights-order-table th,
        .store-insights-order-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid var(--s-color-border, #e1e3e5);
          white-space: nowrap;
        }

        .store-insights-order-table th {
          background: var(--s-color-bg-surface-secondary, #f6f6f7);
          color: #616161;
          font-size: 13px;
          font-weight: 600;
        }

        .store-insights-order-table th:nth-child(1) { width: 21%; }
        .store-insights-order-table th:nth-child(2) { width: 18%; }
        .store-insights-order-table th:nth-child(3) { width: 23%; }
        .store-insights-order-table th:nth-child(4) { width: 22%; }
        .store-insights-order-table th:nth-child(5) { width: 16%; }

        .store-insights-order-table td {
          font-size: 14px;
        }

        .store-insights-order-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .store-insights-order-table tbody tr:hover {
          background: var(--s-color-bg-surface-hover, #f6f6f7);
        }

        .store-insights-order-cell strong,
        .store-insights-order-cell span {
          display: block;
        }

        .store-insights-order-cell span {
          margin-top: 3px;
          color: #616161;
          font-size: 12px;
        }

        .store-insights-order-total {
          font-weight: 650;
          text-align: right !important;
        }

        .store-insights-visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>

      <div className="store-insights-order-table-wrapper">
      <table className="store-insights-order-table">
        <caption className="store-insights-visually-hidden">
          Recent store orders
        </caption>
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
              <td className="store-insights-order-cell">
                <strong>{order.name || "Draft order"}</strong>
                <span>Order details</span>
              </td>

              <td>
                <time dateTime={order.createdAt}>
                  {new Intl.DateTimeFormat(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(order.createdAt))}
                </time>
              </td>

              <td>
                <s-badge tone={financialTone(order.displayFinancialStatus)}>
                  {formatStatus(order.displayFinancialStatus ?? "Unknown")}
                </s-badge>
              </td>

              <td>
                <s-badge
                  tone={fulfillmentTone(order.displayFulfillmentStatus)}
                >
                  {formatStatus(order.displayFulfillmentStatus)}
                </s-badge>
              </td>

              <td className="store-insights-order-total">
                {order.currentTotalPriceSet?.shopMoney?.currencyCode ?? "—"}{" "}
                {order.currentTotalPriceSet?.shopMoney?.amount ?? "0.00"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
