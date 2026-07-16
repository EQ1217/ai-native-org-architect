import { useCallback, useEffect, useMemo, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  type ReactFlowInstance,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { InsertEdge } from './InsertEdge';
import { StageNode } from './StageNode';
import { layoutFlowGraph } from './dagreLayout';
import type { FlowGraph } from '../../types/diagnostic';

interface FlowEditorProps {
  graph: FlowGraph;
  coreNodeId: string;
  onGraphChange: (graph: FlowGraph) => void;
  onCoreChange: (nodeId: string) => void;
}

const nodeTypes = { stage: StageNode };
const edgeTypes = { insertable: InsertEdge };

function buildEditableEdge(edge: Pick<Edge, 'id' | 'source' | 'target'>, onInsert: (edgeId: string) => void): Edge {
  return {
    ...edge,
    type: 'insertable',
    data: { onInsert },
  };
}

function toFlowGraph(nodes: Node[], edges: Edge[]): FlowGraph {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: (node.data as { label: string }).label,
      input: (node.data as { input?: string }).input ?? '',
      output: (node.data as { output?: string }).output ?? '',
      kind: 'stage',
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

let idSeed = 0;
function nextId(): string {
  idSeed += 1;
  return `node-new-${idSeed}`;
}

export function FlowEditor({
  graph,
  coreNodeId,
  onGraphChange,
  onCoreChange,
}: FlowEditorProps) {
  const removeNodeRef = useRef<(nodeId: string) => void>(() => undefined);
  const insertNodeRef = useRef<(edgeId: string) => void>(() => undefined);
  const reactFlowRef = useRef<ReactFlowInstance<Node, Edge> | null>(null);
  const buildEditorData = useCallback(
    (node: FlowGraph['nodes'][number], activeCoreNodeId: string) => ({
      label: node.label,
      input: node.input ?? '',
      output: node.output ?? '',
      editable: true,
      isCore: node.id === activeCoreNodeId,
      isAi: false,
      onRemove: (nodeId: string) => removeNodeRef.current(nodeId),
    }),
    [],
  );
  const initial = useMemo<{ nodes: Node[]; edges: Edge[] }>(
    () => {
        const layout = layoutFlowGraph(
          graph,
          (node) => buildEditorData(node, coreNodeId),
          'stage',
        );

        return layout;
      },
    // 仅初始化一次，避免编辑中被重置
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const lastGraphSignatureRef = useRef(JSON.stringify(toFlowGraph(initial.nodes, initial.edges)));
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initial.edges.map((edge) =>
      buildEditableEdge(edge, (edgeId) => insertNodeRef.current(edgeId)),
    ),
  );

  const relayoutGraph = useCallback(
    (nextGraph: FlowGraph, activeCoreNodeId: string) => {
      const layout = layoutFlowGraph(
        nextGraph,
        (node) => buildEditorData(node, activeCoreNodeId),
        'stage',
      );

      setNodes(layout.nodes);
      setEdges(
        layout.edges.map((edge) =>
          buildEditableEdge(edge, (edgeId) => insertNodeRef.current(edgeId)),
        ),
      );
    },
    [buildEditorData, setNodes, setEdges],
  );

  const handleInsertNode = useCallback(
    (edgeId: string) => {
      const currentGraph = toFlowGraph(nodes, edges);
      const currentEdge = currentGraph.edges.find((edge) => edge.id === edgeId);
      if (!currentEdge) {
        return;
      }

      const id = nextId();
      const newNode = {
        id,
        label: '新环节',
        input: '',
        output: '',
        kind: 'stage' as const,
      };

      relayoutGraph(
        {
          nodes: [...currentGraph.nodes, newNode],
          edges: currentGraph.edges
            .filter((edge) => edge.id !== edgeId)
            .concat([
              { id: nextId(), source: currentEdge.source, target: id },
              { id: nextId(), source: id, target: currentEdge.target },
            ]),
        },
        coreNodeId,
      );
    },
    [nodes, edges, relayoutGraph, coreNodeId],
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      const currentGraph = toFlowGraph(nodes, edges);
      const remainingNodes = currentGraph.nodes.filter((node) => node.id !== nodeId);
      const incomingEdges = currentGraph.edges.filter((edge) => edge.target === nodeId);
      const outgoingEdges = currentGraph.edges.filter((edge) => edge.source === nodeId);
      const remainingEdges = currentGraph.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      );

      const bridgedEdges = incomingEdges.flatMap((incoming) =>
        outgoingEdges
          .filter((outgoing) => incoming.source !== outgoing.target)
          .map((outgoing) =>
            buildEditableEdge(
              {
                id: nextId(),
                source: incoming.source,
                target: outgoing.target,
              },
              (edgeId) => insertNodeRef.current(edgeId),
            ),
          ),
      );

      const uniqueEdges = [...remainingEdges, ...bridgedEdges].filter(
        (edge, index, collection) =>
          collection.findIndex(
            (candidate) =>
              candidate.source === edge.source && candidate.target === edge.target,
          ) === index,
      );

      const nextCoreNodeId = coreNodeId === nodeId ? remainingNodes[0]?.id ?? '' : coreNodeId;

      relayoutGraph(
        {
          nodes: remainingNodes,
          edges: uniqueEdges,
        },
        nextCoreNodeId,
      );
      onCoreChange(nextCoreNodeId);
    },
    [nodes, edges, coreNodeId, relayoutGraph, onCoreChange],
  );

  useEffect(() => {
    removeNodeRef.current = removeNode;
    insertNodeRef.current = handleInsertNode;
  }, [removeNode, handleInsertNode]);

  useEffect(() => {
    const currentGraph = toFlowGraph(nodes, edges);
    const externalSignature = JSON.stringify(graph);
    const currentSignature = JSON.stringify(currentGraph);
    if (externalSignature !== currentSignature) {
      relayoutGraph(graph, coreNodeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  useEffect(() => {
    const nextGraph = toFlowGraph(nodes, edges);
    const signature = JSON.stringify(nextGraph);
    if (signature === lastGraphSignatureRef.current) {
      return;
    }
    lastGraphSignatureRef.current = signature;
    onGraphChange(nextGraph);
  }, [nodes, edges, onGraphChange]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      setEdges((currentEdges) =>
        addEdge(
          buildEditableEdge(
            { ...connection, id: nextId() },
            (edgeId) => insertNodeRef.current(edgeId),
          ),
          currentEdges,
        ).filter(
          (edge, index, collection) =>
            collection.findIndex(
              (candidate) =>
                candidate.source === edge.source && candidate.target === edge.target,
            ) === index,
        ),
      );
    },
    [setEdges],
  );

  const onPaneContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
      event.preventDefault();

      const flowPosition = reactFlowRef.current?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!flowPosition) {
        return;
      }

      const id = nextId();
      const newNode: Node = {
        id,
        position: flowPosition,
        data: {
          label: '新环节',
          input: '',
          output: '',
          editable: true,
          isCore: false,
          isAi: false,
          onRemove: (nodeId: string) => removeNodeRef.current(nodeId),
        },
        type: 'stage',
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [setNodes],
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, isCore: n.id === node.id } })),
      );
      onCoreChange(node.id);
    },
    [setNodes, onCoreChange],
  );

  return (
    <div className="flow-editor">
      <div className="flow-editor-toolbar">
        <span className="flow-editor-tip">
          点节点设为核心 · 点连线中间的 + 在两环节之间插入 · 在画布空白处右键可新建独立节点 · 从节点右侧金色圆点拖到别的节点左侧圆点即可分流开岔
        </span>
      </div>
      <div className="flow-canvas">
        <ReactFlow
          onInit={(instance) => {
            reactFlowRef.current = instance;
          }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneContextMenu={onPaneContextMenu}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          nodesDraggable
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
