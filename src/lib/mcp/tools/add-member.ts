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
  name: "add_family_member",
  title: "Add family member",
  description:
    "Add a new family member to a Vanshavali family tree. The signed-in user must own or have editor access to the tree.",
  inputSchema: {
    tree_id: z.string().uuid().describe("The UUID of the family tree."),
    full_name: z.string().min(1).describe("Full name of the family member."),
    gender: z.enum(["male", "female", "other"]).describe("Gender."),
    is_alive: z.boolean().describe("Whether the person is currently alive."),
    generation: z
      .number()
      .int()
      .describe("Generation number (1 = root/founder, 2 = children, etc.)."),
    date_of_birth: z
      .string()
      .describe("Date of birth in YYYY-MM-DD, or empty string if unknown."),
    birth_place: z.string().describe("Birth place, or empty string if unknown."),
    occupation: z.string().describe("Occupation, or empty string if unknown."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("family_members")
      .insert({
        tree_id: input.tree_id,
        full_name: input.full_name,
        gender: input.gender,
        is_alive: input.is_alive,
        generation: input.generation,
        date_of_birth: input.date_of_birth || null,
        birth_place: input.birth_place || null,
        occupation: input.occupation || null,
        created_by: ctx.getUserId(),
      })
      .select()
      .single();

    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [
        { type: "text", text: `Added member ${data.full_name} (id: ${data.id})` },
      ],
      structuredContent: { member: data },
    };
  },
});
