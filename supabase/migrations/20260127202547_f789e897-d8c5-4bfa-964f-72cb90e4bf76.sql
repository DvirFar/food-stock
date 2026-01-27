-- Add CHECK constraints for data validation on products table
ALTER TABLE public.products 
ADD CONSTRAINT products_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
ADD CONSTRAINT products_quantity_positive CHECK (quantity >= 0),
ADD CONSTRAINT products_min_quantity_positive CHECK (min_quantity >= 0),
ADD CONSTRAINT products_unit_length CHECK (char_length(unit) >= 1 AND char_length(unit) <= 50);

-- Add CHECK constraints for shopping_list_items table
ALTER TABLE public.shopping_list_items
ADD CONSTRAINT shopping_items_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
ADD CONSTRAINT shopping_items_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT shopping_items_unit_length CHECK (char_length(unit) >= 1 AND char_length(unit) <= 50);

-- Add CHECK constraints for recipes table
ALTER TABLE public.recipes
ADD CONSTRAINT recipes_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
ADD CONSTRAINT recipes_description_length CHECK (description IS NULL OR char_length(description) <= 2000),
ADD CONSTRAINT recipes_prep_time_positive CHECK (prep_time IS NULL OR prep_time >= 0),
ADD CONSTRAINT recipes_cook_time_positive CHECK (cook_time IS NULL OR cook_time >= 0),
ADD CONSTRAINT recipes_servings_positive CHECK (servings IS NULL OR servings > 0);