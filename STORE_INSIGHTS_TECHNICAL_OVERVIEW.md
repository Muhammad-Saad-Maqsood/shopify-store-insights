# Store Insights

## Shopify Embedded Application — Technical & Implementation Overview

## 1. Application Overview

Store Insights is an embedded Shopify Admin application that presents recent store performance and provides product-management workflows. It runs inside Shopify Admin and uses Shopify's authenticated Admin GraphQL client for store data and product mutations.

The application has four primary pages:

- **Dashboard** for recent revenue, orders, and products.
- **Products** for product creation, editing, deletion, inventory setup, and media upload.
- **Orders** for a recent-order overview and status table.
- **Settings** for client-side application preferences and connection information.

## 2. Problem / Purpose

Shopify Admin is the source of truth for store data. Store Insights provides a focused embedded surface for viewing recent activity and performing common product tasks without leaving the Admin context. The app keeps Shopify data operations on the server, while the browser is responsible for page composition, form interaction, feedback, and responsive presentation.

## 3. Core Features

| Area | Implemented capability |
| --- | --- |
| Dashboard | Revenue, order count, product count, recent orders, and recent products |
| Products | List, create, edit, and delete products |
| Inventory | Tracking activation, location resolution, level activation, and available-quantity setting |
| Product media | Staged image upload during product creation |
| Orders | Recent-order count, revenue, statuses, refresh, and responsive table |
| Embedded UX | Shopify Admin navigation, Polaris Web Components, and App Bridge toast feedback |

## 4. Application Architecture

The application uses React Router's server-rendered route model with Shopify's React Router integration.

1. A request reaches a route loader or action.
2. The route authenticates the embedded Admin request with `authenticate.admin(request)`.
3. A loader calls an application service, or an action passes submitted `FormData` to the product service.
4. Server-side services execute Shopify Admin GraphQL requests and normalize successful or failed results.
5. React Router exposes loader data and action data to the route component.
6. The component renders Shopify web components and client-side feedback states.

This separates page orchestration from Shopify business operations: routes compose pages, services handle server-side workflows, and `graphql/` contains GraphQL documents.

## 5. Frontend Architecture

The frontend uses React 18, TypeScript, and Shopify web components.

- Route modules own page layout, loader/action binding, and page-level state.
- Product components contain the catalog card, create form, and edit form.
- The order table is a reusable component that formats dates, totals, and statuses.
- CSS modules are used by product components. Orders use scoped class names and inline route/component styles to keep the table layout stable across supported browsers.
- Shared client-safe shapes, including products, locations, orders, and the Admin GraphQL client, are defined in `app/types.ts`.

The Settings page currently stores its notification toggle in client state only; it does not persist a setting to Shopify or the database.

## 6. React Router Implementation

React Router provides routing, data loading, mutations, and refresh behavior.

### Loaders

- `app._index.tsx` authenticates the request and loads the Dashboard GraphQL result.
- `app.products.tsx` authenticates the request and delegates product and location loading to `loadProductsPage`.
- `app.orders.tsx` authenticates the request and delegates order loading to `loadOrdersPage`.
- `app.tsx` authenticates the embedded application shell and supplies the Shopify API key to `AppProvider`.

### Actions

The Products route exposes an action that reads submitted `FormData` and delegates to `handleProductAction`. The action selects `create`, `update`, or `delete` using the form's `intent` field.

### Client state and revalidation

- `useNavigation` identifies an in-progress product creation submission.
- `useActionData` drives product success or failure feedback.
- `useRevalidator` refreshes Dashboard and Orders data without requiring a full navigation.
- The app shell uses `useNavigation` to show a page-navigation loading indicator.

## 7. Shopify App Bridge

The embedded app is wrapped in Shopify's `AppProvider`. Products uses `useAppBridge` from `@shopify/app-bridge-react` to display a native Shopify Admin toast after a successful create, update, or delete action.

The toast complements the page banner: the banner is visible within the page for five seconds, while the App Bridge toast provides feedback in the Shopify Admin environment.

## 8. Shopify Polaris / Web Components

The UI uses Shopify Polaris web components rather than the legacy React Polaris package. Examples include:

