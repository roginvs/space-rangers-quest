import * as React from "react";

import "./common.css";

export class DivFadeinCss extends React.Component<
  {
    className?: string;
    tagName?: "div";
    style?: React.CSSProperties;
  },
  {
    entered: boolean;
  }
> {
  state = {
    entered: false,
  };
  componentWillMount() {
    this.setState({
      entered: false,
    });
  }
  componentDidMount() {
    this.mounted = true;
    setTimeout(() => {
      if (this.mounted) {
        this.setState({
          entered: true,
        });
      }
    }, 10);
  }
  private mounted = false;
  componentWillUnmount() {
    this.mounted = false;
    //console.info('Will unmount')
  }
  render() {
    const TagName = this.props.tagName || "div";
    return (
      <TagName
        style={this.props.style}
        className={
          "fade-enter" +
          (this.state.entered ? " fade-enter-active" : "") +
          " " +
          (this.props.className || "")
        }
      >
        {this.props.children}
      </TagName>
    );
  }
}

export class Loader extends React.Component<
  {
    text?: string;
  },
  {}
> {
  render() {
    return (
      <DivFadeinCss className="p-3 text-center">
        <i className="fa fa-spinner fa-spin" />
        {this.props.text ? <span> {this.props.text}...</span> : null}
      </DivFadeinCss>
    );
  }
}

export class Redirect extends React.Component<
  {
    to: string;
  },
  {}
> {
  componentDidMount() {
    // window.history.replaceState({}, this.props.to, this.props.to); // this not emitting onhashchange
    // location.hash = this.props.to;
    location.replace(this.props.to);
  }
  render() {
    return <Loader text={`Redirecting to ${this.props.to}`} />;
  }
}

/*
export class Tabs extends React.Component<
    {
        tabs: JSX.Element[];
    },
    {
        activeTabId: number;
        prevActiveTabId: number;
    }
> {
    state = {
        activeTabId: 0,
        prevActiveTabId: -1
    };
    render() {
        return (
            <div className="mb-3">
                {this.props.tabs.length > 1 ? 
                <div className="mb-3">
                    {this.props.tabs.map((tab, id) => (
                        <button
                                className={`btn mx-2 ${
                                    id === this.state.activeTabId
                                        ? "btn-primary"
                                        : "btn-light"
                                }`}
                          
                                onClick={e => {
                                    e.preventDefault();
                                    this.setState(
                                        {
                                            prevActiveTabId: this.state
                                                .activeTabId,
                                            activeTabId: id
                                        },
                                        () => {
                                            setTimeout(() => {
                                                this.setState({
                                                    prevActiveTabId: -1
                                                });
                                            }, 300);
                                        }
                                    );
                                }}
                            >
                                {tab}
                        </button>
                    ))}
                </div> : null}
                <div className="tab-content">
                    {React.Children.map(this.props.children, (child, i) => {
                        return (
                            <div
                                key={i}
                                className={
                                    `tab-pane fade ` +
                                    (this.state.prevActiveTabId > -1
                                        ? i === this.state.prevActiveTabId
                                            ? "active"
                                            : ""
                                        : i === this.state.activeTabId
                                            ? "active show"
                                            : "")
                                }
                            >
                                {child}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

*/

export class ErrorInfo extends React.Component<
  {
    error: Error | string;
  },
  {}
> {
  render() {
    const e = this.props.error;
    console.warn(e);
    return (
      <div className="text-center p-3 text-danger">
        {e instanceof Error ? (
          <div>
            <div>
              {e.name}: {e.message}
            </div>
            <div>{e.stack}</div>
          </div>
        ) : (
          <span>{e.toString()}</span>
        )}
        <div>{this.props.children}</div>
      </div>
    );
  }
}
