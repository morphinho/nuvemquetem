/*
  # Add ParadisePays Provider Support

  1. Changes
    - Add 'paradisepays' to the allowed provider types in pix_provider_settings table
    - This enables ParadisePays as a payment provider option
  
  2. Security
    - No changes to RLS policies (existing policies remain in effect)
  
  3. Notes
    - ParadisePays uses X-API-Key authentication
    - API Base URL: https://multi.paradisepays.com/api/v1
    - Example product hash: prod_8ca172a327b01bc0
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
    CHECK (provider IN ('mangofy', 'genesys', 'aureo', 'bestfy', 'babylon', 'ghostspays', 'paradisepays'));
  END IF;
END $$;
