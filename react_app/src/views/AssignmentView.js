import React, { Component } from 'react';
import { Card, Tabs, Tab, Button, Form, DropdownButton, Dropdown, InputGroup, FormControl, Col, Row, Table, Badge} from 'react-bootstrap';
import { faPencilAlt,  faPlus, faTrashAlt, faPlusSquare, faCheck, faSearch, faArrowsAlt, faArrowLeft, faEllipsisV} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBoxPlus, FeedbackCtrl, DataGrid, Modal, ToggleButtons } from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime, WorkPlanUtils } from '../libs/utils/Utils';
import { Pagination } from '../libs/components/Pagination';
import {ActivityPicker} from './TemplateView';

export class AssignmentsView extends Component{
    static defaultProps = {        
    };

    constructor(props){
        super(props);
        
        this.onAdd = this.onAdd.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onCompletionStateChange = this.onCompletionStateChange.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, completionState: '0', queryStr: "", pagination: {current_page: 1, count: 0, item_per_page: 25}};
    }

    componentDidMount(){
       // $glVars.webApi.addObserver("AssignmentsView", this.getData, ['saveAssignment']);        
        this.getData();
    }

    componentWillUnmount(){
        //$glVars.webApi.removeObserver("AssignmentsView");
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, this.state.completionState, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let pagination = this.state.pagination;
        pagination.current_page = parseInt(result.data.current_offset) + 1; 
        pagination.count = parseInt(result.data.total_count);
        this.setState({dataProvider: result.data.items, templateId: -1, pagination: pagination}); 
    }

    changePage(page){
        let pagination = this.state.pagination;
        pagination.current_page = page;
        this.setState({pagination: pagination}, this.getData);
    }

    onCompletionStateChange(event){
        this.setState({completionState: event.target.value}, this.getData); 
    }

    render(){
        let dataProvider = this.state.dataProvider;
        
        /*let regexp = UtilsString.getRegExp(this.state.queryStr);

        if(this.state.queryStr.length > 0){
            dataProvider = this.state.dataProvider.filter(function(item){
                if((item.template.name.search(regexp) >= 0) || (item.firstName.search(regexp) >= 0) || (item.lastName.search(regexp) >= 0) || (item.startDate.toString().search(regexp) >= 0)){
                    return true;
                }
                else{
                    return false;
                }
            })
        }*/

        /*                <FormGroup>
                    <InputGroup>
                        <FormControl autoFocus type="text" placeholder={"Recherchez..."} onChange={(event) => this.setState({queryStr: event.target.value})} value={this.state.queryStr}  aria-describedby="inputGroupPrepend" />
                        <InputGroup.Prepend>
                            <InputGroup.Text id="inputGroupPrepend"><FontAwesomeIcon icon={faSearch}/></InputGroup.Text>
                        </InputGroup.Prepend>
                    </InputGroup>
                </FormGroup>*/
                /*<DataGrid.Body.Cell></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.startDate)}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.endDate)}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell>{item.nbHoursPerWeek}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell>{WorkPlanUtils.getActivityCompletion(item.template.activities)}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href='#' onClick={() => this.props.onReport(item)}>{WorkPlanUtils.getCompletionState(item)}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                    <ButtonGroup size="sm">
                                        <Button title="Éditer" onClick={() => this.setState({templateId: item.template.id})} variant="primary"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                    </ButtonGroup>
                                </DataGrid.Body.Cell>*/ 
        let main = 
            <div>
                <div className='d-flex' style={{justifyContent: "space-between"}}>
                    <div className='d-flex' style={{alignItems: "center"}}>
                        <span className='h1 mr-3'>Plans de travail</span>
                        <Button variant='outline-primary' className='rounded-circle' title='Créer un plan de travail.' onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/></Button>
                    </div>
                    <div>
                        <ToggleButtons name="completionState" onChange={this.onCompletionStateChange} type="radio"  defaultValue={this.state.completionState} options={
                            [{value: "0", text: "En Cours"}, {value: "1", text: "Complétés"}, , {value: "-1", text: "Gabarits"}]}/> 
                    </div>
                </div> 

                <div style={{display: "grid", gridGap: "1rem", gridTemplateColumns: "auto auto auto"}}>
                    {dataProvider.map((workPlan, index) => {
                            let progress = workPlan.stats.nbCompletion/workPlan.stats.nbStudents * 100;
                            
                            let card = 
                                <Card key={index} className='rounded'>
                                    <div style={{backgroundColor: '#0f6fc5', width: `${progress}%`, height: '5px'}}>
                                         
                                    </div>
                                    <Card.Body style={{backgroundColor: "#f0f0f0"}}>
                                        <div className='d-flex' style={{justifyContent: 'space-between'}}>
                                            <span className='h3'>{workPlan.template.name}</span>
                                            <Button variant='outline-primary'><FontAwesomeIcon icon={faEllipsisV}  /></Button>
                                        </div>
                                        <div className="m-2 p-2">
                                            {workPlan.assignments.map((assignment, index2) => {
                                                return <span key={index2} dangerouslySetInnerHTML={{__html: assignment.user.avatar}}></span>;
                                            })}
                                            <Button variant='outline-primary' className='rounded-circle' title='Attribuer un plan de travail.' onClick={() => this.onEdit(workPlan.template.id)}><FontAwesomeIcon icon={faPlus}/></Button>
                                        </div>
                                        <div className="m-3 p-2">
                                            {workPlan.followUps.map((followUps, index2) => {
                                                return <Button variant={followUps.variant}>{followUps.desc}</Button>;
                                            })}
                                        </div>  
                                        {workPlan.stats.nbStudents > 0 && 
                                            <div className="p-2 text-muted">
                                                <span className='mr-5'>{"Achèvement"}</span><FontAwesomeIcon icon={faCheck}/><span className='ml-2'>{`${workPlan.stats.nbCompletion}/${workPlan.stats.nbStudents}`}</span>  
                                            </div>
                                        }
                                    </Card.Body>
                                </Card>
                            return (card);                                     
                        }
                    )}
                </div>

                <Pagination pagination={this.state.pagination} onChangePage={(p) => this.changePage(p)}/>                
            </div>;

        let form = <WorkPlanForm templateId={this.state.templateId} onClose={this.onClose}/>;


        return (this.state.templateId >= 0 ? form : main);
    }

    onAdd(){
        this.setState({templateId: 0});
    }

    onEdit(templateId){
        this.setState({templateId: templateId});
    }

    onClose(){
        this.getData();
        this.setState({templateId: -1});
    } 
}

