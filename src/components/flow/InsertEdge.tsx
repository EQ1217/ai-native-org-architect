import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react';

interface InsertEdgeData {
  onInsert?: (edgeId: string) => void;
}

export function InsertEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const edgeData = (data ?? {}) as InsertEdgeData;

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
          type="button"
          className="insert-edge-button nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onClick={(event) => {
            event.stopPropagation();
            edgeData.onInsert?.(id);
          }}
          aria-label="在两个环节之间新增环节"
        >
          +
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
