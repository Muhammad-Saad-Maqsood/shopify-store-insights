export const STORE_INSIGHTS_QUERY = `#graphql
  query StoreInsights {
    products(first: 20, sortKey: UPDATED_AT, reverse: true) {
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

    orders(first: 10, sortKey: CREATED_AT, reverse: true) {
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
