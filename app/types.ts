export type ProductListItem = {
  id: string;
  title: string;
  status: string;
  totalInventory: number | null;
  featuredImage?: {
    url: string;
    altText?: string | null;
  } | null;
  variants?: {
    nodes?: Array<{
      price: string;
    }>;
  };
};

export type ProductLocation = {
  id: string;
  name: string;
};

export type OrderListItem = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  currentTotalPriceSet?: {
    shopMoney?: {
      amount: string;
      currencyCode: string;
    };
  };
};

export type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};
