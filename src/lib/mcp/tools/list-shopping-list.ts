import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_shopping_list",
  title: "List shopping list items",
  description: "List the signed-in user's shopping list items, optionally only the unchecked ones.",
  inputSchema: {
    uncheckedOnly: z.boolean().optional().describe("Only return items that are not yet checked off."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ uncheckedOnly }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("shopping_list_items")
      .select("id,name,quantity,unit,category,checked,added_at")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (uncheckedOnly) query = query.eq("checked", false);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { items: data ?? [], count: data?.length ?? 0 },
    };
  },
});
