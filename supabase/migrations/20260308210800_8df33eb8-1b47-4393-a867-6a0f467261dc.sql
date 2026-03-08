
CREATE TABLE public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product tags" ON public.product_tags FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own product tags" ON public.product_tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own product tags" ON public.product_tags FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own product tags" ON public.product_tags FOR DELETE TO authenticated USING (auth.uid() = user_id);
