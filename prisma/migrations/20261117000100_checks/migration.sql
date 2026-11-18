ALTER TABLE "Inventory" ADD CONSTRAINT "inventory_nonnegative" CHECK ("quantity" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_price_positive" CHECK ("price" > 0 AND ("oldPrice" IS NULL OR "oldPrice" > 0));
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_size_range" CHECK ("size" BETWEEN 20 AND 55);
ALTER TABLE "CartItem" ADD CONSTRAINT "cart_quantity_range" CHECK ("quantity" BETWEEN 1 AND 10);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_valid" CHECK ("quantity" BETWEEN 1 AND 10 AND "price" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "order_totals_valid" CHECK ("subtotal" > 0 AND "discount" >= 0 AND "discount" <= "subtotal" AND "delivery" >= 0 AND "total" = "subtotal" - "discount" + "delivery");
ALTER TABLE "Coupon" ADD CONSTRAINT "coupon_valid" CHECK ("percent" BETWEEN 1 AND 80 AND "minSubtotal" >= 0);
ALTER TABLE "Review" ADD CONSTRAINT "review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "Payment" ADD CONSTRAINT "payment_amount_positive" CHECK ("amount" > 0);
