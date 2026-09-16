export const STORE_INSIGHTS_QUERY = `#graphql
  query StoreInsights {
    shop {
      currencyCode
    }

    products(first: 20, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        status
        totalInventory
        featuredImage {
          url
          altText
        }
      }
    }

    productsCount {
      count
    }

    ordersCount {
      count
    }

    orders(first: 5, sortKey: CREATED_AT, reverse: true) {
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

    revenueOrders: orders(first: 250, sortKey: CREATED_AT, reverse: true) {
      nodes {
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
