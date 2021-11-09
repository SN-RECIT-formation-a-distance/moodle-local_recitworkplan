
import React, { Component } from 'react';
import { ButtonGroup, Button, Form, FormGroup, InputGroup, FormControl, Col, Table, Badge} from 'react-bootstrap';
import { faPencilAlt,  faTrashAlt, faPlus, faSearch} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime } from '../libs/utils/Utils';

export class AssignmentsView extends Component{
    static defaultProps = {        
        queryStr: ""
    };

    constructor(props){
        super(props);
        
        this.onClose = this.onClose.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, queryStr: this.props.queryStr};
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
        $glVars.webApi.getAssignmentList(false, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.detailed, templateId: -1});
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
                <Button className="mb-3" title="Ajouter" onClick={() => this.setState({templateId: 0})} variant="primary"><FontAwesomeIcon icon={faPlus}/>{" Attribuer un plan de travail"}</Button>

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
                                        <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.template.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{`${item.firstName} ${item.lastName}`}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.startDate)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.endDate)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.nbHoursPerWeek}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{this.getActivityCompletion(item.template.activities)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{this.getCompletionState(item)}</DataGrid.Body.Cell>
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
                {this.state.templateId >= 0 && <ModalAssignmentForm templateId={this.state.templateId} onClose={this.onClose}/>}
            </div>;

        return main;
    }

    onClose(refresh){
        if(refresh){
            this.getData();
        }
        else{
            this.setState({templateId: -1});
        }
    }

    getActivityCompletion(activities){
        let count = 0;
        for(let item of activities){
            if(item.completionState >= 1){
                count++;
            }
        }

        return `${count}/${activities.length}`;
    }

    getCompletionState(item){
        let result = "";

        switch(item.completionState){
            case 0:
                result = "En cours"; break;
            case 1:
                result = "Terminé"; break;
            case 2:
                result = "En retard"; break;
        }

        return result;
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
                        <Form.Label>{"Collection de notes:"}</Form.Label>
                        <ComboBox placeholder={"Sélectionnez votre option"} required={true}  name="templateId" value={this.state.templateId} options={this.state.dropdownLists.templateList} onChange={this.onDataChange} />
                    </Form.Group>
                </Form.Row>
                <div style={{display: 'grid',gridTemplateColumns: '400px 65%', gridGap: '1rem', marginTop: "1rem"}}>
                    <div>
                        <h4>Liste d'élèves <Badge>{`(${studentList.length})`}</Badge></h4>
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
                                                <td>{`${item.firstName} ${item.lastName}`}</td>
                                                <td><Button onClick={() => this.onAdd(item)} size="sm" variant="primary" title="Ajouter" className="mr-2"><FontAwesomeIcon icon={faPlus}/></Button></td>
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
                            <h4>Élèves assignés <Badge>{`(${this.state.assignmentList.length})`}</Badge></h4>
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
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
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
        let assignmentList = this.state.assignmentList;
        let newItem = JsNx.clone(this.state.prototype);
        newItem.userId = item.userId;
        newItem.firstName = item.firstName;
        newItem.lastName = item.lastName;
        newItem.template.id = this.state.templateId;
        assignmentList.push(newItem);
        this.setState({assignmentList: assignmentList, flags: {dataChanged: true, refresh: true}}, () => this.onSave(newItem))
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

        $glVars.webApi.deleteAssignment(assignmentId, callback);
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

            that.setState({flags: {dataChanged: false, refresh: that.state.flags.refresh}});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.refresh);
    }
}