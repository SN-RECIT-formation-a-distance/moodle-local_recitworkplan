import React, { Component } from 'react';
import Select from 'react-select'

export class ComboBoxPlus extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        multiple: false,
        required: false,
        data: {},
        size: 1,
        placeholder: "",
        options: [],
        style: null,
        selectedIndex: -1
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
        this.state = {value: this.props.value};
    }
    
    render() {     
        //  spread attributes <div {...this.props}>    
        let spreadAttr = {required: this.props.required, disabled: this.props.disabled, size: this.props.size, style: this.props.style, options: this.props.options};
        if (this.props.multiple){
            spreadAttr.isMulti = true;
        }

        let main = 
            <Select {...spreadAttr} onChange={this.onChange} defaultValue={this.props.value} placeholder={this.props.placeholder}>
            </Select>;            
        return (main);
    }   
    
    onChange(event){
        let value = event.value || "";
        let text = event.label;
        this.setState({value:value});

        this.props.onChange({target:{name: this.props.name, value: value, text: text, data: this.props.data}});
    }   
}
