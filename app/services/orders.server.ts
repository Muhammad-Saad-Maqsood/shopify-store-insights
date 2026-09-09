import { ORDERS_QUERY } from "../graphql/orders";
import type { AdminGraphqlClient, OrderListItem } from "../types";

export type { OrderListItem };

export type OrdersLoaderData = {
  orders: OrderListItem[];
  error: string | null;
};

export async function loadOrdersPage(
  admin: AdminGraphqlClient,
): Promise<OrdersLoaderData> {
  try {
    const response = await admin.graphql(ORDERS_QUERY);
    const result = (await response.json()) as {
      data?: {
        orders?: {
          nodes?: OrderListItem[];
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors?.length) {
      return {
        orders: [],
        error: "Shopify could not load the latest orders.",
      };
    }

    return {
      orders: result.data?.orders?.nodes ?? [],
      error: null,
    };
  } catch {
    return {
      orders: [],
      error: "Unable to connect to Shopify. Try refreshing the page.",
    };
  }
}
