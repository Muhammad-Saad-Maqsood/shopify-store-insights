export const PRODUCTS_QUERY = `#graphql
  query ProductsPage {
    products(first: 50, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        status
        description
        totalInventory
        featuredImage {
          url
          altText
        }
        variants(first: 1) {
          nodes {
            price
          }
        }
      }
    }
  }
`;

export const PRODUCT_VARIANTS_QUERY = `#graphql
  query ProductVariants($productId: ID!) {
    product(id: $productId) {
      id
      title
      resourcePublications(first: 10) {
        nodes {
          isPublished
          publication {
            id
            catalog {
              title
            }
          }
        }
      }
      variants(first: 50) {
        nodes {
          id
          title
          price
          inventoryQuantity
          inventoryPolicy
          inventoryItem {
            id
            tracked
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

export const LOCATIONS_QUERY = `#graphql
  query ProductLocations {
    locations(first: 10) {
      nodes {
        id
        name
      }
    }
  }
`;

export const STAGED_UPLOAD_MUTATION = `#graphql
  mutation CreateStagedUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_CREATE_MUTATION = `#graphql
  mutation CreateProduct(
    $product: ProductCreateInput!
    $media: [CreateMediaInput!]
  ) {
    productCreate(
      product: $product
      media: $media
    ) {
      product {
        id
        title
        status
        variants(first: 1) {
          nodes {
            id
            price
            inventoryQuantity
            inventoryItem {
              id
              tracked
            }
          }
        }
        media(first: 1) {
          nodes {
            alt
            mediaContentType
            status
          }
        }
      }

      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_UPDATE_MUTATION = `#graphql
  mutation UpdateProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        title
        descriptionHtml
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_DELETE_MUTATION = `#graphql
  mutation DeleteProduct($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_VARIANT_FOR_UPDATE_QUERY = `#graphql
  query ProductVariantForUpdate($id: ID!) {
    product(id: $id) {
      variants(first: 50) {
        nodes {
          id
          inventoryItem {
            id
          }
        }
      }
    }
  }
`;

export const UPDATE_VARIANT_PRICE_MUTATION = `#graphql
  mutation UpdateVariantPrice(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(
      productId: $productId
      variants: $variants
    ) {
      product {
        id
      }
      productVariants {
        id
        price
        inventoryPolicy
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_VARIANT_STOREFRONT_POLICY_MUTATION = `#graphql
  mutation UpdateVariantStorefrontPolicy(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(
      productId: $productId
      variants: $variants
    ) {
      productVariants {
        id
        inventoryPolicy
      }
      userErrors {
        field
        message
      }
    }
  }
`;
