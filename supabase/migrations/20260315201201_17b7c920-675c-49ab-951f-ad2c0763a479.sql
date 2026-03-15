
CREATE TABLE public.weekly_slot_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.weekly_meal_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_slot_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weekly slot recipes"
ON public.weekly_slot_recipes
FOR ALL
TO authenticated
USING (
  plan_id IN (SELECT id FROM public.weekly_meal_plans WHERE user_id = auth.uid())
)
WITH CHECK (
  plan_id IN (SELECT id FROM public.weekly_meal_plans WHERE user_id = auth.uid())
);