- `s-page` for page framing and primary actions
- `s-app-nav` and `s-link` for embedded app navigation
- `s-section` for grouped page content
- `s-button` for actions and submit states
- `s-banner` for success, information, and error feedback
- `s-badge` for product, financial, and fulfillment statuses
- `s-spinner` for refresh states

Standard semantic HTML is used where appropriate, including forms, labels, tables, captions, time elements, and image alt text.

## 9. Shopify Admin GraphQL Integration

All Admin GraphQL operations run on the server through the authenticated `admin.graphql` client. GraphQL documents are kept in `app/graphql/`, grouped by domain:

- `dashboard.ts` loads recent products, product count, and recent orders.
- `products.ts` contains product, location, staged-upload, variant-price, and delete documents.
- `inventory.ts` contains inventory item, inventory level, activation, and quantity documents.
- `orders.ts` loads recent orders.

The configured access scopes are:

```text
write_products, read_orders, read_inventory, write_inventory, read_locations
```

The application uses `ApiVersion.July26` in `app/shopify.server.ts`.

## 10. Dashboard

### What it does

The Dashboard provides a compact view of recent store activity: recent revenue, recent order count, total product count, ten recent orders, and up to twenty recently updated products.

### Frontend flow

The loader returns normalized products, orders, calculated recent revenue, currency, and an optional error. The page calculates its visual states from loader data and `useRevalidator` state. A Refresh action re-runs the loader and shows both a button loading state and an informational banner.

### Shopify communication

`STORE_INSIGHTS_QUERY` requests:

- Products with title, status, total inventory, and featured image
- `productsCount`
- Orders with creation date, display statuses, and shop-money totals

Revenue is calculated in the loader from the returned recent orders; it is not a separate Shopify analytics metric.

### User flow

1. Open Dashboard in embedded Shopify Admin.
2. Review KPI cards, recent orders, and products.
3. Select Refresh to fetch the latest data.
4. See an empty state or an error banner when data is unavailable.

### Screenshot placeholder

`[Screenshot: Dashboard — recent revenue, orders, product cards, and Refresh action]`

## 11. Products CRUD

### What it does

Products supports listing products and creating, updating, and deleting them. The catalog remains the default page content; a primary Create product action reveals the creation form only when needed.

### Frontend flow

- `ProductCard` displays image, status, first variant price, total inventory, edit controls, and delete control.
- `ProductCreateForm` submits title, description, price, optional inventory, optional location, and optional image as multipart form data.
- `ProductEditForm` submits the product ID, title, description, and first variant price.
- Deletion uses a browser confirmation before submitting the delete action.
- Success closes an open edit form. A successful creation also closes the create form.
- Product action feedback uses a timed page banner and App Bridge toast; failure feedback keeps the create form available for correction.

### Shopify communication

The service uses these operations:

- `PRODUCTS_QUERY` to list up to 50 recently updated products
- `PRODUCT_CREATE_MUTATION` to create an active product
- `PRODUCT_UPDATE_MUTATION` to update product title and HTML description
- `PRODUCT_VARIANT_FOR_UPDATE_QUERY` to read the first variant and its inventory item
- `UPDATE_VARIANT_PRICE_MUTATION` to update the first variant's price
- `PRODUCT_DELETE_MUTATION` to delete a product

### User flow

1. Select Create product.
2. Enter required title and price, with optional description, image, inventory, and location.
3. Submit the form.
4. The server validates data, creates the product, updates its first-variant price, and completes any requested inventory workflow.
5. The catalog revalidates, the form closes, and confirmation is shown.
6. To edit, expand a product's Edit control, update fields, and save. To delete, select Delete and confirm the browser prompt.

### Screenshot placeholders

`[Screenshot: Products — catalog with product cards and Create product action]`

`[Screenshot: Create Product — expanded creation form with inventory, location, and image fields]`

`[Screenshot: Edit/Delete Product — inline edit fields and delete confirmation flow]`

## 12. Inventory Management

### What it does

Inventory is optional at product creation. When a quantity is supplied, the app enables tracking, ensures an inventory level exists at a location, and sets the available quantity.

### Frontend flow

The create form accepts a non-negative whole-number inventory quantity and optional location. A location selector is populated from Shopify locations. If no location is selected, the server resolves the store's first available location.

### Shopify communication

The inventory workflow in `setProductInventory` performs these steps:

