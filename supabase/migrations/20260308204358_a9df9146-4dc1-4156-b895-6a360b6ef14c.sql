
CREATE TABLE public.monthly_calendar_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.monthly_calendar_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar notes"
  ON public.monthly_calendar_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar notes"
  ON public.monthly_calendar_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar notes"
  ON public.monthly_calendar_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar notes"
  ON public.monthly_calendar_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
