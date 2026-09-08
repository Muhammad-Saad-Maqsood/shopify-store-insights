import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";

import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { useEffect, useState } from "react";

import { authenticate } from "../shopify.server";

const PRODUCTS_QUERY = `#graphql
  query ProductsPage {
    products(first: 50, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        title
        status
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

const LOCATIONS_QUERY = `#graphql
  query ProductLocations {
    locations(first: 10) {
      nodes {
        id
        name
      }
    }
  }
`;

const STAGED_UPLOAD_MUTATION = `#graphql
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

const PRODUCT_CREATE_MUTATION = `#graphql
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

const PRODUCT_UPDATE_MUTATION = `#graphql
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

const PRODUCT_DELETE_MUTATION = `#graphql
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

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  try {
    const productsResponse = await admin.graphql(PRODUCTS_QUERY);

    const productsResult = (await productsResponse.json()) as {
      data?: {
        products?: {
          nodes?: Array<{
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
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (productsResult.errors?.length) {
      return {
        products: [],
        locations: [],
        error:
          productsResult.errors[0]?.message ??
          "Shopify could not load the products.",
      };
    }

    let locations: Array<{
      id: string;
      name: string;
    }> = [];

    try {
      const locationsResponse =
        await admin.graphql(LOCATIONS_QUERY);

      const locationsResult =
        (await locationsResponse.json()) as {
          data?: {
            locations?: {
              nodes?: Array<{
                id: string;
                name: string;
              }>;
            };
          };
          errors?: Array<{ message: string }>;
        };

      if (!locationsResult.errors?.length) {
        locations =
          locationsResult.data?.locations?.nodes ?? [];
      }
    } catch {
      // Products can still load even if locations fail.
    }

    return {
      products:
        productsResult.data?.products?.nodes ?? [],
      locations,
      error: null,
    };
  } catch {
    return {
      products: [],
      locations: [],
      error: "Unable to connect to Shopify.",
    };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();

  const intent = String(formData.get("intent") || "create");

  if (intent === "delete") {
    const productId = String(
      formData.get("productId") || "",
    ).trim();

    if (!productId) {
      return {
        success: false,
        message: "Product ID is required.",
      };
    }

    try {
      const response = await admin.graphql(
        PRODUCT_DELETE_MUTATION,
        {
          variables: {
            input: {
              id: productId,
            },
          },
        },
      );

      const result = (await response.json()) as {
        data?: {
          productDelete?: {
            deletedProductId?: string | null;
            userErrors?: Array<{
              field: string[];
              message: string;
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      if (result.errors?.length) {
        return {
          success: false,
          message: result.errors[0].message,
        };
      }

      const errors =
        result.data?.productDelete?.userErrors ?? [];

      if (errors.length) {
        return {
          success: false,
          message: errors[0].message,
        };
      }

      return {
        success: true,
        message: "Product deleted successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete product.",
      };
    }
  }

  if (intent === "update") {
    const productId = String(
      formData.get("productId") || "",
    ).trim();

    const title = String(
      formData.get("title") || "",
    ).trim();

    const description = String(
      formData.get("description") || "",
    ).trim();

    const priceValue = String(
      formData.get("price") || "",
    ).trim();

    const price = Number(priceValue);

    if (!productId) {
      return {
        success: false,
        message: "Product ID is required.",
      };
    }

    if (!title) {
      return {
        success: false,
        message: "Product title is required.",
      };
    }

    if (!priceValue || !Number.isFinite(price) || price < 0) {
      return {
        success: false,
        message: "Enter a valid product price.",
      };
    }

    try {
      // Update product fields
      const productResponse = await admin.graphql(
        PRODUCT_UPDATE_MUTATION,
        {
          variables: {
            product: {
              id: productId,
              title,
              descriptionHtml: description
                ? `<p>${description
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</p>`
                : "",
            },
          },
        },
      );

      const productResult =
        (await productResponse.json()) as {
          data?: {
            productUpdate?: {
              userErrors?: Array<{
                field: string[];
                message: string;
              }>;
            };
          };
          errors?: Array<{ message: string }>;
        };

      if (productResult.errors?.length) {
        return {
          success: false,
          message: productResult.errors[0].message,
        };
      }

      const productErrors =
        productResult.data?.productUpdate?.userErrors ?? [];

      if (productErrors.length) {
        return {
          success: false,
          message: productErrors[0].message,
        };
      }

      // Get the product's first variant
      const variantResponse = await admin.graphql(
        `#graphql
          query ProductVariantForUpdate($id: ID!) {
            product(id: $id) {
              variants(first: 1) {
                nodes {
                  id
                }
              }
            }
          }
        `,
        {
          variables: {
            id: productId,
          },
        },
      );

      const variantResult =
        (await variantResponse.json()) as {
          data?: {
            product?: {
              variants?: {
                nodes?: Array<{
                  id: string;
                }>;
              };
            };
          };
        };

      const variantId =
        variantResult.data?.product?.variants?.nodes?.[0]?.id;

      if (variantId) {
        const priceResponse = await admin.graphql(
          `#graphql
            mutation UpdateVariantPrice(
              $productId: ID!
              $variants: [ProductVariantsBulkInput!]!
            ) {
              productVariantsBulkUpdate(
                productId: $productId
                variants: $variants
              ) {
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          {
            variables: {
              productId,
              variants: [
                {
                  id: variantId,
                  price: price.toFixed(2),
                },
              ],
            },
          },
        );

        const priceResult =
          (await priceResponse.json()) as {
            data?: {
              productVariantsBulkUpdate?: {
                userErrors?: Array<{
                  field: string[];
                  message: string;
                }>;
              };
            };
            errors?: Array<{ message: string }>;
          };

        if (priceResult.errors?.length) {
          return {
            success: false,
            message: priceResult.errors[0].message,
          };
        }

        const priceErrors =
          priceResult.data?.productVariantsBulkUpdate?.userErrors ?? [];

        if (priceErrors.length) {
          return {
            success: false,
            message: priceErrors[0].message,
          };
        }
      }

      return {
        success: true,
        message: "Product updated successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update product.",
      };
    }
  }

  const title = String(formData.get("title") || "").trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const priceValue = String(
    formData.get("price") || "",
  ).trim();

  const inventoryValue = String(
    formData.get("inventory") || "",
  ).trim();

  const locationId = String(
    formData.get("locationId") || "",
  ).trim();

  const image = formData.get("image");

  /*
   * -------------------------
   * Validation
   * -------------------------
   */

  if (!title) {
    return {
      success: false,
      error: "Product title is required.",
    };
  }

  const price = Number(priceValue);

  if (
    !priceValue ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return {
      success: false,
      error: "Enter a valid product price.",
    };
  }

  /*
   * Inventory is optional.
   *
   * Empty inventory = no inventory quantity will be set.
   */
  let inventory: number | undefined;

  if (inventoryValue !== "") {
    const parsedInventory = Number(inventoryValue);

    if (
      !Number.isInteger(parsedInventory) ||
      parsedInventory < 0
    ) {
      return {
        success: false,
        error:
          "Inventory must be a whole number of 0 or greater.",
      };
    }

    inventory = parsedInventory;
  }

  /*
   * Location is optional.
   *
   * If the user enters inventory but does not select
   * a location, we cannot assign that inventory.
   */
  
  let stagedResourceUrl: string | null = null;
  let imageFilename: string | null = null;
  let imageContentType: string | null = null;

  /*
   * -------------------------
   * 1. Upload image
   * -------------------------
   */

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      return {
        success: false,
        error: "Only image files are supported.",
      };
    }

    if (image.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "Image must be smaller than 10 MB.",
      };
    }

    imageFilename = image.name;
    imageContentType = image.type;

    const stagedResponse = await admin.graphql(
      STAGED_UPLOAD_MUTATION,
      {
        variables: {
          input: [
            {
              filename: image.name,
              mimeType: image.type,
              resource: "PRODUCT_IMAGE",
              httpMethod: "POST",
              fileSize: String(image.size),
            },
          ],
        },
      },
    );

    const stagedResult = (await stagedResponse.json()) as {
      data?: {
        stagedUploadsCreate?: {
          stagedTargets?: Array<{
            url: string;
            resourceUrl: string;
            parameters: Array<{
              name: string;
              value: string;
            }>;
          }>;
          userErrors?: Array<{
            field: string[];
            message: string;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (stagedResult.errors?.length) {
      return {
        success: false,
        error: stagedResult.errors[0].message,
      };
    }

    const staged =
      stagedResult.data?.stagedUploadsCreate;

    if (staged?.userErrors?.length) {
      return {
        success: false,
        error: staged.userErrors[0].message,
      };
    }

    const target = staged?.stagedTargets?.[0];

    if (!target) {
      return {
        success: false,
        error:
          "Shopify did not provide an image upload target.",
      };
    }

    const uploadForm = new FormData();

    for (const parameter of target.parameters) {
      uploadForm.append(
        parameter.name,
        parameter.value,
      );
    }

    uploadForm.append("file", image);

    const uploadResponse = await fetch(
      target.url,
      {
        method: "POST",
        body: uploadForm,
      },
    );

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: "Shopify image upload failed.",
      };
    }

    stagedResourceUrl = target.resourceUrl;
  }

  /*
   * -------------------------
   * 2. Build product input
   * -------------------------
   */

  const productInput: Record<string, unknown> = {
    title,

    descriptionHtml: description
      ? `<p>${description
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</p>`
      : undefined,

    status: "ACTIVE",
  };

  /*
   * -------------------------
   * 3. Attach image
   * -------------------------
   */

  /*
   * -------------------------
   * 4. Create product
   * -------------------------
   */

  try {
    /*
    * Create the product first.
    *
    * Price, inventory and location are handled separately
    * because inventory is optional.
    */

    const media =
      stagedResourceUrl
        ? [
            {
              originalSource: stagedResourceUrl,
              mediaContentType: "IMAGE",
              alt: title,
            },
          ]
        : undefined;

    const response = await admin.graphql(
      PRODUCT_CREATE_MUTATION,
      {
        variables: {
          product: productInput,
          media,
        },
      },
    );

    const result = (await response.json()) as {
      data?: {
        productCreate?: {
          product?: {
            id: string;
            title: string;
            status: string;
            variants?: {
              nodes?: Array<{
                id: string;
                price: string;
                inventoryQuantity: number | null;
                inventoryItem?: {
                  id: string;
                  tracked: boolean;
                };
              }>;
            };
          } | null;

          userErrors?: Array<{
            field: string[];
            message: string;
          }>;
        };
      };

      errors?: Array<{
        message: string;
      }>;
    };

    if (result.errors?.length) {
      return {
        success: false,
        error: result.errors[0].message,
      };
    }

    const createResult =
      result.data?.productCreate;

    if (createResult?.userErrors?.length) {
      return {
        success: false,
        error:
          createResult.userErrors[0].message,
      };
    }

    if (!createResult?.product) {
      return {
        success: false,
        error:
          "Shopify did not return the created product.",
      };
    }

    const product = createResult.product;

    /*
    * Price is optional in the API flow only because
    * productCreate creates the initial variant.
    *
    * We update its price immediately after creation.
    */

    const variantId =
      product.variants?.nodes?.[0]?.id;

    if (variantId) {
      const priceResponse = await admin.graphql(
        `#graphql
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
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        {
          variables: {
            productId: product.id,
            variants: [
              {
                id: variantId,
                price: price.toFixed(2),
              },
            ],
          },
        },
      );

      const priceResult =
        (await priceResponse.json()) as {
          data?: {
            productVariantsBulkUpdate?: {
              userErrors?: Array<{
                field: string[];
                message: string;
              }>;
            };
          };
          errors?: Array<{
            message: string;
          }>;
        };

      if (priceResult.errors?.length) {
        return {
          success: false,
          error: priceResult.errors[0].message,
        };
      }

      const priceErrors =
        priceResult.data?.productVariantsBulkUpdate
          ?.userErrors;

      if (priceErrors?.length) {
        return {
          success: false,
          error: priceErrors[0].message,
        };
      }
    }

      /*
     * Enable inventory tracking when inventory was provided.
     *
     * If no location is selected, automatically use the
     * first available Shopify location.
     */
    
      if (variantId && inventory !== undefined) {
        const inventoryItemId =
          product.variants?.nodes?.[0]?.inventoryItem?.id;

        if (inventoryItemId) {
          let targetLocationId = locationId;

          // If no location was selected, use the first store location.
          if (!targetLocationId) {
            const locationResponse = await admin.graphql(
              `#graphql
                query DefaultInventoryLocation {
                  locations(first: 1) {
                    nodes {
                      id
                    }
                  }
                }
              `,
            );

            const locationResult =
              (await locationResponse.json()) as {
                data?: {
                  locations?: {
                    nodes?: Array<{
                      id: string;
                    }>;
                  };
                };
                errors?: Array<{
                  message: string;
                }>;
              };

            if (locationResult.errors?.length) {
              return {
                success: false,
                error: locationResult.errors[0].message,
              };
            }

            targetLocationId =
              locationResult.data?.locations?.nodes?.[0]?.id ?? "";
          }

          if (!targetLocationId) {
            return {
              success: false,
              error: "No inventory location is available.",
            };
          }

          // 1. Enable inventory tracking.
          const trackingResponse = await admin.graphql(
            `#graphql
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
            `,
            {
              variables: {
                id: inventoryItemId,
                input: {
                  tracked: true,
                },
              },
            },
          );

          const trackingResult =
            (await trackingResponse.json()) as {
              data?: {
                inventoryItemUpdate?: {
                  userErrors?: Array<{
                    field: string[];
                    message: string;
                  }>;
                };
              };
              errors?: Array<{
                message: string;
              }>;
            };

          if (trackingResult.errors?.length) {
            return {
              success: false,
              error: trackingResult.errors[0].message,
            };
          }

          const trackingErrors =
            trackingResult.data?.inventoryItemUpdate?.userErrors;

          if (trackingErrors?.length) {
            return {
              success: false,
              error: trackingErrors[0].message,
            };
          }

          // 2. Check whether the inventory item is already active
          // at the target location.
          const levelsResponse = await admin.graphql(
            `#graphql
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
            `,
            {
              variables: {
                inventoryItemId,
              },
            },
          );

          const levelsResult =
            (await levelsResponse.json()) as {
              data?: {
                inventoryItem?: {
                  inventoryLevels?: {
                    nodes?: Array<{
                      location: {
                        id: string;
                      };
                    }>;
                  };
                };
              };
              errors?: Array<{
                message: string;
              }>;
            };

          if (levelsResult.errors?.length) {
            return {
              success: false,
              error: levelsResult.errors[0].message,
            };
          }

          const activeLocations =
            levelsResult.data?.inventoryItem?.inventoryLevels?.nodes ?? [];

          const isAlreadyActive = activeLocations.some(
            (level) =>
              level.location.id === targetLocationId,
          );

          // 3. Activate only when necessary.
          if (!isAlreadyActive) {
            const activateResponse = await admin.graphql(
              `#graphql
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
              `,
              {
                variables: {
                  inventoryItemId,
                  locationId: targetLocationId,
                  idempotencyKey: crypto.randomUUID(),
                },
              },
            );

            const activateResult =
              (await activateResponse.json()) as {
                data?: {
                  inventoryActivate?: {
                    userErrors?: Array<{
                      field: string[];
                      message: string;
                    }>;
                  };
                };
                errors?: Array<{
                  message: string;
                }>;
              };

            if (activateResult.errors?.length) {
              return {
                success: false,
                error: activateResult.errors[0].message,
              };
            }

            const activateErrors =
              activateResult.data?.inventoryActivate?.userErrors;

            if (activateErrors?.length) {
              return {
                success: false,
                error: activateErrors[0].message,
              };
            }
          }

          // 4. Now that the inventory level is active,
          // set the requested available quantity.
          const inventoryResponse = await admin.graphql(
            `#graphql
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
            `,
            {
              variables: {
                input: {
                  name: "available",
                  reason: "correction",
                  quantities: [
                    {
                      inventoryItemId,
                      locationId: targetLocationId,
                      quantity: inventory,
                      changeFromQuantity: null,
                    },
                  ],
                },
                idempotencyKey: crypto.randomUUID(),
              },
            },
          );

          const inventoryResult =
            (await inventoryResponse.json()) as {
              data?: {
                inventorySetQuantities?: {
                  userErrors?: Array<{
                    field: string[];
                    message: string;
                  }>;
                };
              };
              errors?: Array<{
                message: string;
              }>;
            };

          if (inventoryResult.errors?.length) {
            return {
              success: false,
              error: inventoryResult.errors[0].message,
            };
          }

          const inventoryErrors =
            inventoryResult.data?.inventorySetQuantities?.userErrors;

          if (inventoryErrors?.length) {
            return {
              success: false,
              error: inventoryErrors[0].message,
            };
          }
        }
      } 
    return {
      success: true,
      product,
      error: null,
    };
  } catch (error) {
    console.error("Product creation failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the product.",
    };
  }
}

export default function ProductsPage() {
  const {
    products,
    locations,
    error,
  } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [openEditId, setOpenEditId] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success) {
      setOpenEditId(null);
    }
  }, [actionData]);

  const isCreating =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "create";

  return (
    <s-page heading="Products">
      {error && (
        <s-banner
          heading="Unable to load products"
          tone="critical"
        >
          {error}
        </s-banner>
      )}

      {actionData?.success && (
        <s-banner
          heading="Success"
          tone="success"
        >
          {actionData.message}
        </s-banner>
      )}

      {actionData?.message && !actionData.success && (
        <s-banner
          heading="Action failed"
          tone="critical"
        >
          {actionData.message}
        </s-banner>
      )}

      <s-section heading="Create product">
        <Form
          method="post"
          encType="multipart/form-data"
        >
          <input
            type="hidden"
            name="intent"
            value="create"
          />

          <div className="create-form">
            <div className="field">
              <label htmlFor="title">
                Product title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Premium Hoodie"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Add a short product description..."
                rows={4}
              />
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="price">
                  Price
                </label>

                <div className="input-with-prefix">
                  <span>$</span>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="79.99"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="inventory">
                  Inventory
                </label>

                <input
                  id="inventory"
                  name="inventory"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="25"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="locationId">
                Inventory location
              </label>

              <select
                id="locationId"
                name="locationId"
                defaultValue=""
              >
                <option value="">
                  No Inventory Location
                </option>

                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="image">
                Product image
              </label>

              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
              />

              <span className="field-help">
                JPG, PNG, WEBP or another standard image
                format. Maximum 10 MB.
              </span>
            </div>

            <s-button
              type="submit"
              variant="primary"
              loading={isCreating}
            >
              {isCreating
                ? "Creating product..."
                : "Create product"}
            </s-button>
          </div>
        </Form>
      </s-section>

      <s-section heading="Product catalog">
        <div className="catalog-header">
          <div>
            <strong>
              {products.length} products
            </strong>

          </div>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <strong>No products found</strong>

            <p>
              Create your first product above.
            </p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => {
              const price =
                product.variants?.nodes?.[0]?.price;

              return (
                <article
                  className="product-card"
                  key={product.id}
                >
                  {product.featuredImage?.url ? (
                    <img
                      src={product.featuredImage.url}
                      alt={
                        product.featuredImage.altText ||
                        product.title
                      }
                    />
                  ) : (
                    <div className="image-placeholder">
                      No image
                    </div>
                  )}

                  <div className="product-content">
                    <div className="product-header">
                      <h3>{product.title}</h3>

                      <s-badge tone="success">
                        {product.status}
                      </s-badge>
                    </div>

                    <div className="product-meta">
                      <span>
                        {price
                          ? `$${price}`
                          : "No price"}
                      </span>

                      <span>
                        {product.totalInventory ?? 0}{" "}
                        units
                      </span>
                    </div>
                    <div className="product-actions">
                      <details
                       className="edit-details"
                       open={openEditId === product.id}
                        onToggle={(event) => {
                          setOpenEditId(
                            event.currentTarget.open
                              ? product.id
                              : null,
                          );
                        }}
                       >
                        <summary>Edit</summary>

                        <Form method="post" className="edit-form">
                          <input
                            type="hidden"
                            name="intent"
                            value="update"
                          />

                          <input
                            type="hidden"
                            name="productId"
                            value={product.id}
                          />

                          <input
                            name="title"
                            defaultValue={product.title}
                            placeholder="Product title"
                            required
                          />

                          <input
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={price ?? ""}
                            placeholder="Price"
                            required
                          />

                          <textarea
                            name="description"
                            placeholder="Description"
                            rows={3}
                          />

                          <s-button type="submit" variant="primary">
                            Save changes
                          </s-button>
                        </Form>
                      </details>

                      <Form
                        method="post"
                        onSubmit={(event) => {
                          if (
                            !window.confirm(
                              `Delete "${product.title}"?`
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input
                          type="hidden"
                          name="intent"
                          value="delete"
                        />

                        <input
                          type="hidden"
                          name="productId"
                          value={product.id}
                        />

                        <s-button type="submit">
                          Delete
                        </s-button>
                      </Form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </s-section>

      <style>{`
        .create-form {
          display: grid;
          gap: 18px;
          max-width: 720px;
        }

        .field {
          display: grid;
          gap: 7px;
        }

        .field label {
          font-size: 13px;
          font-weight: 600;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid #c9cccf;
          border-radius: 8px;
          background: white;
          color: #202223;
          font: inherit;
        }

        .field textarea {
          resize: vertical;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          outline: none;
          border-color: #2c6ecb;
          box-shadow: 0 0 0 1px #2c6ecb;
        }

        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-with-prefix {
          position: relative;
        }

        .input-with-prefix > span {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6d7175;
          pointer-events: none;
        }

        .input-with-prefix input {
          padding-left: 28px;
        }

        .field-help {
          font-size: 12px;
          color: #6d7175;
        }

        .catalog-header {
          margin-bottom: 18px;
        }

        .catalog-header p {
          margin: 5px 0 0;
          color: #6d7175;
          font-size: 13px;
        }

        .products-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .product-card {
          overflow: hidden;
          border: 1px solid
            var(--s-color-border);
          border-radius: 12px;
          background:
            var(--s-color-bg-surface);
        }

        .product-card img,
        .image-placeholder {
          width: 100%;
          height: 190px;
          object-fit: contain;
          display: block;
          background: var(--s-color-bg-surface-secondary);
        }

        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            var(--s-color-bg-surface-secondary);
          color: #6d7175;
        }

        .product-content {
          padding: 16px;
        }

        .product-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        h3 {
          margin: 0;
          font-size: 16px;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 13px;
          color: #6d7175;
        }

        .product-meta span:first-child {
          font-weight: 600;
          color: inherit;
        }

        .empty-state {
          padding: 36px 20px;
          text-align: center;
          border: 1px dashed
            var(--s-color-border);
          border-radius: 10px;
        }

        .empty-state strong {
          display: block;
          margin-bottom: 6px;
        }

        .empty-state p {
          margin: 0;
          color: #6d7175;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .products-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .field-grid,
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .product-actions {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 14px;
        }

        .edit-details {
          flex: 1;
        }

        .edit-details summary {
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .edit-form {
          display: grid;
          gap: 8px;
          margin-top: 10px;
        }

        .edit-form input,
        .edit-form textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 9px 10px;
          border: 1px solid #c9cccf;
          border-radius: 8px;
          font: inherit;
        }
      `}</style>
    </s-page>
  );
}