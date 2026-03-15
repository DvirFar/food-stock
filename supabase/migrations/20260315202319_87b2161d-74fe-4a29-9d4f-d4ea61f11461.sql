
-- Create shabbat_plan_sections table
CREATE TABLE public.shabbat_plan_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.shabbat_plans(id) ON DELETE CASCADE,
  slot text NOT NULL, -- 'friday' or 'saturday'
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shabbat_plan_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shabbat plan sections" ON public.shabbat_plan_sections
  FOR SELECT USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_plan_sections.plan_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can create their shabbat plan sections" ON public.shabbat_plan_sections
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_plan_sections.plan_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update their shabbat plan sections" ON public.shabbat_plan_sections
  FOR UPDATE USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_plan_sections.plan_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete their shabbat plan sections" ON public.shabbat_plan_sections
  FOR DELETE USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_plan_sections.plan_id AND p.user_id = auth.uid()));

-- Create shabbat_section_recipes table
CREATE TABLE public.shabbat_section_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.shabbat_plan_sections(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shabbat_section_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shabbat section recipes" ON public.shabbat_section_recipes
  FOR SELECT USING (EXISTS (SELECT 1 FROM shabbat_plan_sections s JOIN shabbat_plans p ON p.id = s.plan_id WHERE s.id = shabbat_section_recipes.section_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can create their shabbat section recipes" ON public.shabbat_section_recipes
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shabbat_plan_sections s JOIN shabbat_plans p ON p.id = s.plan_id WHERE s.id = shabbat_section_recipes.section_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update their shabbat section recipes" ON public.shabbat_section_recipes
  FOR UPDATE USING (EXISTS (SELECT 1 FROM shabbat_plan_sections s JOIN shabbat_plans p ON p.id = s.plan_id WHERE s.id = shabbat_section_recipes.section_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete their shabbat section recipes" ON public.shabbat_section_recipes
  FOR DELETE USING (EXISTS (SELECT 1 FROM shabbat_plan_sections s JOIN shabbat_plans p ON p.id = s.plan_id WHERE s.id = shabbat_section_recipes.section_id AND p.user_id = auth.uid()));
