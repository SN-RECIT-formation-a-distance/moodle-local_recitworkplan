import React, { Component } from 'react';
import { Form } from 'react-bootstrap';

export class ComboBox extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        multiple: false,
        required: false,
        size: 1,
        placeholder: "",
        options: [],
        style: null,
        selectedIndex: -1
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
    }
    
    render() {     
        //  spread attributes <div {...this.props}>    
        let spreadAttr = {required: this.props.required, multiple: this.props.multiple, disabled: this.props.disabled, size: this.props.size, style: this.props.style};

        let main = 
            <Form.Control as="select" {...spreadAttr}  onChange={this.onChange} value={this.props.value}>
                <option  value="">{this.props.placeholder}</option>
                {this.props.options.map(function(item, index){
                    return <option key={index} value={item.value}>{item.text}</option>;
                })}
            </Form.Control>;            
        return (main);
    }   
    
    onChange(event){
        let value = event.target.value || "";
        let selectedIndex = event.target.selectedIndex - 1; // -1 because of the placeholder (first option)
        let text = "";
        let data = null;
        
        if((selectedIndex >= 0) && (selectedIndex < this.props.options.length)){
            data = this.props.options[selectedIndex].data;
            text = this.props.options[selectedIndex].text;
        }

        this.props.onChange({target:{name: this.props.name, value: value, text: text, data: data, index: selectedIndex}});
    }   
}
