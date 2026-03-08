
-- Weekly meal plan: one row per user per week
CREATE TABLE public.weekly_meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL, -- always a Sunday
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly plans" ON public.weekly_meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weekly plans" ON public.weekly_meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weekly plans" ON public.weekly_meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weekly plans" ON public.weekly_meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Slots: each day has lunch/dinner, each can hold a meal_id reference
CREATE TABLE public.weekly_plan_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.weekly_meal_plans(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  meal_type TEXT NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, day_of_week, meal_type)
);

ALTER TABLE public.weekly_plan_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan slots" ON public.weekly_plan_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_slots.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can create their own plan slots" ON public.weekly_plan_slots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_slots.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update their own plan slots" ON public.weekly_plan_slots FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_slots.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own plan slots" ON public.weekly_plan_slots FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_slots.plan_id AND p.user_id = auth.uid()));

-- Day notes: text notes per day in a weekly plan
CREATE TABLE public.weekly_plan_day_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.weekly_meal_plans(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  note_type TEXT NOT NULL CHECK (note_type IN ('lunch', 'dinner', 'general')),
  content TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_plan_day_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day notes" ON public.weekly_plan_day_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_day_notes.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can create their own day notes" ON public.weekly_plan_day_notes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_day_notes.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update their own day notes" ON public.weekly_plan_day_notes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_day_notes.plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own day notes" ON public.weekly_plan_day_notes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_meal_plans p WHERE p.id = weekly_plan_day_notes.plan_id AND p.user_id = auth.uid()));
