-- Drop the old partial unique index
DROP INDEX IF EXISTS products_user_shopify_unique;

-- Add a proper unique constraint on (user_id, shopify_id) 
-- This will work with ON CONFLICT DO UPDATE
ALTER TABLE products 
ADD CONSTRAINT products_user_shopify_unique UNIQUE (user_id, shopify_id);
