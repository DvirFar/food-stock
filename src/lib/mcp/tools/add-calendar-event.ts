import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_calendar_event",
  title: "Add a calendar event",
  description: "Add an event or task to a specific day in the signed-in user's monthly calendar.",
  inputSchema: {
    date: z.string().trim().min(1).describe("Event date, ISO YYYY-MM-DD."),
    description: z.string().trim().min(1).describe("What the event is."),
    timeDisplay: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}(-\d{2}:\d{2})?$/)
      .optional()
      .describe("Optional time as HH:MM or HH:MM-HH:MM."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ date, description, timeDisplay }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { count } = await supabase
      .from("monthly_calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("date", date);

    const { data, error } = await supabase
      .from("monthly_calendar_events")
      .insert({
        user_id: ctx.getUserId(),
        date,
        description,
        sort_order: count ?? 0,
        ...(timeDisplay ? { time_display: timeDisplay } : {}),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { event: data } };
  },
});
