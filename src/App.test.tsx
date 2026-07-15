import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// react-flow 在 jsdom 下会卡死，测试里用轻量 mock 替换流程图组件。
vi.mock('./components/flow/FlowEditor', () => ({
  FlowEditor: (props: {
    graph: { nodes: { id: string; label: string }[] };
    onCoreChange: (id: string) => void;
    onGraphChange: (graph: unknown) => void;
  }) => (
    <div data-testid="flow-editor-mock">
      {props.graph.nodes.map((node) => (
        <button
          type="button"
          key={node.id}
          className="stage-node"
          onClick={() => {
            props.onCoreChange(node.id);
            props.onGraphChange(props.graph);
          }}
        >
          {node.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./components/flow/FlowDiagram', () => ({
  FlowDiagram: (props: { graph: { nodes: { id: string; label: string }[] } }) => (
    <div data-testid="flow-diagram-mock">
      {props.graph.nodes.map((node) => (
        <div key={node.id} className="stage-node">
          {node.label}
        </div>
      ))}
    </div>
  ),
}));

import App from './App';

describe('App', () => {
  it('runs the full flow: landing -> questionnaire -> insight -> upload -> report', async () => {
    const { container } = render(<App />);

    // landing
    expect(screen.getByRole('heading', { name: /让 AI/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /开始诊断/ }));

    // step 1: industry + team + size
    expect(screen.getByRole('heading', { name: '选择行业与团队' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /内容营销/ }));
    fireEvent.click(screen.getByRole('button', { name: '新媒体增长团队' }));
    fireEvent.click(screen.getByRole('button', { name: /1-10 人/ }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    // step 2: flow editor (mocked) - click a node to set core
    expect(screen.getByRole('heading', { name: '梳理业务流图' })).toBeInTheDocument();
    const stageNodes = container.querySelectorAll('.stage-node');
    expect(stageNodes.length).toBeGreaterThan(0);
    fireEvent.click(stageNodes[1]);
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    // step 3: ai usage -> generate
    expect(screen.getByRole('heading', { name: '确认 AI 使用现状' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /生成初步洞察/ }));

    // insight
    expect(screen.getByRole('heading', { name: '初步洞察' })).toBeInTheDocument();

    // upload: pick data type then file
    fireEvent.click(screen.getByRole('button', { name: '内容生产明细' }));
    const file = new File(['team data'], 'team.csv', { type: 'text/csv' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // report
    await screen.findByRole(
      'heading',
      { name: '深度组织改造方案' },
      { timeout: 3000 },
    );
    expect(screen.getByRole('heading', { name: '当前状态评估' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '从现在的工作方式，到 AI 参与后的新工作方式' })).toBeInTheDocument();
  });
});
