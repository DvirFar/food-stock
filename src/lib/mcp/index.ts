import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import upsertProduct from "./tools/upsert-product";
import listShoppingList from "./tools/list-shopping-list";
import addShoppingListItem from "./tools/add-shopping-list-item";
import listRecipes from "./tools/list-recipes";
import listCalendarEvents from "./tools/list-calendar-events";
import addCalendarEvent from "./tools/add-calendar-event";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "home-stock-manager",
  title: "Home Stock Manager",
  version: "0.1.0",
  instructions:
    "Tools for the Home Stock Manager app (Hebrew household food inventory). Read and update the signed-in user's pantry inventory, shopping list, recipes, and monthly calendar events. Dates are ISO YYYY-MM-DD; event times use HH:MM or HH:MM-HH:MM.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listProducts,
    upsertProduct,
    listShoppingList,
    addShoppingListItem,
    listRecipes,
    listCalendarEvents,
    addCalendarEvent,
  ],
});
