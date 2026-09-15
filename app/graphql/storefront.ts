export const FULFILLMENT_LOCATION_QUERY = `#graphql
  query FulfillmentLocation {
    locations(first: 10) {
      nodes {
        id
        name
        fulfillsOnlineOrders
      }
    }
  }
`;

export const ONLINE_STORE_PUBLICATION_QUERY = `#graphql
  query OnlineStorePublication {
    publications(first: 20) {
      nodes {
        id
        catalog {
          title
        }
      }
    }
  }
`;

export const PUBLISHABLE_PUBLISH_MUTATION = `#graphql
  mutation PublishToOnlineStore(
    $id: ID!
    $input: [PublicationInput!]!
  ) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
