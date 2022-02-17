import React, { Component } from 'react';
import { ButtonToolbar, ButtonGroup, Button, Form, FormGroup, InputGroup, FormControl, Col, Table, Badge} from 'react-bootstrap';
import { faPencilAlt,  faTrashAlt, faPlusSquare, faSearch, faSync} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime, WorkPlanUtils } from '../libs/utils/Utils';
import { Pagination } from '../libs/components/Pagination';
import { ModalTemplateForm } from './TemplateView';

export class AssignmentsView extends Component{
    static defaultProps = {        
        queryStr: "",
        onReport: null,
    };

    constructor(props){
        super(props);
        
        this.onClose = this.onClose.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, editTemplateId: -1, queryStr: this.props.queryStr, pagination: {current_page: 1, count: 0, item_per_page: 25}};
    }

    componentDidMount(){
       // $glVars.webApi.addObserver("AssignmentsView", this.getData, ['saveAssignment']);        
        this.getData();
    }

    componentWillUnmount(){
        //$glVars.webApi.removeObserver("AssignmentsView");
    }

    componentDidUpdate(prevProps, prevState){
        if((this.props.queryStr !== prevProps.queryStr) && (this.props.queryStr !== this.state.queryStr)){
            this.setState({queryStr: this.props.queryStr});
        }
    }

    getData(){
        $glVars.webApi.getAssignmentList(false, this.state.pagination.item_per_page, this.state.pagination.current_page - 1, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let pagination = this.state.pagination;
        pagination.current_page = parseInt(result.data.current_offset) + 1; 
        pagination.count = parseInt(result.data.total_count);
        this.setState({dataProvider: result.data.items.detailed, templateId: -1, pagination: pagination});
    }

    changePage(page){
        let pagination = this.state.pagination;
        pagination.current_page = page
        this.setState({pagination: pagination}, this.getData);
    }

    render(){
        let dataProvider = this.state.dataProvider;
        let regexp = UtilsString.getRegExp(this.state.queryStr);

        if(this.state.queryStr.length > 0){
            dataProvider = this.state.dataProvider.filter(function(item){
                if((item.template.name.search(regexp) >= 0) || (item.firstName.search(regexp) >= 0) || (item.lastName.search(regexp) >= 0) || (item.startDate.toString().search(regexp) >= 0)){
                    return true;
                }
                else{
                    return false;
                }
            })
        }

        let main = 
            <div>
                <ButtonToolbar  className="mb-4 justify-content-end">                    
                    <ButtonGroup className="mr-1">
                        <Button title="Ajouter" onClick={() => this.setState({templateId: 0})} variant="primary"><FontAwesomeIcon icon={faPlusSquare}/>{" Attribuer un plan de travail"}</Button>
                    </ButtonGroup>
                    <ButtonGroup >
                    <Button title="Actualiser" onClick={() => this.getData()} variant="primary"><FontAwesomeIcon icon={faSync}/></Button>
                    </ButtonGroup>
                </ButtonToolbar>
                
                <FormGroup>
                    <InputGroup>
                        <FormControl autoFocus type="text" placeholder={"Recherchez..."} onChange={(event) => this.setState({queryStr: event.target.value})} value={this.state.queryStr}  aria-describedby="inputGroupPrepend" />
                        <InputGroup.Prepend>
                            <InputGroup.Text id="inputGroupPrepend"><FontAwesomeIcon icon={faSearch}/></InputGroup.Text>
                        </InputGroup.Prepend>
                    </InputGroup>
                </FormGroup>

                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Plan de travail"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Élève"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 160}}>{"Début"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 160}}>{"Fin"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 150}}>{"Rythme (h/semaine)"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 130}}>{"Activité complétée"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 100}}>{"État"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 100}}>{}</DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index}>
                                    <DataGrid.Body.Cell>{(this.state.pagination.item_per_page * (this.state.pagination.current_page-1)) + index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell><a href="#" onClick={() => this.setState({editTemplateId: item.template.id})}>{item.template.name}</a></DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell><a href={item.userUrl} target="_blank"><span dangerouslySetInnerHTML={{__html: item.userPix}}></span>{`${item.firstName} ${item.lastName}`}</a></DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.startDate)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.endDate)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.nbHoursPerWeek}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{WorkPlanUtils.getActivityCompletion(item.template.activities)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell><a href='#' onClick={() => this.props.onReport(item)}>{WorkPlanUtils.getCompletionState(item)}</a></DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                            <ButtonGroup size="sm">
                                                <Button title="Éditer" onClick={() => this.setState({templateId: item.template.id})} variant="primary"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
                <Pagination pagination={this.state.pagination} onChangePage={(p) => this.changePage(p)}/>
                {this.state.templateId >= 0 && <ModalAssignmentForm templateId={this.state.templateId} onClose={this.onClose}/>}
                {this.state.editTemplateId >= 0 && <ModalTemplateForm templateId={this.state.editTemplateId} title={'Modifer un gabarit'} onClose={this.onClose}/>}
            </div>;

        return main;
    }

    onClose(refresh){
        if(refresh){
            this.getData();
            this.setState({editTemplateId: -1});
        }
        else{
            this.setState({templateId: -1, editTemplateId: -1});
        }
    }

}

