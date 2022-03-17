import React, { Component } from 'react';
import { Form } from 'react-bootstrap';

export class DateTime extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        required: false,
        size: 1,
        placeholder: "",
        style: null,
        selectedIndex: -1
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
    }
    
    render() {

        let time = new Date(this.props.value);
        if (time){
            time = time.toISOString().slice(0,16);
        }
        //  spread attributes <div {...this.props}>    
        let spreadAttr = {required: this.props.required, name: this.props.name, disabled: this.props.disabled, style: this.props.style};

        let main = 
            <input type="datetime-local" {...spreadAttr}  onChange={this.onChange} value={time}/>
        return (main);
    }   
    
    onChange(event){

        this.props.onChange(event);
    }   
}
