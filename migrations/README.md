# Database Migrations

Run these scripts against your PostgreSQL database to keep the schema in sync with the application.

The easiest way is to execute all outstanding migrations with:

```
npm run migrate
```

This script will apply any `.sql` files in this directory in order and record which ones have been run.

## 001_add_updated_at_and_notes_to_deals.sql
Adds `updated_at` (timestamp with time zone) and `notes` (text) columns to the `deals` table. Existing rows get their `updated_at` initialized to `created_at`.

## 002_add_deals_updated_at_trigger.sql
Adds a trigger so the `updated_at` column is automatically refreshed on every update to a deal.

## 003_create_task_categories.sql
Creates a `task_categories` table and links existing tasks via a foreign key.

## 004_create_transactions_table.sql
Adds a `transactions` table for recording standalone cashflow entries.
