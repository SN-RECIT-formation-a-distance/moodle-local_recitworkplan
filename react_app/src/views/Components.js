import React, { Component } from 'react';
import { ButtonGroup, Card, Tabs, Tab, Button, Form, DropdownButton, Dropdown, Col, Row, Table, Badge, Collapse} from 'react-bootstrap';
import { faPencilAlt,  faPlus, faTrashAlt, faCopy, faCheck, faArrowRight, faArrowLeft, faEllipsisV, faArrowCircleDown, faArrowCircleUp, faMinus, faArchive, faUser} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBoxPlus, FeedbackCtrl, Modal, ToggleButtons } from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime } from '../libs/utils/Utils';
import { Pagination } from '../libs/components/Pagination';
import {ActivityPicker, ModalTemplateForm} from './TemplateView';
import { DateInput } from '../libs/components/DateTime';


export class UserActivityList extends Component{
    static defaultProps = {        
        data: null
    };

    constructor(props){
        super(props);
    }

    render(){
        let item = this.props.data;

        let main = 
            <Card className='rounded mt-2 mb-2'>
                <Card.Body style={{backgroundColor: "#ffffff", display: "grid", gridGap: '1rem', gridTemplateColumns: '50% auto auto', alignItems: 'center'}}>
                    <div>
                        <div className='h4'><strong><a href={item.cmUrl} target="_blank">{item.cmName}</a></strong></div>
                        <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                        <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                    </div>
                    <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                        {item.completionState > 0 && <Button variant='success'>Complété</Button>}
                    </div>
                </Card.Body>
            </Card>

        return main;
    }
}