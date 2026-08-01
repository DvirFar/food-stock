import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "upsert_product",
  title: "Create or update a product",
  description:
    "Create a new inventory product, or update an existing one when productId is given. Only the provided fields are changed.",
  inputSchema: {
    productId: z.string().uuid().optional().describe("Existing product id. Omit to create a new product."),
    name: z.string().trim().min(1).optional().describe("Product name (required when creating)."),
    category: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),
    quantity: z.number().min(0).optional(),
    unit: z.string().trim().min(1).optional(),
    minQuantity: z.number().min(0).optional(),
    expirationDate: z.string().trim().min(1).nullable().optional().describe("ISO date (YYYY-MM-DD) or null to clear."),
    notes: z.string().nullable().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const fields: Record<string, unknown> = {};
    if (input.name !== undefined) fields.name = input.name;
    if (input.category !== undefined) fields.category = input.category;
    if (input.location !== undefined) fields.location = input.location;
    if (input.quantity !== undefined) fields.quantity = input.quantity;
    if (input.unit !== undefined) fields.unit = input.unit;
    if (input.minQuantity !== undefined) fields.min_quantity = input.minQuantity;
    if (input.expirationDate !== undefined) fields.expiration_date = input.expirationDate;
    if (input.notes !== undefined) fields.notes = input.notes;
    if (input.tags !== undefined) fields.tags = input.tags;

    if (input.productId) {
      if (Object.keys(fields).length === 0) {
        return { content: [{ type: "text", text: "No fields to update" }], isError: true };
      }
      const { data, error } = await supabase
        .from("products")
        .update(fields)
        .eq("id", input.productId)
        .select()
        .maybeSingle();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      if (!data) return { content: [{ type: "text", text: "Product not found" }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { product: data } };
    }

    if (!input.name) {
      return { content: [{ type: "text", text: "name is required when creating a product" }], isError: true };
    }

    const { data, error } = await supabase
      .from("products")
      .insert({ ...fields, name: input.name, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { product: data } };
  },
});
