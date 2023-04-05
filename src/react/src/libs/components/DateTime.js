import React, { Component } from 'react';

export class DateTime extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        required: false,
        style: null,
        min: '',
        max: '',
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
    }
    
    render() {
        let time = '';

        if(this.props.value > 0){
            let obj = new Date(this.props.value * 1000);
            if (obj){
                time = obj.getFullYear().toString();
                time += "-" + (obj.getMonth()+1).toString().padStart(2, '0');
                time += "-" + obj.getDate().toString().padStart(2, '0');
                time += "T" + obj.getHours().toString().padStart(2, '0');
                time += ":" + obj.getMinutes().toString().padStart(2, '0');
            }
        }
        
        //  spread attributes <div {...this.props}>    
        let spreadAttr = {required: this.props.required, name: this.props.name, disabled: this.props.disabled, style: this.props.style, min: this.props.min, max: this.props.max};

        let main = 
            <input className='form-control' type="datetime-local" {...spreadAttr}  onChange={this.onChange} value={time}/>
        return (main);
    }   
    
    onChange(event){
        let timestamp = Date.parse(event.target.value) / 1000;
        let data = {target: {name: this.props.name, value: timestamp}};
        this.props.onChange(data);
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
