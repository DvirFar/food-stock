CREATE TABLE public.shabbat_default_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('friday','saturday')),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shabbat_default_sections TO authenticated;
GRANT ALL ON public.shabbat_default_sections TO service_role;
ALTER TABLE public.shabbat_default_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own default sections"
  ON public.shabbat_default_sections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shabbat_default_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.shabbat_default_sections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (section_id, recipe_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shabbat_default_recipes TO authenticated;
GRANT ALL ON public.shabbat_default_recipes TO service_role;
ALTER TABLE public.shabbat_default_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own default recipes"
  ON public.shabbat_default_recipes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_shabbat_default_sections_user ON public.shabbat_default_sections(user_id, slot, sort_order);
CREATE INDEX idx_shabbat_default_recipes_section ON public.shabbat_default_recipes(section_id, sort_order);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shabbat_default_sections_updated_at
  BEFORE UPDATE ON public.shabbat_default_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shabbat_default_recipes_updated_at
  BEFORE UPDATE ON public.shabbat_default_recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();