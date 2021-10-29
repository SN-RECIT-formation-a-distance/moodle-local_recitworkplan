import React, { Component } from 'react';
import {ButtonToolbar, ButtonGroup, Button, Form, Col, DropdownButton, Dropdown, Modal, Nav, Card, Pagination} from 'react-bootstrap';
import {faArrowLeft, faArrowRight, faPencilAlt, faPlusCircle, faWrench, faTrashAlt, faBars, faTv, faEye, faAngleRight, faGripVertical} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid} from '../libs/components/Components';
import {JsNx} from '../libs/utils/Utils';
import {$glVars} from '../common/common';


export class StudentView extends Component {
    constructor(props) {
        super(props);
    }

    render() {       
        let main = <div></div>;

        return (main);
    }
}
