/*
  # Add GhostsPays Provider Support

  1. Changes
    - Add 'ghostspays' to the allowed provider types in pix_provider_settings table
    - This enables GhostsPays as a payment provider option alongside existing providers
  
  2. Security
    - No changes to RLS policies (existing policies remain in effect)
  
  3. Notes
    - GhostsPays uses Authorization Basic authentication with Secret Key and Company ID
    - API Base URL: https://api.ghostspaysv2.com/functions/v1
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pix_provider_settings' 
    AND column_name = 'provider'
  ) THEN
    ALTER TABLE pix_provider_settings 
    DROP CONSTRAINT IF EXISTS pix_provider_settings_provider_check;
    
    ALTER TABLE pix_provider_settings
    ADD CONSTRAINT pix_provider_settings_provider_check 
    CHECK (provider IN ('mangofy', 'genesys', 'aureo', 'bestfy', 'babylon', 'ghostspays'));
  END IF;
END $$;
