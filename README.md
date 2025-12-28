anubis

## ParadisePays Configuration

To use ParadisePays as a payment provider, configure the following fields in the `pix_provider_settings` table:

- `provider`: paradisepays
- `api_url`: https://multi.paradisepays.com/api/v1
- `secret_key`: Your ParadisePays X-API-Key
- `product_hash`: Your product hash (example: prod_8ca172a327b01bc0)
- `recipient_id`: Optional - Numeric recipient ID for splits (only if using splits feature)
- `is_active`: true
