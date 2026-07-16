import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';
import type { FlowGraph, FlowNode } from '../../types/diagnostic';

function getNodeSize(node: FlowNode): { width: number; height: number } {
  if (node.kind === 'ai') {
    return { width: 300, height: 320 };
  }

  return { width: 340, height: 340 };
}

export function layoutFlowGraph(
  graph: FlowGraph,
  buildData: (node: FlowNode) => Record<string, unknown>,
  nodeType: string,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 100,
    ranksep: 180,
    edgesep: 30,
    marginx: 60,
    marginy: 60,
    ranker: 'network-simplex',
    acyclicer: 'greedy',
  });

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
    type: 'smoothstep',
  }));

  return { nodes, edges };
}
