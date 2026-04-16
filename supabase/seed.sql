-- Sample data for Gonggu Platform
-- Run AFTER `supabase/schema.sql`

do $$
declare
  v_seller uuid := gen_random_uuid();
  v_producer uuid := gen_random_uuid();
  p1 uuid;
  p2 uuid;
  g1 uuid;
begin
  -- products
  insert into public.products (producer_id, name, description, image_url, wholesale_price)
  values
    (v_producer, '제주 감귤 5kg', '산지 직송, 당도 좋은 감귤', null, 9000)
  returning id into p1;

  insert into public.products (producer_id, name, description, image_url, wholesale_price)
  values
    (v_producer, '유기농 토마토 2kg', '샐러드용으로 좋은 유기농 토마토', null, 7000)
  returning id into p2;

  -- gonggu
  insert into public.gonggu (
    seller_id, product_id, title, sale_price, min_quantity, current_quantity, deadline, status
  )
  values
    (
      v_seller,
      p1,
      '신선한 제주 감귤 공동구매',
      15000,
      10,
      0,
      now() + interval '7 days',
      'open'
    )
  returning id into g1;

  -- a couple of orders (will also increment current_quantity via trigger)
  insert into public.orders (gonggu_id, consumer_name, consumer_phone, quantity, total_price)
  values
    (g1, '홍길동', '010-0000-0000', 1, 15000),
    (g1, '김철수', '010-1111-1111', 2, 30000);
end $$;

