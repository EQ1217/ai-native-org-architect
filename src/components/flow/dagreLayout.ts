import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';
import type { FlowGraph, FlowNode } from '../../types/diagnostic';

function getNodeSize(node: FlowNode): { width: number; height: number } {
  if (node.kind === 'ai') {
    return { width: 280, height: 228 };
  }

  return { width: 320, height: 248 };
}

export function layoutFlowGraph(
  graph: FlowGraph,
  buildData: (node: FlowNode) => Record<string, unknown>,
  nodeType: string,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 42, ranksep: 90, marginx: 24, marginy: 24 });

  graph.nodes.forEach((node) => {
    const size = getNodeSize(node);
    g.setNode(node.id, size);
  });
  graph.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const nodes: Node[] = graph.nodes.map((node) => {
    const pos = g.node(node.id);
    const size = getNodeSize(node);
    return {
      id: node.id,
      position: { x: pos.x - size.width / 2, y: pos.y - size.height / 2 },
      data: buildData(node),
      type: nodeType,
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));

  return { nodes, edges };
}
