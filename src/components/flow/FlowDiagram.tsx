import { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import { StageNode } from './StageNode';
import { layoutFlowGraph } from './dagreLayout';
import type { FlowGraph, NodeAnnotation } from '../../types/diagnostic';

interface FlowDiagramProps {
  graph: FlowGraph;
  annotations: NodeAnnotation[];
  coreNodeId: string;
}

const nodeTypes = { stage: StageNode };

export function FlowDiagram({ graph, annotations, coreNodeId }: FlowDiagramProps) {
  const annotationMap = useMemo(
    () => new Map(annotations.map((item) => [item.nodeId, item])),
    [annotations],
  );

  const { nodes, edges } = useMemo(
    () =>
      layoutFlowGraph(
        graph,
        (node) => ({
          label: node.label,
          input: node.input ?? '',
          output: node.output ?? '',
          annotation: annotationMap.get(node.id),
          isCore: node.id === coreNodeId,
          isAi: node.kind === 'ai',
        }),
        'stage',
      ),
    [graph, annotationMap, coreNodeId],
  );

  return (
    <div className="flow-canvas flow-canvas-readonly">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
