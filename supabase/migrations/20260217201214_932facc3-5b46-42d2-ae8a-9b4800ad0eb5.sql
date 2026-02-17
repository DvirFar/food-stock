
-- Change products.category from enum to text
ALTER TABLE public.products ALTER COLUMN category TYPE text USING category::text;
ALTER TABLE public.products ALTER COLUMN category SET DEFAULT 'other';

-- Change products.location from enum to text
ALTER TABLE public.products ALTER COLUMN location TYPE text USING location::text;
ALTER TABLE public.products ALTER COLUMN location SET DEFAULT 'fridge';

-- Change shopping_list_items.category from enum to text
ALTER TABLE public.shopping_list_items ALTER COLUMN category TYPE text USING category::text;
ALTER TABLE public.shopping_list_items ALTER COLUMN category SET DEFAULT 'other';
