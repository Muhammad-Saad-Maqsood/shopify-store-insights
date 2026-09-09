import {
  ACTIVATE_INVENTORY_MUTATION,
  DEFAULT_INVENTORY_LOCATION_QUERY,
  INVENTORY_ITEM_UPDATE_MUTATION,
  INVENTORY_LEVELS_QUERY,
  SET_INVENTORY_QUANTITY_MUTATION,
} from "../graphql/inventory";
import {
  LOCATIONS_QUERY,
  PRODUCT_CREATE_MUTATION,
  PRODUCT_DELETE_MUTATION,
  PRODUCT_UPDATE_MUTATION,
  PRODUCT_VARIANT_FOR_UPDATE_QUERY,
  PRODUCTS_QUERY,
  STAGED_UPLOAD_MUTATION,
  UPDATE_VARIANT_PRICE_MUTATION,
} from "../graphql/products";
import type {
  AdminGraphqlClient,
  ProductListItem,
  ProductLocation,
} from "../types";

export type { AdminGraphqlClient, ProductListItem, ProductLocation };

export type ProductsLoaderData = {
  products: ProductListItem[];
  locations: ProductLocation[];
  error: string | null;
};

export type ProductActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      product: {
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
      };
      error: null;
    }
  | {
      success: false;
      error: string;
    };

