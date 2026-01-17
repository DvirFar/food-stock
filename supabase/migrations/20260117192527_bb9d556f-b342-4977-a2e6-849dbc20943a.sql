-- Create a public view for recipes that hides user_id for non-owners
CREATE VIEW public.recipes_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    name,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    servings,
    tags,
    is_public,
    image_url,
    created_at,
    updated_at,
    -- Only show user_id if the current user is the owner
    CASE 
      WHEN auth.uid() = user_id THEN user_id 
      ELSE NULL 
    END as user_id
  FROM public.recipes;

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view public recipes or their own" ON public.recipes;

-- Create a restrictive SELECT policy on base table - only allow access via the view
-- Users can only select if they are the owner OR the recipe is public
CREATE POLICY "Users can view public recipes or their own"
ON public.recipes
FOR SELECT
USING ((is_public = true) OR (auth.uid() = user_id));