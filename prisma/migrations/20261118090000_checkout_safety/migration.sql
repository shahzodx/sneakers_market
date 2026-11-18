ALTER TABLE "Order" ADD COLUMN "requestHash" TEXT;
ALTER TABLE "Order" ADD COLUMN "demo" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Order" o SET "demo" = true WHERE EXISTS (
 SELECT 1 FROM "OrderItem" i JOIN "ProductVariant" v ON v.id=i."variantId"
 JOIN "Product" p ON p.id=v."productId" WHERE i."orderId"=o.id AND p.demo
);
