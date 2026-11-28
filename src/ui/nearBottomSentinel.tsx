import * as React from "react";

/** Calls onNearBottom while this element is (almost) visible: infinite scroll */
export class NearBottomSentinel extends React.Component<{
  enabled: boolean;
  onNearBottom: () => void;
}> {
  private el: HTMLDivElement | null = null;
  private observer: IntersectionObserver | null = null;

  componentDidMount() {
    this.observe();
  }
  // A new observer reports the current state, so the next page is loaded
  // if the sentinel is still visible after the previous one
  componentDidUpdate() {
    this.observe();
  }
  componentWillUnmount() {
    this.observer?.disconnect();
  }

  private observe() {
    this.observer?.disconnect();
    if (this.props.enabled && this.el) {
      this.observer = new IntersectionObserver(
        (entries) => entries.some((e) => e.isIntersecting) && this.props.onNearBottom(),
        { rootMargin: "200px" },
      );
      this.observer.observe(this.el);
    }
  }

  render() {
    return this.props.enabled ? (
      <div className="champions-sentinel" ref={(el) => (this.el = el)} />
    ) : null;
  }
}
