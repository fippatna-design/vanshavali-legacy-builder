import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_family_members",
  title: "List family members",
  description:
    "List all family members in a specific Vanshavali family tree the signed-in user can view.",
  inputSchema: {
    tree_id: z.string().uuid().describe("The UUID of the family tree."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tree_id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("family_members")
      .select(
        "id, full_name, gender, is_alive, is_root, generation, date_of_birth, birth_place, current_place, occupation",
      )
      .eq("tree_id", tree_id)
      .order("generation", { ascending: true, nullsFirst: true });

    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { members: data ?? [] },
    };
  },
});
