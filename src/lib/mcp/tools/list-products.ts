import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "List inventory products",
  description:
    "List the signed-in user's food inventory products. Optionally filter by name search, category, location, or only items at or below their minimum quantity.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Case-insensitive product name filter."),
    category: z.string().trim().min(1).optional().describe("Exact category name."),
    location: z.string().trim().min(1).optional().describe("Exact storage location name."),
    lowStockOnly: z.boolean().optional().describe("Only return products at or below their minimum quantity."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, location, lowStockOnly, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("products")
      .select("id,name,category,location,quantity,unit,min_quantity,expiration_date,tags,notes")
      .order("name")
      .limit(limit ?? 50);

    if (search) query = query.ilike("name", `%${search}%`);
    if (category) query = query.eq("category", category);
    if (location) query = query.eq("location", location);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? []).filter(
      (row) => !lowStockOnly || Number(row.quantity) <= Number(row.min_quantity),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { products: rows, count: rows.length },
    };
  },
});