1. `DEFAULT_INVENTORY_LOCATION_QUERY` resolves the first location when necessary.
2. `INVENTORY_ITEM_UPDATE_MUTATION` sets the inventory item to tracked.
3. `INVENTORY_LEVELS_QUERY` checks whether the item is active at the target location.
4. `ACTIVATE_INVENTORY_MUTATION` activates the inventory item at that location only when required.
5. `SET_INVENTORY_QUANTITY_MUTATION` sets the absolute available quantity.

The activation and quantity mutations use Shopify's `@idempotent` directive with a generated UUID. If Shopify's create-product response does not contain the inventory item ID, the service re-reads the first variant before continuing. If an inventory item or location cannot be resolved, the action returns an error instead of reporting a false success.

### User flow

1. Enter an inventory quantity while creating a product.
2. Optionally select a location, or leave it unselected to use the first available location.
3. Submit the product form.
4. The app creates the product, enables tracking, activates its inventory level when needed, and sets the quantity.

## 13. Product Image Upload

### What it does

Product creation can attach one image to the new product.

### Frontend flow

The browser accepts image files through a multipart form. The server rejects non-image files and files larger than 10 MB before requesting a Shopify upload target.

### Shopify communication

1. `STAGED_UPLOAD_MUTATION` requests a product-image upload target.
2. The server builds a `FormData` payload from Shopify's returned upload parameters and uploads the file to the staged target.
3. The staged resource URL is passed as `originalSource` in `PRODUCT_CREATE_MUTATION` as `CreateMediaInput` with `mediaContentType: IMAGE`.
4. The product title is used as the image alt text.

### User flow

1. Choose an image in the Create product form.
2. Submit the product.
3. The service stages and uploads the image before the product creation request.
4. The resulting product appears in the catalog with its featured image when Shopify has processed it.

## 14. Orders

### What it does

Orders displays up to 50 orders sorted by newest creation date, together with recent-order count and total revenue calculated from that returned set.

### Frontend flow

`OrdersPage` calculates the overview values from loader data. `OrderTable` formats dates, status labels, and monetary totals. It uses a fixed-width table layout with horizontal overflow at constrained widths, preserving readable columns on smaller screens.

### Shopify communication

`ORDERS_QUERY` requests each order's ID, name, creation date, financial status, fulfillment status, and current total shop money. `loadOrdersPage` catches API and network failures and returns a safe empty list with an error message.

This page is read-only: it does not create, edit, fulfill, or cancel orders.

### User flow

1. Open Orders.
2. Review recent order count, revenue, status badges, dates, and totals.
3. Select Refresh to request the latest orders.
4. See a refresh indicator, empty state, or API error state as appropriate.

### Screenshot placeholder

`[Screenshot: Orders — overview cards, status badges, responsive order table, and Refresh action]`

## 15. Authentication and Sessions

Shopify app configuration is centralized in `app/shopify.server.ts` using `@shopify/shopify-app-react-router` and the Node adapter.

- Every protected app loader and the Products action calls `authenticate.admin(request)` before accessing Shopify data.
- Authentication is mounted under `/auth`.
- `PrismaSessionStorage` persists Shopify sessions through the Prisma client.
- The current Prisma schema uses SQLite (`file:dev.sqlite`) and defines the Shopify session fields needed by the session adapter.
- Optional custom shop domains are read from configuration when present.

Sensitive values are read from runtime environment variables; they are not placed in route loader data, GraphQL documents, client components, or this document.

## 16. Webhooks

Webhook subscriptions are declared in `shopify.app.toml`:

- `app/uninstalled` is handled by `webhooks.app.uninstalled.tsx`.
- `app/scopes_update` is handled by `webhooks.app.scopes_update.tsx`.

Each handler uses `authenticate.webhook(request)` to verify the webhook. The uninstall handler deletes sessions for the uninstalled shop. The scope-update handler updates the authenticated session's stored scope string.

## 17. Loading, Error, and Empty States

The application provides explicit state handling throughout the primary pages.

| Area | Loading / refresh | Error | Empty |
| --- | --- | --- | --- |
| App shell | Fixed navigation loading indicator | React Router / Shopify boundary handling | Not applicable |
| Dashboard | Refresh button and informational banner | Critical banner with safe default values | Orders and products empty states |
| Products | Create button loading state | Timed failure banner; server validation messages | Catalog empty state |
| Orders | Refresh button and spinner | Critical banner and recovery text | No-orders state |

