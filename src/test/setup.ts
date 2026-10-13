import "@testing-library/jest-dom";

// Radix UI (Select / DropdownMenu) relies on these browser APIs to position and
// open its popovers. jsdom does not implement them, so the controls cannot be
// opened in tests without these polyfills.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
}

if (typeof globalThis.DOMRect === "undefined") {
  (globalThis as unknown as { DOMRect: unknown }).DOMRect = class DOMRect {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    top = 0;
    right = 0;
    bottom = 0;
    left = 0;
  };
}

if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
}
