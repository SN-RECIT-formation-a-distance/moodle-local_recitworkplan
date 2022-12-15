import React, { Component } from 'react';

export class Loading extends Component{
    static defaultProps = {
        webApi: null,
        children: null
    };

    constructor(props){
        super(props);

        this.domRef = React.createRef();
    }

    renderChildren() {        
        return React.Children.map(this.props.children, (child, index) => {
            if(child === null){ return (null); }

            return React.cloneElement(child, {
                className: "Img"
            });
        });
    }

    componentDidMount(){
        if(this.props.webApi === null){ return; }

        this.props.webApi.domVisualFeedback = this.domRef.current;
    }

    render(){
        return (<div style={{display: 'none', position: 'fixed',inset: '0px',backgroundColor: 'rgba(0, 0, 0, 0.5)',zIndex: 10770,overflow: 'hidden auto'}} ref={this.domRef}><div className="Loading">{this.renderChildren()}</div></div>);
    }
}