Services inspect GraphQL top-level errors and mutation user errors. Product workflows return readable errors, which prevents a failed API operation from being presented as a successful user action.

## 18. Responsive UI / UX

The Dashboard switches its KPI and product grids to a single column at narrow widths. Product cards switch from three columns to two and then one. Product form price and inventory fields stack on smaller screens.

Orders retains readable table columns using a minimum table width within a horizontally scrollable wrapper. The overview cards stack on smaller screens. Statuses are represented with Polaris badges rather than color alone, and the order table includes a caption for assistive technologies.

## 19. Project Folder Structure

```text
app/
  components/
    orders/                 Order table component
    products/               Product card and create/edit form components
  graphql/                  Shopify Admin GraphQL documents
  routes/                   App pages, auth routes, and webhook routes
  services/                 Server-side product and order workflows
  db.server.ts              Prisma client
  shopify.server.ts         Shopify app configuration and helpers
  types.ts                  Shared client-safe types
prisma/
  schema.prisma             SQLite-backed session schema
public/                     Static public assets
shopify.app.toml            App configuration, scopes, and webhook subscriptions
```

## 20. Security Considerations

- Shopify Admin API operations occur in server-side loaders, actions, and services after Admin authentication.
- The browser does not receive Shopify access tokens or invoke Admin GraphQL directly.
- Shopify sessions are stored through Prisma session storage rather than browser-managed application state.
- Webhook requests are authenticated before session deletion or scope updates occur.
- Product descriptions are HTML-escaped before being inserted into the HTML description sent to Shopify.
- Image upload input is checked for MIME type and a 10 MB size limit before staged upload.
- Create and update actions validate required title and price values; inventory must be a non-negative integer.
- Destructive product deletion requires a browser confirmation before the form submits.

## 21. Local Development

### Prerequisites

- Node.js `>=20.19 <22` or `>=22.12`
- Shopify CLI authenticated with a development store
- Shopify application configuration with the configured Admin API scopes

### Setup and start

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` generates Prisma client files and applies the Prisma migration workflow. `npm run dev` starts `shopify app dev`, which manages local application development and embedded app access.

Other available commands include `npm run start` for the built server, `npm run deploy` for Shopify app configuration deployment, and `npm run graphql-codegen` for the configured GraphQL code generation command.

## 22. Testing and Validation

The repository provides these validation commands:

```bash
npm run typecheck
npm run lint
npm run build
```

- `typecheck` generates React Router types and runs TypeScript without emitting output.
- `lint` runs ESLint over the repository.
- `build` produces the React Router client and server bundles.

Manual verification requires a Shopify development store because product, inventory, staged-upload, order, authentication, and webhook behavior depend on authenticated Shopify services.

## 23. Deployment Architecture

The application is configured as an embedded Shopify app in `shopify.app.toml`. The same application code runs as a Node server with React Router server output and uses Shopify app configuration for app URL, redirect URLs, scopes, and webhook subscriptions.

Deployment requires a hosted application URL, matching authentication redirect URLs, runtime environment configuration for Shopify credentials and app URL, and persistent session storage suitable for the deployment environment. The repository's default Prisma datasource is SQLite, which is the current local session-store configuration.

Deployed application URL: **[Add deployed URL]**

## 24. Future Extensibility

The existing boundaries support incremental changes without changing the page architecture:

- Add a GraphQL document in `app/graphql/` for a new Shopify capability.
- Add server-side behavior in a `.server.ts` service.
- Expose it through a route loader or action.
- Compose the resulting data or action state with a focused component.

Potential extensions should remain subject to the app's configured Shopify scopes and should add only the required scopes, route behavior, UI, and validation for the new workflow.

## Screenshot Placeholders

| Screen | Placeholder |
| --- | --- |
| Dashboard | `[Screenshot: Dashboard]` |
| Products | `[Screenshot: Products]` |
| Create Product | `[Screenshot: Create Product]` |
| Edit/Delete Product | `[Screenshot: Edit/Delete Product]` |
| Orders | `[Screenshot: Orders]` |
| Settings | `[Screenshot: Settings]` |
