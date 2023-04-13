import React, { Component } from 'react';

/**
 * Ce modal est nécessaire, car le Bootstrap Modal ne marche pas avec les menus déroulants de Atto
 */
export class Modal extends Component{
    static defaultProps = {        
        show: true,
        title: "",
        body: null,
        footer: null,
        onClose: null,
        width: '75%',
        style: null
    };

    constructor(props){
        super(props);

        this.tmp = "";
    }

    componentDidMount(){
        this.tmp =  document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
    
    componentWillUnmount(){
        document.body.style.overflow = this.tmp;
    }

    render(){
        let style = {maxWidth: "1490px", width: this.props.width, margin: "1.75rem auto", backgroundColor: "#FFF"};
        style = {...style, ...this.props.style};
        
        let main = 
            <div style={{position: "fixed", top: 0, backgroundColor: "rgba(0,0,0,0.5)", left: 0, bottom: 0, right: 0, zIndex: 1040, overflowX: 'hidden', overflowY: 'auto'}}>
                <div style={style}>
                    <div className="modal-header">
                        <h4 className="text-truncate">{this.props.title}</h4>
                        <button type="button" className="close" onClick={this.props.onClose}><span aria-hidden="true">×</span><span className="sr-only">Fermer</span></button>
                    </div>
                    <div className="modal-body">{this.props.body}</div>
                    {this.props.footer && <div className="modal-footer">{this.props.footer}</div>}
                </div>
            </div>;

        return (this.props.show ? main : null);
    }
}