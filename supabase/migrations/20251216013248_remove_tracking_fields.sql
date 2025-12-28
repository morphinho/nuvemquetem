/*
  # Remove All Tracking Fields and Tables

  This migration removes all tracking-related functionality from the database:

  1. Tables Removed
    - `user_logs` - Complete table with user activity tracking data

  2. Triggers and Functions Removed
    - `transaction_status_change_trigger` - Trigger for UTMify sync on status change
    - `trigger_utmify_resync_on_status_change()` - Function that handled UTMify resync

  3. Columns Removed from `transactions` table
    - Campaign Tracking: utm_source, utm_medium, utm_campaign, utm_term, utm_content
    - Source Tracking: src, sck, product_id
    - User Tracking: user_ip, user_agent
    - UTMify Sync: utmify_sent, utmify_sent_at, utmify_response, utmify_error, utmify_last_status_synced

  4. Indexes Removed
    - All indexes related to tracking fields
*/

-- Drop trigger first (depends on function)
DROP TRIGGER IF EXISTS transaction_status_change_trigger ON transactions;

-- Drop function
DROP FUNCTION IF EXISTS trigger_utmify_resync_on_status_change();

-- Drop indexes on tracking fields
DROP INDEX IF EXISTS idx_transactions_utmify_sent;
DROP INDEX IF EXISTS idx_transactions_utmify_sent_at;
DROP INDEX IF EXISTS idx_transactions_utm_source;
DROP INDEX IF EXISTS idx_transactions_utm_campaign;
DROP INDEX IF EXISTS idx_transactions_src;
DROP INDEX IF EXISTS idx_transactions_product_id;

-- Remove tracking columns from transactions table
ALTER TABLE transactions 
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS src,
  DROP COLUMN IF EXISTS sck,
  DROP COLUMN IF EXISTS product_id,
  DROP COLUMN IF EXISTS user_ip,
  DROP COLUMN IF EXISTS user_agent,
  DROP COLUMN IF EXISTS utmify_sent,
  DROP COLUMN IF EXISTS utmify_sent_at,
  DROP COLUMN IF EXISTS utmify_response,
  DROP COLUMN IF EXISTS utmify_error,
  DROP COLUMN IF EXISTS utmify_last_status_synced;

-- Drop user_logs table completely
DROP TABLE IF EXISTS user_logs;