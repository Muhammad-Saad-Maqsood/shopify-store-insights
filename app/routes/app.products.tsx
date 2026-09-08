import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

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
      }
    }
  }
`;

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(PRODUCTS_QUERY);
    
    const result = (await response.json()) as {
      data?: any;
      errors?: Array<{ message: string }>;
    };

    if (result.errors?.length) {
      return {
        products: [],
        error: "Shopify could not load the products.",
      };
    }

    return {
      products: result.data?.products?.nodes ?? [],
      error: null,
    };
  } catch {
    return {
      products: [],
      error: "Unable to connect to Shopify.",
    };
  }
}

export default function ProductsPage() {
  const { products, error } = useLoaderData<typeof loader>();

    {error && (
    <s-banner
      heading="Unable to load products"
      tone="critical"
    >
      {error}
    </s-banner>
  )}

  return (
    <s-page heading="Products">
      <s-section heading="Product catalog">
        <s-paragraph>
          Products are loaded directly from the Shopify Admin GraphQL API.
        </s-paragraph>
      </s-section>

      <s-section>
        {products.length === 0 ? (
          <s-paragraph>
            No products found in this store.
          </s-paragraph>
        ) : (
          <div className="products-grid">
            {products.map((product: any) => (
              <article className="product-card" key={product.id}>
                {product.featuredImage?.url ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                  />
                ) : (
                  <div className="image-placeholder">
                    No image
                  </div>
                )}

                <div className="product-content">
                  <div className="product-header">
                    <h3>{product.title}</h3>

                    <span className="status">
                      {product.status}
                    </span>
                  </div>

                  <p>
                    Inventory:{" "}
                    <strong>{product.totalInventory ?? 0}</strong>
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </s-section>

      <style>{`
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .product-card {
          overflow: hidden;
          border: 1px solid #e1e3e5;
          border-radius: 12px;
          background: white;
        }

        .product-card img,
        .image-placeholder {
          width: 100%;
          height: 190px;
          object-fit: cover;
        }

        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6f6f7;
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

        p {
          margin: 10px 0 0;
          color: #6d7175;
        }

        .status {
          padding: 4px 8px;
          border-radius: 999px;
          background: #f1f1f1;
          font-size: 11px;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </s-page>
  );
}