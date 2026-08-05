ALTER TABLE public.shabbat_section_recipes
  ALTER COLUMN recipe_id DROP NOT NULL,
  ADD COLUMN custom_name text;

ALTER TABLE public.shabbat_extra_recipes
  ALTER COLUMN recipe_id DROP NOT NULL,
  ADD COLUMN custom_name text;

ALTER TABLE public.shabbat_section_recipes
  ADD CONSTRAINT shabbat_section_recipes_name_or_recipe
  CHECK (recipe_id IS NOT NULL OR (custom_name IS NOT NULL AND length(btrim(custom_name)) > 0 AND length(custom_name) <= 200));

ALTER TABLE public.shabbat_extra_recipes
  ADD CONSTRAINT shabbat_extra_recipes_name_or_recipe
  CHECK (recipe_id IS NOT NULL OR (custom_name IS NOT NULL AND length(btrim(custom_name)) > 0 AND length(custom_name) <= 200));