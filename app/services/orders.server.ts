import { ORDERS_QUERY } from "../graphql/orders";
import type { AdminGraphqlClient, OrderListItem } from "../types";

export type { OrderListItem };

export type OrdersLoaderData = {
  orders: OrderListItem[];
};

export async function loadOrdersPage(
  admin: AdminGraphqlClient,
): Promise<OrdersLoaderData> {
  const response = await admin.graphql(ORDERS_QUERY);
  const result = (await response.json()) as {
    data?: {
      orders?: {
        nodes?: OrderListItem[];
      };
    };
  };

  return {
    orders: result.data?.orders?.nodes ?? [],
  };
}
