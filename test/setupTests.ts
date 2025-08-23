// テスト環境のセットアップ
import '@testing-library/jest-dom';

// モックデータの設定
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Reactのモック
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn((initialValue) => {
    const [value, setValue] = jest.requireActual('react').useState(initialValue);
    return [value, setValue];
  }),
  useEffect: jest.fn((effect, deps) => {
    return jest.requireActual('react').useEffect(effect, deps);
  }),
  useMemo: jest.fn((factory, deps) => {
    return jest.requireActual('react').useMemo(factory, deps);
  })
}));

// コンソールエラーの抑制（テスト中の警告を減らす）
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});