# Database Migrations

Run these scripts against your PostgreSQL database to keep the schema in sync with the application.

## 001_add_updated_at_and_notes_to_deals.sql
Adds `updated_at` (timestamp with time zone) and `notes` (text) columns to the `deals` table. Existing rows get their `updated_at` initialized to `created_at`.

## 002_add_deals_updated_at_trigger.sql
Adds a trigger so the `updated_at` column is automatically refreshed on every update to a deal.
