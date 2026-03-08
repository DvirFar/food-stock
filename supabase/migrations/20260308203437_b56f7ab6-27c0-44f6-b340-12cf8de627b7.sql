
-- Shabbat plans table
CREATE TABLE public.shabbat_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  friday_meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  saturday_meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.shabbat_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shabbat plans" ON public.shabbat_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own shabbat plans" ON public.shabbat_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shabbat plans" ON public.shabbat_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shabbat plans" ON public.shabbat_plans FOR DELETE USING (auth.uid() = user_id);

-- Extra recipes for shabbat (cakes, salads, etc.)
CREATE TABLE public.shabbat_extra_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.shabbat_plans(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shabbat_extra_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shabbat extra recipes" ON public.shabbat_extra_recipes FOR SELECT USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_extra_recipes.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can create their shabbat extra recipes" ON public.shabbat_extra_recipes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_extra_recipes.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update their shabbat extra recipes" ON public.shabbat_extra_recipes FOR UPDATE USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_extra_recipes.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete their shabbat extra recipes" ON public.shabbat_extra_recipes FOR DELETE USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_extra_recipes.plan_id AND p.user_id = auth.uid()));

-- Dish washing assignments
CREATE TABLE public.shabbat_dish_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.shabbat_plans(id) ON DELETE CASCADE,
  round TEXT NOT NULL, -- 'friday', 'saturday_morning', 'saturday_evening'
  sink INTEGER NOT NULL, -- 1 or 2
  person TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, round, sink)
);

ALTER TABLE public.shabbat_dish_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their dish assignments" ON public.shabbat_dish_assignments FOR SELECT USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_dish_assignments.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can create their dish assignments" ON public.shabbat_dish_assignments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_dish_assignments.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update their dish assignments" ON public.shabbat_dish_assignments FOR UPDATE USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_dish_assignments.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete their dish assignments" ON public.shabbat_dish_assignments FOR DELETE USING (EXISTS (SELECT 1 FROM shabbat_plans p WHERE p.id = shabbat_dish_assignments.plan_id AND p.user_id = auth.uid()));
