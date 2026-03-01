
-- Create meals table
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_sections table (parts of a meal like appetizer, main, dessert)
CREATE TABLE public.meal_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_section_recipes (recipes within each section)
CREATE TABLE public.meal_section_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.meal_sections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  servings_override INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_section_recipes ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view their own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Meal sections policies (via meal ownership)
CREATE POLICY "Users can view their meal sections" ON public.meal_sections FOR SELECT USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_sections.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can create their meal sections" ON public.meal_sections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_sections.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can update their meal sections" ON public.meal_sections FOR UPDATE USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_sections.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can delete their meal sections" ON public.meal_sections FOR DELETE USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_sections.meal_id AND meals.user_id = auth.uid()));

-- Meal section recipes policies (via section -> meal ownership)
CREATE POLICY "Users can view their meal section recipes" ON public.meal_section_recipes FOR SELECT USING (EXISTS (SELECT 1 FROM public.meal_sections ms JOIN public.meals m ON m.id = ms.meal_id WHERE ms.id = meal_section_recipes.section_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can create their meal section recipes" ON public.meal_section_recipes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.meal_sections ms JOIN public.meals m ON m.id = ms.meal_id WHERE ms.id = meal_section_recipes.section_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can update their meal section recipes" ON public.meal_section_recipes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.meal_sections ms JOIN public.meals m ON m.id = ms.meal_id WHERE ms.id = meal_section_recipes.section_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can delete their meal section recipes" ON public.meal_section_recipes FOR DELETE USING (EXISTS (SELECT 1 FROM public.meal_sections ms JOIN public.meals m ON m.id = ms.meal_id WHERE ms.id = meal_section_recipes.section_id AND m.user_id = auth.uid()));

-- Trigger for updated_at on meals
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
