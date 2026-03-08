
CREATE OR REPLACE FUNCTION public.validate_recipe_tags()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tags IS NOT NULL THEN
    IF array_length(NEW.tags, 1) > 20 THEN
      RAISE EXCEPTION 'Too many tags (max 20)';
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.tags) AS tag
      WHERE length(tag) > 50 OR tag ~ '[<>"\\]'
    ) THEN
      RAISE EXCEPTION 'Invalid tag: must be <= 50 chars and not contain <, >, ", or backslash';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_recipe_tags_trigger
BEFORE INSERT OR UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.validate_recipe_tags();
