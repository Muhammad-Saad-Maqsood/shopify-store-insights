export const DEFAULT_INVENTORY_LOCATION_QUERY = `#graphql
  query DefaultInventoryLocation {
    locations(first: 1) {
      nodes {
        id
      }
    }
  }
`;

export const INVENTORY_ITEM_UPDATE_MUTATION = `#graphql
  mutation InventoryItemUpdate(
    $id: ID!
    $input: InventoryItemInput!
  ) {
    inventoryItemUpdate(
      id: $id
      input: $input
    ) {
      inventoryItem {
        id
        tracked
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const INVENTORY_LEVELS_QUERY = `#graphql
  query InventoryLevels($inventoryItemId: ID!) {
    inventoryItem(id: $inventoryItemId) {
      inventoryLevels(first: 50) {
        nodes {
          location {
            id
          }
        }
      }
    }
  }
`;

export const ACTIVATE_INVENTORY_MUTATION = `#graphql
  mutation ActivateInventory(
    $inventoryItemId: ID!
    $locationId: ID!
    $idempotencyKey: String!
  ) {
    inventoryActivate(
      inventoryItemId: $inventoryItemId
      locationId: $locationId
    ) @idempotent(key: $idempotencyKey) {
      inventoryLevel {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const SET_INVENTORY_QUANTITY_MUTATION = `#graphql
  mutation SetInventoryQuantity(
    $input: InventorySetQuantitiesInput!
    $idempotencyKey: String!
  ) {
    inventorySetQuantities(
      input: $input
    ) @idempotent(key: $idempotencyKey) {
      inventoryAdjustmentGroup {
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;
