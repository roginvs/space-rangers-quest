import * as React from "react";

import "./common.css";

export class DivFadeinCss extends React.Component<
    {
        className?: string;
        tagName?: string;
    },
    {
        entered: boolean;
    }
> {
    state = {
        entered: false
    };
    componentWillMount() {
        this.setState({
            entered: false
        });
    }
    componentDidMount() {
        this.mounted = true;
        setTimeout(() => {
            if (this.mounted) {
                this.setState({
                    entered: true
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

export class Loader extends React.Component<{
    text?: string,
}, {}> {
    render() {
        return (
            <DivFadeinCss className="p-3 text-center">
                <i className="fa fa-spinner fa-spin" />
                {this.props.text ? <span> {this.props.text}...</span> : null}
            </DivFadeinCss>
        );
    }
}