class WorkPlanForm extends Component{
    static defaultProps = {        
        templateId: 0,
        onClose: null
    };

    constructor(props){
        super(props);

        this.onTabChange = this.onTabChange.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.getData = this.getData.bind(this);
        this.onSaveTemplate = this.onSaveTemplate.bind(this); 
        this.onDataChange = this.onDataChange.bind(this);
        this.onShowActivities = this.onShowActivities.bind(this);
        this.onDeleteActivity = this.onDeleteActivity.bind(this);

        this.state = {tab: 'activities', data: null, showActivities: false};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanFormKit(this.props.templateId, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }
        this.setState({data: result.data.data});
    }

    render(){
        if(this.state.data === null){ return null;}

        let body =  
            <div>                
                <div className='d-flex mb-4' style={{alignItems: "center"}}>
                    <Button onClick={this.props.onClose} className='rounded-circle' variant='outline-primary'><FontAwesomeIcon icon={faArrowLeft}/></Button>
                    <span className="h1 ml-3">Plan de travail</span>
                </div>
                <Form>
                    <div className='h3 mb-4'>Description</div>
                    <Form.Group as={Row} >
                        <Form.Label column sm="2">{"Nom"}</Form.Label>
                        <Col sm="10">
                            <Form.Control type="text"  value={this.state.data.template.name} onBlur={() => this.onSaveTemplate(this.state.data)} name="name" onChange={this.onDataChange} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column sm="2">{"Description"}</Form.Label>
                        <Col sm="10">
                            <Form.Control as="textarea" rows={4} className='w-100' value={this.state.data.template.description} onBlur={() => this.onSaveTemplate(this.state.data)}  name="description" onChange={this.onDataChange} />
                        </Col>
                    </Form.Group>
                </Form>   
                <Tabs id="workPlanTabs" className="mt-3" variant="pills" fill  activeKey={this.state.tab} onSelect={this.onTabChange}>
                    <Tab eventKey="activities" title="Activités">
                        <div className='d-flex' style={{justifyContent: "space-between", alignItems: "center"}}>
                            <div className='d-flex' style={{alignItems: "center"}}>
                                <span className='h2 mr-3'>Activités</span>
                                <Button variant='outline-primary' className='rounded-circle' title='Ajouter des activités.' onClick={() => this.onShowActivities(true)} ><FontAwesomeIcon icon={faPlus}/></Button>
                            </div>
                            <div>
                                <Form.Control  readOnly  onChange={null} type="search" value={""} name='query' placeholder="Catégories, cours..."/>
                            </div>
                        </div> 
                        <div>
                            {this.state.data.template.activities.map((item, index) => {
                                    let progress = this.state.data.template.stats.nbCompletion/this.state.data.template.stats.nbStudents * 100;
                                    
                                    let card = 
                                        <Card key={index} className='rounded mt-2 mb-2'>
                                            <div style={{backgroundColor: '#0f6fc5', width: `${progress}%`, height: '5px'}}>
                                                
                                            </div>
                                            <Card.Body style={{backgroundColor: "#f0f0f0", display: "grid", gridGap: '1rem', gridTemplateColumns: 'auto auto 240px', alignItems: 'center'}}>
                                                <div>
                                                    <div className='h4'><strong>{item.cmName}</strong></div>
                                                    <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                                                    <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                                                </div>
                                                <div className="m-3 p-2">
                                                    {this.state.data.template.followUps.map((followUps, index2) => {
                                                        return <Button key={index2} variant={followUps.variant}>{followUps.desc}</Button>;
                                                    })}
                                                </div>
                                                <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                                                    <span className='mr-3'>{"Achèvement"}</span>
                                                    <FontAwesomeIcon icon={faCheck}/><span className='ml-2 mr-3'>{`${this.state.data.template.stats.nbCompletion}/${this.state.data.template.stats.nbStudents}`}</span>  
                                                    <DropdownButton variant='outline-primary' title={<span><FontAwesomeIcon icon={faEllipsisV}  />{" "}</span>} id={`optionsActivity${item.id}`}>
                                                        <Dropdown.Item onClick={() => this.onShowActivities(true)}><FontAwesomeIcon icon={faPencilAlt}  />{" Modifier"}</Dropdown.Item>
                                                        <Dropdown.Item onClick={() => this.onDeleteActivity(item.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                                                    </DropdownButton>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    return (card);                                     
                                }
                            )}
                        </div>
                    </Tab>
                    <Tab eventKey="assignments" title="Affectations">
                        <div className='d-flex' style={{justifyContent: "space-between", alignItems: "center"}}>
                            <div className='d-flex' style={{alignItems: "center"}}>
                                <span className='h2 mr-3'>Affectations</span>
                                <Button variant='outline-primary' className='rounded-circle' title='Attribuer un plan de travail.'><FontAwesomeIcon icon={faPlus}/></Button>
                            </div>
                            <div>
                                <Form.Control  onChange={null}  readOnly type="search" value={""} name='query' placeholder="Nom, groupe..."/> 
                            </div>
                        </div>

                        <div>
                            {this.state.data.assignments.map((item, index) => {
                                    let progress = this.state.data.template.stats.nbCompletion/this.state.data.template.stats.nbActivities * 100;
                                    
                                    let card = 
                                        <Card key={index} className='rounded mt-2 mb-2'>
                                            <div style={{backgroundColor: '#0f6fc5', width: `${progress}%`, height: '5px'}}>
                                                
                                            </div>
                                            <Card.Body style={{backgroundColor: "#f0f0f0", display: "grid", gridGap: '1rem', gridTemplateColumns: '50px auto auto 240px', alignItems: 'center'}}>
                                                <div>
                                                    <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                                </div>
                                                <div>
                                                    <strong>{item.user.firstName}</strong><span  className='ml-3 text-muted'>Groupe:</span><span className='text-muted'>{` ${item.user.groupList}`}</span>
                                                    <div className='text-muted'>Dernière connexion: {item.user.lastAccess}</div>
                                                    <div className='text-muted'>Début: {UtilsDateTime.getDate(item.startDate)}</div>
                                                    <div className='text-muted'>Rythme (h/semaine): {item.nbHoursPerWeek}</div>
                                                </div>
                                                <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                                                    <span className='mr-3'>{"Achèvement"}</span>
                                                    <FontAwesomeIcon icon={faCheck}/><span className='ml-2 mr-3'>{`${this.state.data.template.stats.nbCompletion}/${this.state.data.template.stats.nbStudents}`}</span>  
                                                    <Button variant='outline-primary'><FontAwesomeIcon icon={faEllipsisV}  /></Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    return (card);                                     
                                }
                            )}
                        </div>
                    </Tab>
                </Tabs>  
                {this.state.showActivities  && <ActivityPicker templateId={this.props.templateId} onClose={(refresh) => this.onShowActivities(false, refresh)}/>}
            </div>
            
        let main = body;

        return (main);
    }

    onTabChange(k){
        this.setState({tab: k});
    }

    onDataChange(event){
        let data = this.state.data;
        if(data.template[event.target.name] !== event.target.value){
            data.template[event.target.name] = event.target.value
            this.setState({data:data});
        }
    }

    onSaveTemplate(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;
            if(data.template.id === 0){
                data.template.id = result.data;
                that.setState({data: data});
            }
        }

        $glVars.webApi.saveTemplate(this.state.data.template, callback);
    }

    onShowActivities(value, refresh){
        console.log(value, refresh)
        refresh = (typeof refresh === 'undefined' ? false : refresh);
        let callback = (refresh ? this.getData : null);
        this.setState({showActivities: value}, callback);
    }

    onDeleteActivity(tplActId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;
            JsNx.removeItem(data.template.activities, 'id', tplActId);
            that.setState({data: data});
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteTplAct(tplActId, callback);
        }
    }
}

/*class ModalAssignmentForm extends Component{
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
                <div className='row'>
                    <div className='col-md-6'>
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
                    <div className='col-md-6'>
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
}*/