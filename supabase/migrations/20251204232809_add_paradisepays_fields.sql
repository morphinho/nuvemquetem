/*
  # Add ParadisePays Specific Fields to PIX Provider Settings

  1. Changes
    - Add `product_hash` column (text, nullable) - Product hash/code from ParadisePays panel (required for transactions)
    - Add `recipient_id` column (text, nullable) - Numeric recipient ID for splits (optional, only if using splits feature)
  
  2. Purpose
    - `product_hash`: Required field by ParadisePays API for creating transactions
    - `recipient_id`: Optional field for splitting payments with coproducers/partners
  
  3. Notes
    - These fields are specific to ParadisePays provider
    - Other providers will have null values for these columns
    - Product hash can be found in product details on ParadisePays dashboard
    - Example product hash: prod_8ca172a327b01bc0
    - Recipient ID must be numeric and is only needed if using splits functionality
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pix_provider_settings' AND column_name = 'product_hash'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN product_hash text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pix_provider_settings' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN recipient_id text;
  END IF;
END $$;