
CREATE TABLE public.monthly_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  time_display TEXT DEFAULT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON public.monthly_calendar_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
  ON public.monthly_calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.monthly_calendar_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.monthly_calendar_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Migrate existing notes to events
INSERT INTO public.monthly_calendar_events (user_id, date, description, sort_order)
SELECT user_id, date::date, content, 0
FROM public.monthly_calendar_notes
WHERE content IS NOT NULL AND content != '';
