-- KIXO authorizes requests in Next.js / Auth.js, not through PostgREST.
-- Deny direct Data API access, including sensitive users/orders/payment tables.
-- Table owners and the server database role retain their normal access.
DO $$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'User', 'Address', 'Brand', 'Category', 'Product', 'ProductImage',
    'ProductVariant', 'ProductTranslation', 'Inventory', 'Cart', 'CartItem',
    'Wishlist', 'Order', 'OrderItem', 'OrderHistory', 'Payment', 'Coupon',
    'Review', 'Subscriber', 'Setting', 'RateLimit', '_prisma_migrations'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, api_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
