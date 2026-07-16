import { useCallback, useRef, useState, useEffect } from 'react';
import { requestLlmChat } from '../../utils/llmDiagnostic';
import type {
  FlowGraph,
  NodeAnnotation,
  QuestionnaireAnswer,
  ReadinessScore,
} from '../../types/diagnostic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatPanelProps {
  answers: QuestionnaireAnswer;
  currentGraph: FlowGraph;
  currentAnnotations: NodeAnnotation[];
  fallbackReadiness: ReadinessScore[];
  onUpdate: (result: {
    optimizedGraph: FlowGraph;
    annotations: NodeAnnotation[];
    readiness: ReadinessScore[];
  }) => void;
  onReset?: () => void;
}

const QUICK_PROMPTS = [
  '把这个流程再简化一点',
  '增加一个质量把关环节',
  '让更多环节由 AI 自动完成',
  '把编码和测试合并成一个环节',
];

export function ChatPanel({
  answers,
  currentGraph,
  currentAnnotations,
  fallbackReadiness,
  onUpdate,
  onReset,
}: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMessage = text.trim();
      setInput('');
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setLoading(true);

      try {
        const result = await requestLlmChat(
          answers,
          currentGraph,
          currentAnnotations,
          userMessage,
          fallbackReadiness,
        );

        if (result.success && result.data) {
          const data = result.data;
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.reply },
          ]);
          onUpdate({
            optimizedGraph: data.optimizedGraph,
            annotations: data.annotations,
            readiness: data.readiness,
          });
        } else {
          const errorMsg = result.error || '未知错误';
          setError(`AI 暂时无法响应：${errorMsg}`);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `抱歉，AI 暂时无法响应（${errorMsg}），请稍后再试。`,
            },
          ]);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(`对话出错：${errorMsg}`);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `抱歉，对话出错了（${errorMsg}），请稍后再试。` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [answers, currentGraph, currentAnnotations, loading, onUpdate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
      }
    },
    [handleSend, input],
  );

  const handleReset = useCallback(() => {
    setMessages([]);
    setError(null);
    onReset?.();
  }, [onReset]);

  return (
    <>
      <button
        type="button"
        className={`chat-fab ${open ? 'chat-fab-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '💬'}
      </button>

      {open ? (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <p className="chat-panel-title">AI 对话调整</p>
              <p className="chat-panel-subtitle">
                告诉 AI 你想怎么调整这个方案
              </p>
            </div>
            {messages.length > 0 ? (
              <button
                type="button"
                className="chat-reset-btn"
                onClick={handleReset}
              >
                重新开始
              </button>
            ) : null}
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">🤖</div>
                <p className="chat-empty-title">想调整方案？直接告诉我</p>
                <p className="chat-empty-desc">
                  比如"把流程简化一点"、"增加质量把关环节"、"让 AI 做更多事"
                </p>
                <div className="chat-quick-prompts">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="chat-quick-btn"
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble chat-bubble-${msg.role}`}
                >
                  <p className="chat-bubble-text">{msg.content}</p>
                </div>
              ))
            )}
            {loading ? (
              <div className="chat-bubble chat-bubble-assistant">
                <div className="chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {error ? <div className="chat-error">⚠️ {error}</div> : null}

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="说说你想怎么调整…（Enter 发送）"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
            >
              发送
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
