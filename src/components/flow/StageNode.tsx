import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { MECHANISM_LABELS } from '../../utils/mechanismLabels';
import type { NodeAnnotation, NodeChangeType } from '../../types/diagnostic';

export interface StageNodeData {
  label: string;
  input?: string;
  output?: string;
  annotation?: NodeAnnotation;
  isCore?: boolean;
  editable?: boolean;
  isAi?: boolean;
  changeType?: NodeChangeType;
  changeNote?: string;
  onRemove?: (nodeId: string) => void;
}

const CHANGE_TYPE_META: Record<NodeChangeType, { label: string; className: string }> = {
  added: { label: '新增', className: 'change-type-added' },
  modified: { label: '改造', className: 'change-type-modified' },
  merged: { label: '合并', className: 'change-type-merged' },
  same: { label: '保留', className: 'change-type-same' },
};

export function StageNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as StageNodeData;
  const { setNodes } = useReactFlow();
  const updateNodeData = (patch: Partial<StageNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)),
    );
  };

  const changeMeta = nodeData.changeType ? CHANGE_TYPE_META[nodeData.changeType] : null;

  return (
    <div
      className={`stage-node${nodeData.isCore ? ' stage-node-core' : ''}${selected ? ' stage-node-selected' : ''}${nodeData.isAi ? ' stage-node-ai' : ''}${changeMeta ? ` stage-node-${changeMeta.className}` : ''}`}
    >
      <Handle type="target" position={Position.Left} className="stage-handle" />

      {nodeData.editable ? (
        <>
          <div className="stage-node-header stage-node-drag-handle">
            <button
              type="button"
              className="stage-node-remove nodrag"
              aria-label="删除当前环节"
              onClick={(event) => {
                event.stopPropagation();
                nodeData.onRemove?.(id);
              }}
            >
              ×
            </button>
            <input
              className="stage-node-input nodrag"
              value={nodeData.label}
              onChange={(event) => updateNodeData({ label: event.target.value })}
              placeholder="环节名"
            />
          </div>
          <div className="stage-node-io-grid">
            <label className="stage-node-io-field">
              <span>输入</span>
              <textarea
                className="stage-node-textarea nodrag"
                value={nodeData.input ?? ''}
                onChange={(event) => updateNodeData({ input: event.target.value })}
                placeholder="上游信息 / 素材"
                rows={2}
              />
            </label>
            <label className="stage-node-io-field">
              <span>输出</span>
              <textarea
                className="stage-node-textarea nodrag"
                value={nodeData.output ?? ''}
                onChange={(event) => updateNodeData({ output: event.target.value })}
                placeholder="交付物 / 结果"
                rows={2}
              />
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="stage-node-header">
            <div className="stage-node-label">{nodeData.label}</div>
            {changeMeta ? (
              <span className={`change-type-tag ${changeMeta.className}`}>
                {changeMeta.label}
              </span>
            ) : null}
          </div>
          {nodeData.input || nodeData.output ? (
            <div className="stage-node-io-readonly">
              {nodeData.input ? (
                <div className="stage-node-io-pill">
                  <span>输入</span>
                  <p>{nodeData.input}</p>
                </div>
              ) : null}
              {nodeData.output ? (
                <div className="stage-node-io-pill">
                  <span>输出</span>
                  <p>{nodeData.output}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {nodeData.annotation ? (
        <div className="stage-node-annotation">
          <div className="stage-node-annotation-header">
            {nodeData.annotation.mechanism.length > 0 ? (
              <div className="stage-node-mechanism">
                {nodeData.annotation.mechanism.map((item) => (
                  <span key={item} className="stage-mech-tag">
                    {MECHANISM_LABELS[item] ?? item}
                  </span>
                ))}
              </div>
            ) : null}
            {nodeData.annotation.isAiEnhanced ? (
              <span className="ai-enhanced-badge">
                <span className="ai-badge-dot" />
                AI 增强
              </span>
            ) : null}
          </div>
          {nodeData.annotation.ownership ? (
            <p className="stage-node-ownership">
              {nodeData.annotation.ownership === 'ai'
                ? 'AI 直接承接'
                : nodeData.annotation.ownership === 'hybrid'
                  ? '人机协同'
                  : '人工主导'}
            </p>
          ) : null}
          <p className="stage-node-replace">
            {nodeData.annotation.changeSummary ?? nodeData.annotation.replaceAction}
          </p>
          {nodeData.annotation.capabilitySummary ? (
            <p className="stage-node-capability">{nodeData.annotation.capabilitySummary}</p>
          ) : null}
          <p className="stage-node-case">{nodeData.annotation.caseRef}</p>
        </div>
      ) : null}

      <Handle type="source" position={Position.Right} className="stage-handle" />
    </div>
  );
}
