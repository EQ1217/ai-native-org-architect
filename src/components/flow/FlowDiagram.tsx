import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { StageNode } from './StageNode';
import { layoutFlowGraph } from './dagreLayout';
import type { FlowGraph, NodeAnnotation } from '../../types/diagnostic';

interface FlowDiagramProps {
  graph: FlowGraph;
  annotations: NodeAnnotation[];
  coreNodeId: string;
  draggable?: boolean;
}

const nodeTypes = { stage: StageNode };

function FlowDiagramInner({
  graph,
  annotations,
  coreNodeId,
  draggable = false,
}: FlowDiagramProps) {
  const { fitView } = useReactFlow();
  const [modified, setModified] = useState(false);

  const annotationMap = useMemo(
    () => new Map(annotations.map((item) => [item.nodeId, item])),
    [annotations],
  );

  const layoutResult = useMemo(
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
          changeType: node.changeType,
          changeNote: node.changeNote,
        }),
        'stage',
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph],
  );

  const [nodes, setNodes] = useState(layoutResult.nodes);
  const edges = layoutResult.edges;

  useEffect(() => {
    setNodes(layoutResult.nodes);
    setModified(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const handleNodeDragStop = useCallback(() => {
    setModified(true);
  }, []);

  const handleResetLayout = useCallback(() => {
    setNodes(layoutResult.nodes);
    setModified(false);
    setTimeout(() => fitView({ padding: 0.25 }), 50);
  }, [layoutResult.nodes, fitView]);

  return (
    <div className="flow-canvas flow-canvas-readonly">
      <div className="flow-canvas-top-bar">
        <div className="flow-canvas-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 9l-3 3 3 3" />
            <path d="M9 5l3-3 3 3" />
            <path d="M15 19l-3 3-3-3" />
            <path d="M19 9l3 3-3 3" />
          </svg>
          {draggable ? '拖动节点调整位置 · 滚轮缩放' : '拖拽平移 · 滚轮缩放'}
        </div>
        {draggable && modified ? (
          <button
            type="button"
            className="flow-reset-button"
            onClick={handleResetLayout}
          >
            ↺ 重置布局
          </button>
        ) : null}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable={draggable}
        nodesConnectable={false}
        elementsSelectable={draggable}
        zoomOnScroll
        panOnDrag={!draggable}
        selectionOnDrag={false}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeDragStop={handleNodeDragStop}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function FlowDiagram(props: FlowDiagramProps) {
  return (
    <ReactFlowProvider>
      <FlowDiagramInner {...props} />
    </ReactFlowProvider>
  );
}
