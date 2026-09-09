# Store Insights

Store Insights is an embedded Shopify Admin application for monitoring recent store activity and managing products. It combines Shopify-native UI with React Router data loading and Shopify Admin GraphQL API operations.

## Core features

### Dashboard

- Recent revenue, order count, and product count
- Recent orders with financial and fulfillment statuses
- Product cards with images, availability, and inventory totals
- Refresh, loading, error, and empty states

### Products CRUD

- Responsive product catalog with an on-demand creation form
- Create, edit, and delete product flows
- Title, description, and first-variant price updates
- Deletion confirmation, timed success/error banners, and native Shopify Admin toasts

### Inventory management

- Optional inventory quantity and location during product creation
- Automatic first-location fallback when inventory is supplied without a selected location
- Inventory tracking activation and available-quantity updates through the Admin GraphQL API
- Clear failures when Shopify cannot provide a required inventory item or location

### Product image upload

- Shopify staged uploads for product media
- Image alt text based on the product title
- Client-side image type and 10 MB size validation

### Orders

- Recent-order overview with count and revenue
- Responsive, cross-browser order table
- Financial and fulfillment status badges
- Refresh, loading, empty, and API-error states

## Shopify integration

- **Embedded Shopify Admin:** Admin navigation and embedded route handling
- **Shopify Admin GraphQL API:** product, inventory, location, order, and dashboard operations
- **React Router:** loaders for authenticated server-side data, actions for product mutations, revalidation, and navigation state
- **Polaris web components:** Shopify-native pages, sections, buttons, badges, banners, and loading UI
- **App Bridge:** native Shopify Admin toast feedback after successful product actions
- **Authentication:** Shopify session authentication with Prisma-backed session storage
- **Webhooks:** app uninstall removes stored sessions; scopes-update persists the session scopes

## Architecture

```text
app/
├── components/  # Reusable product and order UI
├── graphql/     # Admin GraphQL documents
├── routes/      # React Router loaders, actions, and page composition
├── services/    # Server-side Shopify and inventory workflows
├── types.ts     # Shared client-safe types
└── shopify.server.ts
```

## Tech stack

- React 18 and TypeScript
- React Router 7
- Shopify App React Router
- Shopify Admin GraphQL API (July 2026)
- Polaris web components and Shopify App Bridge
- Prisma with SQLite session storage
- Shopify CLI and Vite

## Local development

### Prerequisites

- Node.js `>=20.19 <22` or `>=22.12`
- Shopify CLI authenticated with a development store
- A Shopify app configuration with the required Admin API scopes

### Setup

```bash
npm install
npm run setup
npm run dev
```

`npm run dev` starts Shopify CLI development, links the app configuration, and provides a tunnel for the embedded app. Open the generated Admin URL, install the app in the selected development store, and navigate to **Apps → Store Insights**.

Current Admin API scopes:

```text
write_products, read_orders, read_inventory, write_inventory, read_locations
```
