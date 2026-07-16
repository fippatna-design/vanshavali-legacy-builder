import { auth, defineMcp } from "@lovable.dev/mcp-js";

import addMemberTool from "./tools/add-member";
import listMembersTool from "./tools/list-members";
import listTreesTool from "./tools/list-trees";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vanshavali-mcp",
  title: "Vanshavali",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in user's Vanshavali digital family trees. Use `list_family_trees` to discover trees, `list_family_members` to read a tree, and `add_family_member` to append a new person.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTreesTool, listMembersTool, addMemberTool],
});
