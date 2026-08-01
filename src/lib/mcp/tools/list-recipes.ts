import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_recipes",
  title: "List recipes",
  description:
    "List the signed-in user's recipes with ingredients and instructions. Optionally filter by name search or tag.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Case-insensitive recipe name filter."),
    tag: z.string().trim().min(1).optional().describe("Only recipes carrying this tag."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, tag, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("recipes")
      .select("id,name,description,ingredients,instructions,prep_time,cook_time,servings,tags,is_public")
      .order("name")
      .limit(limit ?? 25);
    if (search) query = query.ilike("name", `%${search}%`);
    if (tag) query = query.contains("tags", [tag]);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { recipes: data ?? [], count: data?.length ?? 0 },
    };
  },
});
