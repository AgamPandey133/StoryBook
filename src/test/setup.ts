import '@testing-library/jest-dom';

// Polyfill ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

const globalObj = typeof globalThis !== 'undefined' ? globalThis :
    typeof global !== 'undefined' ? global :
        typeof window !== 'undefined' ? window : {};

(globalObj as any).ResizeObserver = ResizeObserver;

if (typeof window !== 'undefined') {
    window.ResizeObserver = ResizeObserver;
    // Helper to avoid writing if read-only
    try {
        window.scrollTo = () => { };
    } catch (e) { }

    // Mock layout
    const mockLayout = (prop: string, val: number) => {
        Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: val });
    };
    mockLayout('clientHeight', 500);
    mockLayout('scrollHeight', 1000);
    mockLayout('offsetHeight', 500);
    mockLayout('offsetWidth', 500);
}
