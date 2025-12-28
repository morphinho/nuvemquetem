/*
  # Add Webhook Tracking Fields

  1. Changes
    - Add `updated_via_webhook` boolean field to track webhook updates
    - Add `webhook_updated_at` timestamp to track when webhook last updated
    - These fields help prevent polling from overwriting webhook updates
  
  2. Purpose
    - Prevent race conditions between webhook and polling
    - Allow polling to skip API calls when webhook already confirmed payment
    - Improve payment confirmation reliability
*/

-- Add webhook tracking fields to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'updated_via_webhook'
  ) THEN
    ALTER TABLE transactions ADD COLUMN updated_via_webhook boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'webhook_updated_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN webhook_updated_at timestamptz;
  END IF;
END $$;

-- Create index for faster queries on webhook-updated transactions
CREATE INDEX IF NOT EXISTS idx_transactions_webhook_updated 
ON transactions(updated_via_webhook, webhook_updated_at);
