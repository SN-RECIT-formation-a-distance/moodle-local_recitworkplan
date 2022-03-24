import React, { Component } from 'react';
import { FormControl } from 'react-bootstrap';

export class ClickableElipsis extends Component {
    static defaultProps = {
        text: '',
        maxCharacters: 60,
        expandText: ' ...Voir plus',
        className: ''
    };

    constructor(props){
        super(props);
        

        this.state = {expanded:false};
    }

    
    render() {
        let main = <></>
        if (this.props.text.length < this.props.maxCharacters || this.state.expanded){
            main = <span className={this.props.className}>{this.props.text}</span>;
        }else{
            main = <span className={this.props.className}>{this.props.text.substr(0, this.props.maxCharacters)} <a onClick={() => this.setState({expanded:true})} href='#'>{this.props.expandText}</a></span>;
        }
        return (main);
    }   
    
}
