import '@testing-library/jest-dom';

// jsdom 未实现 scrollIntoView，测试环境补一个空实现。
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// react-flow 依赖 ResizeObserver，jsdom 未实现，补空实现。
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!(window as unknown as { ResizeObserver?: unknown }).ResizeObserver) {
  (window as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
    ResizeObserverMock;
}
