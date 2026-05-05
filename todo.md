# AlphaPOS v2 - Feature Tracking

## Authentication & Core
- [x] Manus OAuth login page with role selection
- [x] Role-based access control (Shop Owner, Manager, Cashier, Stock Manager)
- [x] Persistent sidebar with role-based menu visibility
- [x] User profile display in sidebar
- [x] Logout functionality

## Dashboard
- [x] KPI cards (Daily, Weekly, Monthly, Yearly sales)
- [x] Gross profit and net profit cards
- [x] Product count and user count cards
- [x] Sales chart visualization
- [x] Expense chart visualization
- [x] Profit breakdown chart

## Products Management
- [x] Product CRUD operations
- [x] Stock tracking and display
- [x] Purchase price and sale price fields
- [x] Unit profit calculation and display
- [x] Branch filtering for products
- [x] Product list table with actions

## Sales Management
- [x] Record product sales with quantity input
- [x] Automatic stock deduction on sale
- [x] Sales history table
- [x] Filter sales by branch
- [x] Filter sales by date period
- [x] Sale profit calculation display

## Services Management
- [x] Record service sales
- [x] Branch assignment for services
- [x] Service history view
- [x] Filter services by branch
- [x] Filter services by date period

## Expenses Management
- [x] Expense CRUD operations
- [x] Branch assignment for expenses
- [x] Period-based expense summaries (daily, weekly, monthly, yearly)
- [x] Expense list table with actions
- [x] Filter expenses by branch

## Users Management
- [x] Users management page (Shop Owner only)
- [x] Create staff accounts with role and branch assignment
- [x] Edit staff accounts
- [x] Delete staff accounts
- [x] Users list table with actions
- [x] Role-based access control enforcement

## Branches Management
- [x] Branch CRUD operations
- [x] Branch name and location fields
- [x] Branches list table with actions
- [x] Branch filtering across all modules

## Reports
- [x] Sales vs expenses chart
- [x] Profit breakdown visualization
- [x] Exportable transaction history table
- [x] Period-based report filtering
- [x] Branch-based report filtering

## UI/UX Polish
- [x] Elegant typography and spacing
- [x] Professional color scheme
- [x] Responsive mobile layout
- [x] Loading states and skeletons
- [x] Error handling and validation
- [x] Toast notifications for user feedback
- [x] Empty states for tables and lists

## Database & Backend
- [x] Database schema for all entities
- [x] tRPC procedures for all features
- [x] Database migrations
- [x] Query helpers in db.ts
