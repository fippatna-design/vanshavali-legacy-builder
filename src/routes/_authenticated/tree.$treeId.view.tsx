import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  Position,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/tree/$treeId/view")({
  head: () => ({
    meta: [
      { title: "Vanshavali — Tree View" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TreeView,
});

type Member = {
  id: string;
  full_name: string;
  gender: "male" | "female" | "other" | null;
  is_alive: boolean;
  is_root: boolean;
  generation: number | null;
};
type PC = { parent_id: string; child_id: string; relationship_type: string };
type Marriage = { spouse_a_id: string; spouse_b_id: string };

const NODE_W = 200;
const NODE_H = 82;

function layout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 90 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => {
    // only use parent-child edges for hierarchy
    if (e.data?.kind === "parent") g.setEdge(e.source, e.target);
  });
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}

function nodeStyle(m: Member): React.CSSProperties {
  let bg = "hsl(var(--card))";
  let border = "hsl(var(--border))";
  if (m.is_root) {
    bg = "hsl(45 70% 90%)";
    border = "hsl(38 65% 45%)";
  } else if (m.gender === "male") {
    bg = "hsl(212 80% 94%)";
    border = "hsl(212 60% 55%)";
  } else if (m.gender === "female") {
    bg = "hsl(340 75% 94%)";
    border = "hsl(340 60% 60%)";
  }
  if (!m.is_alive) {
    bg = "hsl(0 0% 92%)";
    border = "hsl(0 0% 60%)";
  }
  return {
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: 10,
    padding: "8px 12px",
    width: NODE_W,
    minHeight: NODE_H,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  };
}

function TreeView() {
  const { treeId } = Route.useParams();

  const treeQ = useQuery({
    queryKey: ["family_tree", treeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_trees")
        .select("id, name")
        .eq("id", treeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const membersQ = useQuery({
    queryKey: ["family_members", treeId],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, full_name, gender, is_alive, is_root, generation")
        .eq("tree_id", treeId);
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const pcQ = useQuery({
    queryKey: ["pc", treeId],
    queryFn: async (): Promise<PC[]> => {
      const { data, error } = await supabase
        .from("parent_child_relationships")
        .select("parent_id, child_id, relationship_type")
        .eq("tree_id", treeId);
      if (error) throw error;
      return (data ?? []) as PC[];
    },
  });

  const marriagesQ = useQuery({
    queryKey: ["marriages", treeId],
    queryFn: async (): Promise<Marriage[]> => {
      const { data, error } = await supabase
        .from("marriages")
        .select("spouse_a_id, spouse_b_id")
        .eq("tree_id", treeId);
      if (error) throw error;
      return (data ?? []) as Marriage[];
    },
  });

  const { nodes, edges } = useMemo(() => {
    const members = membersQ.data ?? [];
    const pcs = pcQ.data ?? [];
    const marriages = marriagesQ.data ?? [];

    const rawNodes: Node[] = members.map((m) => ({
      id: m.id,
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div>
            <div style={{ fontWeight: 600 }}>{m.full_name}</div>
            <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase" }}>
              {m.is_root ? "Root · " : ""}
              {m.gender ?? "—"}
              {typeof m.generation === "number" ? ` · G${m.generation}` : ""}
              {!m.is_alive ? " · †" : ""}
            </div>
          </div>
        ),
      },
      style: nodeStyle(m),
    }));

    const rawEdges: Edge[] = [
      ...pcs.map((p, i) => ({
        id: `pc-${i}`,
        source: p.parent_id,
        target: p.child_id,
        type: "smoothstep",
        style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5 },
        data: { kind: "parent" },
      })),
      ...marriages.map((m, i) => ({
        id: `m-${i}`,
        source: m.spouse_a_id,
        target: m.spouse_b_id,
        type: "straight",
        animated: false,
        style: { stroke: "hsl(340 60% 55%)", strokeWidth: 2, strokeDasharray: "4 4" },
        data: { kind: "spouse" },
        label: "⚭",
      })),
    ];

    return { nodes: layout(rawNodes, rawEdges), edges: rawEdges };
  }, [membersQ.data, pcQ.data, marriagesQ.data]);

  return (
    <div className="flex h-screen flex-col bg-parchment-gradient">
      <header className="border-b border-border/60 bg-parchment/85 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            to="/tree/$treeId"
            params={{ treeId }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Members
          </Link>
          <div className="font-heading text-lg text-primary">
            {treeQ.data?.name ?? "Vanshavali"} — Tree
          </div>
          <div className="text-xs text-muted-foreground">
            {(membersQ.data ?? []).length} members
          </div>
        </div>
      </header>

      <div className="relative flex-1">
        {(membersQ.data ?? []).length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No members yet. Add members first, then link parents & spouses.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} color="hsl(var(--border))" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable style={{ background: "hsl(var(--card))" }} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