type GraphqlUserError = {
  field: string[];
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function loadProductsPage(
  admin: AdminGraphqlClient,
): Promise<ProductsLoaderData> {
  try {
    const productsResponse = await admin.graphql(PRODUCTS_QUERY);

    const productsResult = (await productsResponse.json()) as {
      data?: {
        products?: {
          nodes?: ProductListItem[];
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

    let locations: ProductLocation[] = [];

    try {
      const locationsResponse = await admin.graphql(LOCATIONS_QUERY);

      const locationsResult = (await locationsResponse.json()) as {
        data?: {
          locations?: {
            nodes?: ProductLocation[];
          };
        };
        errors?: Array<{ message: string }>;
      };

      if (!locationsResult.errors?.length) {
        locations = locationsResult.data?.locations?.nodes ?? [];
      }
    } catch {
      // Products can still load even if locations fail.
    }

    return {
      products: productsResult.data?.products?.nodes ?? [],
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

async function deleteProduct(
  admin: AdminGraphqlClient,
  productId: string,
): Promise<ProductActionResult> {
  if (!productId) {
    return {
      success: false,
      message: "Product ID is required.",
    };
  }

  try {
    const response = await admin.graphql(PRODUCT_DELETE_MUTATION, {
      variables: {
        input: {
          id: productId,
        },
      },
    });

    const result = (await response.json()) as {
      data?: {
        productDelete?: {
          deletedProductId?: string | null;
          userErrors?: GraphqlUserError[];
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

    const errors = result.data?.productDelete?.userErrors ?? [];

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

async function updateProduct(
  admin: AdminGraphqlClient,
  formData: FormData,
): Promise<ProductActionResult> {
  const productId = String(formData.get("productId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceValue = String(formData.get("price") || "").trim();
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
    const productResponse = await admin.graphql(PRODUCT_UPDATE_MUTATION, {
      variables: {
        product: {
          id: productId,
          title,
          descriptionHtml: description
            ? `<p>${escapeHtml(description)}</p>`
            : "",
        },
      },
    });

    const productResult = (await productResponse.json()) as {
      data?: {
        productUpdate?: {
          userErrors?: GraphqlUserError[];
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
      PRODUCT_VARIANT_FOR_UPDATE_QUERY,
      {
        variables: {
          id: productId,
        },
      },
    );

    const variantResult = (await variantResponse.json()) as {
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
        UPDATE_VARIANT_PRICE_MUTATION,
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

      const priceResult = (await priceResponse.json()) as {
        data?: {
          productVariantsBulkUpdate?: {
            userErrors?: GraphqlUserError[];
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

async function setProductInventory(options: {
  admin: AdminGraphqlClient;
  inventoryItemId: string;
  locationId: string;
  inventory: number;
}): Promise<ProductActionResult | null> {
  const { admin, inventoryItemId, inventory } = options;
  let targetLocationId = options.locationId;

  // If no location was selected, use the first store location.
  if (!targetLocationId) {
    const locationResponse = await admin.graphql(
      DEFAULT_INVENTORY_LOCATION_QUERY,
    );

    const locationResult = (await locationResponse.json()) as {
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
    INVENTORY_ITEM_UPDATE_MUTATION,
    {
      variables: {
        id: inventoryItemId,
        input: {
          tracked: true,
        },
      },
    },
  );

  const trackingResult = (await trackingResponse.json()) as {
    data?: {
      inventoryItemUpdate?: {
        userErrors?: GraphqlUserError[];
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
  const levelsResponse = await admin.graphql(INVENTORY_LEVELS_QUERY, {
    variables: {
      inventoryItemId,
    },
  });

  const levelsResult = (await levelsResponse.json()) as {
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
    (level) => level.location.id === targetLocationId,
  );

  // 3. Activate only when necessary.
  if (!isAlreadyActive) {
    const activateResponse = await admin.graphql(
      ACTIVATE_INVENTORY_MUTATION,
      {
        variables: {
          inventoryItemId,
          locationId: targetLocationId,
          idempotencyKey: crypto.randomUUID(),
        },
      },
    );

    const activateResult = (await activateResponse.json()) as {
      data?: {
        inventoryActivate?: {
          userErrors?: GraphqlUserError[];
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
    SET_INVENTORY_QUANTITY_MUTATION,
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

  const inventoryResult = (await inventoryResponse.json()) as {
    data?: {
      inventorySetQuantities?: {
        userErrors?: GraphqlUserError[];
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

  return null;
}

async function createProduct(
  admin: AdminGraphqlClient,
  formData: FormData,
): Promise<ProductActionResult> {
  const title = String(formData.get("title") || "").trim();

  const description = String(formData.get("description") || "").trim();

  const priceValue = String(formData.get("price") || "").trim();

  const inventoryValue = String(formData.get("inventory") || "").trim();

  const locationId = String(formData.get("locationId") || "").trim();

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

  if (!priceValue || !Number.isFinite(price) || price < 0) {
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

    if (!Number.isInteger(parsedInventory) || parsedInventory < 0) {
      return {
        success: false,
        error: "Inventory must be a whole number of 0 or greater.",
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

    const stagedResponse = await admin.graphql(STAGED_UPLOAD_MUTATION, {
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
    });

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
          userErrors?: GraphqlUserError[];
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

    const staged = stagedResult.data?.stagedUploadsCreate;

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
        error: "Shopify did not provide an image upload target.",
      };
    }

    const uploadForm = new FormData();

    for (const parameter of target.parameters) {
      uploadForm.append(parameter.name, parameter.value);
    }

    uploadForm.append("file", image);

    const uploadResponse = await fetch(target.url, {
      method: "POST",
      body: uploadForm,
    });

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
      ? `<p>${escapeHtml(description)}</p>`
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

    const media = stagedResourceUrl
      ? [
          {
            originalSource: stagedResourceUrl,
            mediaContentType: "IMAGE",
            alt: title,
          },
        ]
      : undefined;

    const response = await admin.graphql(PRODUCT_CREATE_MUTATION, {
      variables: {
        product: productInput,
        media,
      },
    });

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

          userErrors?: GraphqlUserError[];
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

    const createResult = result.data?.productCreate;

    if (createResult?.userErrors?.length) {
      return {
        success: false,
        error: createResult.userErrors[0].message,
      };
    }

    if (!createResult?.product) {
      return {
        success: false,
        error: "Shopify did not return the created product.",
      };
    }

    const product = createResult.product;

    /*
     * Price is optional in the API flow only because
     * productCreate creates the initial variant.
     *
     * We update its price immediately after creation.
     */

    const variantId = product.variants?.nodes?.[0]?.id;

    if (variantId) {
      const priceResponse = await admin.graphql(
        UPDATE_VARIANT_PRICE_MUTATION,
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

      const priceResult = (await priceResponse.json()) as {
        data?: {
          productVariantsBulkUpdate?: {
            userErrors?: GraphqlUserError[];
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
        priceResult.data?.productVariantsBulkUpdate?.userErrors;

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
        const inventoryError = await setProductInventory({
          admin,
          inventoryItemId,
          locationId,
          inventory,
        });

        if (inventoryError) {
          return inventoryError;
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

export async function handleProductAction(
  admin: AdminGraphqlClient,
  formData: FormData,
): Promise<ProductActionResult> {
  const intent = String(formData.get("intent") || "create");

  if (intent === "delete") {
    const productId = String(formData.get("productId") || "").trim();
    return deleteProduct(admin, productId);
  }

  if (intent === "update") {
    return updateProduct(admin, formData);
  }

  return createProduct(admin, formData);
}
