
-- Step 1: Update products to use the label from categories instead of name
UPDATE products p
SET category = c.label
FROM categories c
WHERE p.category = c.name AND p.user_id = c.user_id AND c.name != c.label;

-- Step 2: Update products to use the label from locations instead of name
UPDATE products p
SET location = l.label
FROM locations l
WHERE p.location = l.name AND p.user_id = l.user_id AND l.name != l.label;

-- Step 3: Update shopping_list_items to use the label from categories instead of name
UPDATE shopping_list_items s
SET category = c.label
FROM categories c
WHERE s.category = c.name AND s.user_id = c.user_id AND c.name != c.label;

-- Step 4: Update categories to set name = label
UPDATE categories SET name = label WHERE name != label;

-- Step 5: Update locations to set name = label
UPDATE locations SET name = label WHERE name != label;
