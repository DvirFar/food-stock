import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_shopping_list_item",
  title: "Add a shopping list item",
  description: "Add an item to the signed-in user's shopping list.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Item name."),
    quantity: z.number().min(0).optional().describe("Quantity to buy (default 1)."),
    unit: z.string().trim().min(1).optional().describe("Unit, e.g. יח׳, ק\"ג."),
    category: z.string().trim().min(1).optional().describe("Category used for grouping and sorting."),
    productId: z.string().uuid().optional().describe("Link to an existing inventory product."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, quantity, unit, category, productId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("shopping_list_items")
      .insert({
        user_id: ctx.getUserId(),
        name,
        quantity: quantity ?? 1,
        ...(unit ? { unit } : {}),
        ...(category ? { category } : {}),
        ...(productId ? { product_id: productId } : {}),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { item: data } };
  },
});
