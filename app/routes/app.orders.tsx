import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";

const ORDERS_QUERY = `#graphql
  query OrdersPage {
    orders(first: 50, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(ORDERS_QUERY);
  const result = await response.json();

  return {
    orders: result.data?.orders?.nodes ?? [],
  };
}

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof loader>();

  const totalRevenue = orders.reduce(
    (total: number, order: any) =>
      total +
      Number(
        order.currentTotalPriceSet?.shopMoney?.amount ?? 0,
      ),
    0,
  );

  const currency =
    orders[0]?.currentTotalPriceSet?.shopMoney?.currencyCode ?? "USD";

  return (
    <s-page heading="Orders">
      <s-section heading="Order overview">
        <div className="stats">
          <div className="stat-card">
            <span>Total orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="stat-card">
            <span>Recent revenue</span>
            <strong>
              {currency} {totalRevenue.toFixed(2)}
            </strong>
          </div>
        </div>
      </s-section>

      <s-section heading="Recent orders">
        {orders.length === 0 ? (
          <s-paragraph>
            No orders were found in this store.
          </s-paragraph>
        ) : (
          <div className="table-wrapper">
            <table>
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
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.name}</strong>
                    </td>

                    <td>
                      {new Date(
                        order.createdAt,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <span className="badge">
                        {order.displayFinancialStatus ?? "Unknown"}
                      </span>
                    </td>

                    <td>
                      {order.displayFulfillmentStatus ?? "Unfulfilled"}
                    </td>

                    <td>
                      {order.currentTotalPriceSet?.shopMoney
                        ?.currencyCode}{" "}
                      {order.currentTotalPriceSet?.shopMoney?.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </s-section>

      <style>{`
        .stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .stat-card {
          padding: 20px;
          border: 1px solid #e1e3e5;
          border-radius: 12px;
          background: white;
        }

        .stat-card span {
          display: block;
          margin-bottom: 8px;
          color: #6d7175;
          font-size: 13px;
        }

        .stat-card strong {
          font-size: 26px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 14px 12px;
          text-align: left;
          border-bottom: 1px solid #e1e3e5;
          white-space: nowrap;
        }

        th {
          color: #6d7175;
          font-size: 13px;
          font-weight: 600;
        }

        td {
          font-size: 14px;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          background: #f1f1f1;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 700px) {
          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </s-page>
  );
}