class ModalAssignmentForm extends Component{
    static defaultProps = {        
        templateId: 0,
        onClose: null
    };

    constructor(props){
        super(props);

        this.getDataResult = this.getDataResult.bind(this);
        this.getData = this.getData.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onDeleteAssignment = this.onDeleteAssignment.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {templateId: props.templateId, assignmentList: [], dropdownLists: {studentList: [], templateList: []}, flags: {dataChanged: false, refresh: false}};
    }

    componentDidMount(){
        this.getData(this.state.templateId, true);
    }

    render(){
        if(this.state.data === null){ return null; }

        let studentList = this.state.dropdownLists.studentList.filter(item => (JsNx.getItem(this.state.assignmentList, 'userId', item.userId, null) === null) );

        let body = 
            <Form noValidate validated={this.state.formValidated} ref={this.formRef}>
                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>{"Plan de travail"}</Form.Label>
                        <ComboBox placeholder={"Sélectionnez votre option"} required={true}  name="templateId" value={this.state.templateId} options={this.state.dropdownLists.templateList} onChange={this.onDataChange} />
                    </Form.Group>
                </Form.Row>
                <div style={{display: 'grid',gridTemplateColumns: '400px 65%', gridGap: '1rem', marginTop: "1rem"}}>
                    <div>
                        <h6>Liste d'élèves <Badge variant="warning" className="p-2 rounded">{`${studentList.length}`}</Badge></h6>
                        <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                            <Table striped bordered hover>                                
                                <thead>
                                    <tr>
                                        <th>Élève</th>
                                        <th style={{width: 50}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td><a href={item.userUrl} target="_blank"><span dangerouslySetInnerHTML={{__html: item.userPix}}></span>{`${item.firstName} ${item.lastName}`}</a></td>
                                                <td><Button onClick={() => this.onAdd(item)} size="sm" variant="primary" title="Ajouter" className="mr-2"><FontAwesomeIcon icon={faPlusSquare}/></Button></td>
                                            </tr>

                                            return row;
                                        }
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                    <div >
                        <div>
                            <h6>Élèves assignés <Badge variant="warning" className="p-2 rounded">{`${this.state.assignmentList.length}`}</Badge></h6>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Élève</th>
                                            <th>Début</th>
                                            <th>Rythme (h/semaine)</th>
                                            <th style={{width: 50}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.assignmentList.map((item, index) => {
                                                let row =
                                                    <tr key={index}>
                                                        <td>{`${item.firstName} ${item.lastName}`}</td>
                                                        <td><Form.Control type="text" placeholder="" value={item.startDate} name="startDate" onBlur={() => this.onSave(item)} onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Form.Control type="text" placeholder="" value={item.nbHoursPerWeek} name="nbHoursPerWeek" onBlur={() => this.onSave(item)} onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Button size="sm" variant="primary" title="Supprimer" onClick={() => this.onDeleteAssignment(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button></td>
                                                    </tr>;

                                                return row;
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>;

        let main = <Modal title={'Attribuer un plan de travail'} body={body} onClose={this.onClose} />;

        return (main);
    }

    getData(templateId, complete){
        templateId = templateId || 0;
        complete = (typeof complete === 'undefined' ? false : complete);
        $glVars.webApi.getAssignmentFormKit(templateId, complete, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let templateList = [];
        if(result.data.templateList !== null){
            for(let item of result.data.templateList){
                templateList.push({text: item.name, value: item.id});
            }
        }
        else{
            templateList = this.state.dropdownLists.templateList;
        }
        
        this.setState({
            assignmentList: result.data.data,
            prototype: (result.data.prototype !== null ? result.data.prototype : this.state.prototype), 
            dropdownLists: {studentList: result.data.studentList, templateList: templateList}}
        );
    }

    onAdd(item){
        let newItem = JsNx.clone(this.state.prototype);
        newItem.userId = item.userId;
        newItem.firstName = item.firstName;
        newItem.lastName = item.lastName;
        newItem.template.id = this.state.templateId;
        this.setState({flags: {dataChanged: true, refresh: true}}, () => this.onSave(newItem))
    }

    onDeleteAssignment(assignmentId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let assignmentList = that.state.assignmentList;
            JsNx.removeItem(assignmentList, 'id', assignmentId);
            that.setState({assignmentList: assignmentList, flags: {dataChanged: that.state.flags.dataChanged, refresh: true}});
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteAssignment(assignmentId, callback);
        }
    }

    onDataChange(event, index){
        if(index >= 0){
            let assignmentList = this.state.assignmentList;
            let flags = this.state.flags;
            flags.dataChanged = (assignmentList[index][event.target.name] !== event.target.value);
            flags.refresh = true;
            assignmentList[index][event.target.name] = event.target.value;
            this.setState({assignmentList: assignmentList, flags: flags});
        }
        else{
            let data = this.state;
            data[event.target.name] = event.target.value;
            this.setState(data, () => this.getData(event.target.value));
        }
    }

    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let assignmentList = that.state.assignmentList;

            if(data.id === 0){
                data.id = result.data;
                assignmentList.push(data);
            }

            that.setState({assignmentList: assignmentList, flags: {dataChanged: false, refresh: that.state.flags.refresh}});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.refresh);
    }
}