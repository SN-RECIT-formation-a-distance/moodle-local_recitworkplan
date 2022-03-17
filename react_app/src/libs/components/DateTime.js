import React, { Component } from 'react';

export class DateTime extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        required: false,
        style: null
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

export class DateInput extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        required: false,
        style: null
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
    }
    
    render() {

        let value = new Date(this.props.value);
        if (value){
            value = value.toISOString().slice(0,10);
        }
        //  spread attributes <div {...this.props}>    
        let spreadAttr = {required: this.props.required, name: this.props.name, disabled: this.props.disabled, style: this.props.style};

        let main = 
            <input type="date" {...spreadAttr}  onChange={this.onChange} value={value}/>
        return (main);
    }   
    
    onChange(event){

        this.props.onChange(event);
    }   
}
