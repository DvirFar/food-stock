import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_calendar_events",
  title: "List calendar events",
  description: "List the signed-in user's monthly calendar events within a date range (inclusive).",
  inputSchema: {
    from: z.string().trim().min(1).describe("Start date, ISO YYYY-MM-DD."),
    to: z.string().trim().min(1).describe("End date, ISO YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("monthly_calendar_events")
      .select("id,date,description,time_display,sort_order")
      .gte("date", from)
      .lte("date", to)
      .order("date")
      .order("sort_order");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [], count: data?.length ?? 0 },
    };
  },
});
