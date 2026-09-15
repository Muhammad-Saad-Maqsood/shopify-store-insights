export type ProductListItem = {
  id: string;
  title: string;
  status: string;
  description?: string | null;
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

export type ProductVariantItem = {
  id: string;
  title: string;
  price: string;
  inventoryQuantity: number | null;
  inventoryPolicy?: string | null;
  inventoryItem?: {
    id: string;
    tracked: boolean;
  } | null;
  selectedOptions?: Array<{
    name: string;
    value: string;
  }>;
};

export type ProductVariantsData = {
  productId: string;
  productTitle: string;
  variants: ProductVariantItem[];
  error: string | null;
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
