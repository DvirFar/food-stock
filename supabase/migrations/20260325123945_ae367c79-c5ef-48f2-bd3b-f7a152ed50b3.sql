
-- Trigger to auto-manage 'low-stock' tag on products
CREATE OR REPLACE FUNCTION public.manage_low_stock_tag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.quantity < NEW.min_quantity THEN
    IF NOT ('low-stock' = ANY(COALESCE(NEW.tags, '{}'))) THEN
      NEW.tags := array_append(COALESCE(NEW.tags, '{}'), 'low-stock');
    END IF;
  ELSE
    NEW.tags := array_remove(COALESCE(NEW.tags, '{}'), 'low-stock');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_low_stock_tag_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_low_stock_tag();

-- Update existing products
UPDATE products SET tags = array_append(COALESCE(tags, '{}'), 'low-stock')
WHERE quantity < min_quantity AND NOT ('low-stock' = ANY(COALESCE(tags, '{}')));

UPDATE products SET tags = array_remove(COALESCE(tags, '{}'), 'low-stock')
WHERE quantity >= min_quantity AND 'low-stock' = ANY(COALESCE(tags, '{}'));
