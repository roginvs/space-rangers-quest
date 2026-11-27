import * as React from "react";

function hasIntersectionObserver(): boolean {
  return "IntersectionObserver" in window;
}

function findScrollParent(el: Element): Element | null {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function isNearRoot(el: Element, root: Element | null, marginPx: number): boolean {
  const rect = el.getBoundingClientRect();
  if (root) {
    const rootRect = root.getBoundingClientRect();
    return rect.top <= rootRect.bottom + marginPx;
  }
  return rect.top <= window.innerHeight + marginPx;
}

/**
 * Fires onNearBottom when the sentinel approaches the bottom of its scroll
 * container (viewport if the page itself scrolls). If IntersectionObserver
 * is missing, renders children as a manual fallback (e.g. a "load more" button).
 */
export class NearBottomSentinel extends React.Component<{
  enabled: boolean;
  onNearBottom: () => void;
  rootMarginPx?: number;
  children?: React.ReactNode;
}> {
  private el: HTMLElement | null = null;
  private observer: IntersectionObserver | null = null;

  componentDidMount() {
    this.syncObserver();
    this.maybeFireIfVisible();
  }

  componentDidUpdate() {
    this.syncObserver();
    this.maybeFireIfVisible();
  }

  componentWillUnmount() {
    this.disconnect();
  }

  private readonly setEl = (el: HTMLElement | null) => {
    this.el = el;
  };

  private disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private syncObserver() {
    this.disconnect();
    if (!this.props.enabled || !this.el || !hasIntersectionObserver()) {
      return;
    }
    const margin = this.props.rootMarginPx !== undefined ? this.props.rootMarginPx : 200;
    const root = findScrollParent(this.el);
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.props.onNearBottom();
        }
      },
      {
        root,
        rootMargin: `0px 0px ${margin}px 0px`,
      },
    );
    this.observer.observe(this.el);
  }

  private maybeFireIfVisible() {
    if (!this.props.enabled || !this.el || !hasIntersectionObserver()) {
      return;
    }
    const margin = this.props.rootMarginPx !== undefined ? this.props.rootMarginPx : 200;
    if (isNearRoot(this.el, findScrollParent(this.el), margin)) {
      this.props.onNearBottom();
    }
  }

  render() {
    if (!this.props.enabled) {
      return null;
    }
    if (!hasIntersectionObserver()) {
      return <div className="champions-load-more">{this.props.children}</div>;
    }
    return <div className="champions-sentinel" ref={this.setEl} />;
  }
}
