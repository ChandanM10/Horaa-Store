# Horaa Store — Unified Project

This archive combines the previous Starter, Stage 2 and Stage 3 work into one source tree and adds the generated Himalayan visual assets, local branding assets, Docker files and deployment documentation.

## Stages included

### Stage 1 — Storefront foundation
- Next.js / React / TypeScript
- Horaa light lavender visual system
- Home page, categories, product cards and product details
- Cart and local persistence
- Responsive navigation

### Stage 2 — Commerce foundation
- FastAPI backend
- Checkout and order creation
- Stock validation
- Coupons
- Order status workflow
- PC Builder compatibility checks
- Admin foundation

### Stage 3 — Ecommerce platform foundation
- Customer registration/login
- Password hashing
- Account area
- Wishlist
- Reviews API/UI
- Saved PC builds
- Shop search/filter/sort
- Admin product/inventory/order/analytics areas
- Nepal NPR, COD/eSewa/Khalti/Fonepay payment method selection

### Visual update
- Himalayan technology hero artwork
- Dark cinematic Himalayan technology artwork
- Horaa Store logo asset
- Local assets instead of depending on the hero image on Unsplash

## Important production boundary

The payment buttons are intentionally not fake integrations. Real eSewa, Khalti and Fonepay payment initiation, signature generation, webhook/callback verification, reconciliation and refund flows must be connected with merchant credentials and tested against the current gateway documentation before accepting real money.

The current backend remains SQLite-first for easy development. For launch, migrate users, products, orders and inventory to PostgreSQL and add migrations, backups, transactional inventory locking, audit logs, rate limiting and monitoring.
