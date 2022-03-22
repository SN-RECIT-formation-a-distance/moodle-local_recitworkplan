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
import { UserActivityList } from './Components';

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
        this.onCopy = this.onCopy.bind(this);

        this.state = {dataProvider: [], templateId: -1, activeTab: 'ongoing', pagination: {current_page: 1, count: 0, item_per_page: 25}, editTab: 'activities'};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, this.state.activeTab, false, this.getDataResult);
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
        this.setState({activeTab: event.target.value}, this.getData); 
    }

    render(){
        let dataProvider = this.state.dataProvider;
        
        let main = 
            <div>
                <div className='d-flex' style={{justifyContent: "space-between"}}>
                    <div className='d-flex' style={{alignItems: "center"}}>
                        <span className='h1 mr-3'>Plans de travail</span>
                        <Button variant='outline-primary' className='rounded-circle' title='Créer un plan de travail.' onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/></Button>
                    </div>
                    <div>
                        <ToggleButtons name="completionState" onChange={this.onCompletionStateChange} type="radio"  defaultValue={this.state.activeTab} options={
                            [{value: "ongoing", text: "En cours"}, {value: "archive", text: "Archivés"}, {value: "template", text: "Gabarits"}]}/>
                    </div>
                </div> 

                <div style={{display: "grid", gridGap: "1rem", gridTemplateColumns: "auto auto auto"}}>
                    {dataProvider.map((workPlan, index) => {
                            let progress = 0;
                            
                            if(workPlan.stats){
                                progress = workPlan.stats.workPlanCompletion/workPlan.stats.nbStudents * 100;
                            }

                            let card = 
                                <Card key={index} className='rounded'>
                                    <div style={{backgroundColor: '#0f6fc5', width: `${progress}%`, height: '5px', maxWidth: "100%"}}>
                                         
                                    </div>
                                    <Card.Body style={{backgroundColor: "#f0f0f0"}}>
                                        <div className='d-flex' style={{justifyContent: 'space-between'}}>
                                            <a href='#' onClick={() => this.onEdit(workPlan.template.id, 'activities')} className='h3'>{workPlan.template.name}</a>
                                            <DropdownButton variant='outline-primary' title={<span><FontAwesomeIcon icon={faEllipsisV}  />{" "}</span>} id={`optionsWorkPlan${workPlan.template.id}`}>
                                                <Dropdown.Item onClick={() => this.onCopy(workPlan.template.id)}><FontAwesomeIcon icon={faCopy}  />{" Copier"}</Dropdown.Item>
                                                {workPlan.template.state == 1 && <Dropdown.Item onClick={() => this.onCopy(workPlan.template.id, 0)}><FontAwesomeIcon icon={faUser}  />{" Utiliser"}</Dropdown.Item>}
                                                {workPlan.template.state != 1 && <Dropdown.Item onClick={() => this.onCopy(workPlan.template.id, 1)}><FontAwesomeIcon icon={faUser}  />{" Enregistrer en tant que gabarit"}</Dropdown.Item>}
                                                <Dropdown.Item onClick={() => this.onDelete(workPlan.template.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                                                <Dropdown.Item onClick={() => this.onArchive(workPlan)}><FontAwesomeIcon icon={faArchive}  />{" Archiver"}</Dropdown.Item>
                                            </DropdownButton>
                                        </div>
                                        <div className="m-2 p-2">
                                            {workPlan.assignments.map((assignment, index2) => {
                                                return <span key={index2} style={{marginLeft: '-15px'}} dangerouslySetInnerHTML={{__html: assignment.user.avatar}}></span>;
                                            })}
                                            {workPlan.template.state != 1 && <Button variant='outline-primary' className='rounded-circle' title='Attribuer un plan de travail.' onClick={() => this.onEdit(workPlan.template.id, 'assignments')}><FontAwesomeIcon icon={faPlus}/></Button>}
                                        </div>
                                        <div className="m-3 p-2">
                                            {workPlan.stats && workPlan.stats.nbLateStudents > 0 && <Button variant={"danger"}>{`${workPlan.stats.nbLateStudents} apprenants en retard`}</Button>}
                                        </div>  
                                        {workPlan.stats && workPlan.stats.nbStudents > 0 && 
                                            <div className="p-2 text-muted">
                                                <span className='mr-5'>{"Achèvement"}</span><FontAwesomeIcon icon={faCheck}/><span className='ml-2'>{`${workPlan.stats.workPlanCompletion}/${workPlan.stats.nbStudents}`}</span>  
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

        let form = <WorkPlanForm templateId={this.state.templateId} activeTab={this.state.editTab} onClose={this.onClose}/>;


        return (this.state.templateId >= 0 ? form : main);
    }

    onAdd(){
        this.setState({templateId: 0});
    }

    onEdit(templateId, tab){
        this.setState({templateId: templateId, editTab: tab});
    }

    onClose(){
        this.getData();
        this.setState({templateId: -1});
    } 

    onDelete(templateId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

           that.getData();
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteWorkPlan(templateId, callback);
        }
    }

    onArchive(template){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

           that.getData();
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmArchive)){
            let assignments = [];
            for (let a of template.assignments){
                a.completionState = 1;
                assignments.push(a);
            }
            $glVars.webApi.saveAssignment(assignments, callback);
        }
    }

    onCopy(templateId, state){
        let that = this;
        let callback = function(result){
            if(!result.success){
                FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            }
            else{
                FeedbackCtrl.instance.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
                //that.getData();
                that.setState({templateId: result.data.id});
            }
        };

        if(window.confirm($glVars.i18n.tags.msgConfirmClone)){
            $glVars.webApi.cloneTemplate(templateId, state, callback);
        }
    }
}

class WorkPlanForm extends Component{
    static defaultProps = {        
        templateId: 0,
        activeTab: 'activities',
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
        this.onShowAssignments = this.onShowAssignments.bind(this);
        this.onDeleteActivity = this.onDeleteActivity.bind(this);
        this.onDeleteAssignment = this.onDeleteAssignment.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);

        this.state = {tab: this.props.activeTab, data: null, queryStr: "", detail: -1, showActivities: false, showAssignments: false, filter: {late:false}, editModal: false, editAssignment: -1, sortAssignment: 0};
    }

    componentDidMount(){
        this.getData(this.props.templateId);
        if (this.props.templateId == 0){
            this.setState({editModal:true})
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.activeTab !== this.props.activeTab) {
          this.setState({tab:this.props.activeTab});
        }
    }

    getData(templateId){
        $glVars.webApi.getWorkPlanFormKit(templateId, this.getDataResult);
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

        let activityList = this.state.data.template.activities;
        let assignments = this.state.data.assignments;
        let regexp = UtilsString.getRegExp(this.state.queryStr);

        if(this.state.queryStr.length > 0){
            activityList = activityList.filter((item) => {
                return ((item.cmName.search(regexp) >= 0) || (item.categoryName.search(regexp) >= 0) || (item.courseName.search(regexp) >= 0));
            })
        }
        assignments = assignments.filter((item) =>{
            if (this.state.filter.late && item.completionState != 2) return false;
            if(this.state.queryStr.length > 0){
                return ((item.user.firstName.search(regexp) >= 0) || (item.user.lastName.search(regexp) >= 0) || (item.user.groupList.search(regexp) >= 0));
            }
            return true;
        });
        
        assignments = assignments.sort((a,b) =>{
            if (this.state.sortAssignment == 'firstname'){
                return a.user.firstName.localeCompare(b.user.firstName);
            }
            if (this.state.sortAssignment == 'lastname'){
                return a.user.lastName.localeCompare(b.user.lastName);
            }
            if (this.state.sortAssignment == 'progress'){
                let progressValueA = 0;
                if(this.state.data.stats.assignmentcompleted[`userid${a.user.id}`]){
                    progressValueA = this.state.data.stats.assignmentcompleted[`userid${a.user.id}`]/this.state.data.stats.nbActivities * 100;
                }
                let progressValueB = 0;
                if(this.state.data.stats.assignmentcompleted[`userid${b.user.id}`]){
                    progressValueB = this.state.data.stats.assignmentcompleted[`userid${b.user.id}`]/this.state.data.stats.nbActivities * 100;
                }
                if (progressValueA > progressValueB){
                    return -1;
                }
                else if (progressValueA < progressValueB){
                    return 1;
                }
            }
            return 0;
        });

        let nbHoursCompletionTotal = 0;
        let categories = [];
        for (let act of activityList){
            if (!categories.includes(act.categoryName)){
                categories.push(act.categoryName);
            }
            nbHoursCompletionTotal = nbHoursCompletionTotal + parseInt(act.nbHoursCompletion);
        }

        let body =  
            <div>                
                <div className='d-flex mb-4' style={{alignItems: "center"}}>
                    <Button title="Revenir" onClick={this.props.onClose} className='rounded-circle' variant='outline-primary'><FontAwesomeIcon icon={faArrowLeft}/></Button>
                    <span className="h1 ml-3">Plan de travail</span>
                </div>
                <Card>
                    <Card.Body>
                        <div className='h4 mb-4'>Description <Button title="Éditer" variant="outline-primary" className='rounded-circle' onClick={() => this.setState({editModal:true})}><FontAwesomeIcon icon={faPencilAlt}/></Button></div>
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Nom</Col>
                            <Col sm={10} className='border border-secondary p-2 rounded'>{this.state.data.template.name}</Col>
                        </Row>   
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Description</Col>
                            <Col sm={10} className='border border-secondary p-2 rounded'>{this.state.data.template.description}</Col>
                        </Row>                      
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Temps à consacrer</Col>
                            <Col sm={10} className='border border-secondary p-2 rounded'>{`${nbHoursCompletionTotal} heures`}</Col>
                        </Row> 
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Catégories de cours</Col>
                            <Col sm={10} className='border border-secondary p-2 rounded'>
                                {categories.map((item, index) => {
                                    return item + ', '.substring(0,-2);
                                })}
                            </Col>
                        </Row> 
                    </Card.Body>
                </Card>
                    
                <Tabs id="workPlanTabs" className="mt-3" variant="pills" fill  activeKey={this.state.tab} onSelect={this.onTabChange}>
                    <Tab eventKey="activities" title="Activités">
                        <div className='d-flex' style={{justifyContent: "space-between", alignItems: "center"}}>
                            <div className='d-flex' style={{alignItems: "center"}}>
                                <span className='h2 mr-3'>Activités</span>
                                <Button variant='outline-primary' className='rounded-circle' title='Ajouter des activités.' onClick={() => this.onShowActivities(true)} ><FontAwesomeIcon icon={faPlus}/></Button>
                            </div>
                            <div>
                                <Form.Control className='rounded' onChange={this.onSearch} type="search" value={this.state.queryStr} name='queryStr' placeholder="Catégories, cours..."/>
                            </div>
                        </div> 
                        <div>
                            {activityList.map((item, index) => {
                                    let progressValue = 0;
                                    let progressText  = `0/${this.state.data.stats.nbStudents}`;
                                    if(this.state.data.stats.activitycompleted[`cmid${item.cmId}`]){
                                        progressValue = this.state.data.stats.activitycompleted[`cmid${item.cmId}`]/this.state.data.stats.nbStudents * 100;
                                        progressText = `${this.state.data.stats.activitycompleted[`cmid${item.cmId}`]}/${this.state.data.stats.nbStudents}`;
                                    }

                                    progressValue = (isNaN(progressValue) ? 0 : progressValue);
                                    
                                    let card = 
                                        <Card key={index} className='rounded mt-2 mb-2'>
                                            <div style={{backgroundColor: '#0f6fc5', width: `${progressValue}%`, height: '5px'}}>
                                                
                                            </div>
                                            <Card.Body style={{backgroundColor: "#f0f0f0", display: "grid", gridGap: '1rem', gridTemplateColumns: 'auto auto 240px', alignItems: 'center'}}>
                                                <div>
                                                    <div className='h4'><strong><a href={item.cmUrl} target="_blank">{item.cmName}</a></strong></div>
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
                                                    <FontAwesomeIcon icon={faCheck}/><span className='ml-2 mr-3'>{progressText}</span>  
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
                    <Tab eventKey="assignments" title="Affectations" disabled={this.state.data.template.state == 1}>
                        <div className='d-flex' style={{justifyContent: "space-between", alignItems: "center"}}>
                            <div className='d-flex' style={{alignItems: "center"}}>
                                <span className='h2 mr-3'>Affectations</span>
                                <Button variant='outline-primary' className='rounded-circle' title='Attribuer un plan de travail.' onClick={() => this.onShowAssignments(true)} ><FontAwesomeIcon icon={faPlus}/></Button>
                            </div>
                            <div className='d-flex align-items-center' style={{width: "50%", justifyContent: "space-between"}}>
                                <Form.Check style={{display:'inline',marginRight:'10px'}} type="checkbox" onChange={this.onFilterChange} value={this.state.filter.late} name="late" label="Afficher seulement élève en retard"/>
                                <Form.Control className='rounded' style={{display:'inline',width:'200px',marginRight:'10px'}} onChange={this.onSearch} type="search" value={this.state.queryStr} name='queryStr' placeholder="Nom, groupe..."/>
                                Trier par <select type="select" className='form-control rounded' style={{width:'115px',}} onChange={(e) => this.setState({sortAssignment:e.target.value})}>
                                    <option value="lastname">Nom</option>
                                    <option value="firstname">Prénom</option>
                                    <option value="progress">Progrès</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            {assignments.map((item, index) => {
                                    let progressValue = 0;
                                    let progressText  = `0/${this.state.data.stats.nbActivities}`;
                                    if(this.state.data.stats.assignmentcompleted[`userid${item.user.id}`]){
                                        progressValue = this.state.data.stats.assignmentcompleted[`userid${item.user.id}`]/this.state.data.stats.nbActivities * 100;
                                        progressText = `${this.state.data.stats.assignmentcompleted[`userid${item.user.id}`]}/${this.state.data.stats.nbActivities}`;
                                    }
                                    progressValue = (isNaN(progressValue) ? 0 : progressValue);

                                    let card = 
                                        <Card key={index} className='rounded mt-2 mb-2'>
                                            <div style={{backgroundColor: '#0f6fc5', width: `${progressValue}%`, height: '5px'}}>
                                                
                                            </div>
                                            <Card.Body style={{backgroundColor: "#f0f0f0"}}>
                                                <div style={{display: "grid", gridGap: '1rem', gridTemplateColumns: '50px auto auto auto', alignItems: 'center'}}>
                                                    <div>
                                                        <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                                    </div>
                                                    <div>
                                                        <strong>{item.user.firstName}</strong><span  className='ml-3 text-muted'>Groupe:</span><span className='text-muted'>{` ${item.user.groupList}`}</span>
                                                        <div className='text-muted'>Dernière connexion: {item.user.lastAccess}</div>
                                                        <div className='text-muted'>{`Début: ${UtilsDateTime.getDate(item.startDate)} (${item.nbHoursPerWeek} h/semaine)`}</div>
                                                    </div>
                                                    <div>
                                                        {item.completionState > 0 && <Button variant={"danger"}>{`Apprenant en retard`}</Button>}
                                                    </div>
                                                    <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex', justifyContent: 'flex-end'}}>
                                                        <span className='mr-3'>{"Achèvement"}</span>
                                                        <FontAwesomeIcon icon={faCheck}/><span className='ml-2 mr-3'>{progressText}</span>  
                                                        <DropdownButton className='mr-3'variant='outline-primary' title={<span><FontAwesomeIcon icon={faEllipsisV}  />{" "}</span>} id={`optionsAssignments${item.id}`}>
                                                            <Dropdown.Item onClick={() => this.setState({editAssignment:item.id})}><FontAwesomeIcon icon={faPencilAlt}  />{" Modifier"}</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => this.onDeleteAssignment(item.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                                                        </DropdownButton>
                                                        <Button variant='outline-primary' onClick={() => this.onDetail(this.state.detail == item.id ? -1 : item.id)}><FontAwesomeIcon icon={this.state.detail == item.id ? faArrowCircleUp : faArrowCircleDown}/></Button>
                                                    </div>
                                                </div>
                                        {this.state.detail == item.id && 
                                            <div style={{width:'100%'}}>
                                                {this.state.data.template.activities.map((item, index) => {
                                                         return (<UserActivityList data={item} key={index}/>);   
                                                    }
                                                )}
                                            </div>}
                                            </Card.Body>
                                        </Card>
                                    return (card);                                     
                                }
                            )}
                        </div>
                    </Tab>
                </Tabs>  
                {this.state.showActivities && <ActivityPicker templateId={this.state.data.template.id} onClose={(refresh) => this.onShowActivities(false, refresh)}/>}
                {this.state.showAssignments && <ModalAssignmentPicker data={this.state.data} onClose={(refresh) => this.onShowAssignments(false, refresh)}/>}
                {this.state.editAssignment > 1 && <ModalAssignmentForm assignment={this.state.editAssignment} data={this.state.data} onClose={(refresh) => this.onShowAssignments(false, refresh)}/>}
                {this.state.editModal && <ModalTemplateForm data={this.state.data} onClose={() => this.setState({editModal:false})} onDataChange={this.onDataChange} onSave={this.onSaveTemplate}/>}
            </div>
            
        let main = body;

        return (main);
    }
    
    onDetail(id){
        this.setState({detail:id});
    }

    onTabChange(k){
        this.setState({tab: k});
    }

    onFilterChange(e){
        let filter = this.state.filter;
        if (typeof e.target.checked != 'undefined'){
            filter[e.target.name] = e.target.checked;
        }else{
            filter[e.target.name] = e.target.value;
        }
        this.setState({filter:filter});
    }

    onDataChange(event){
        let data = this.state.data;

        if(data.template[event.target.name] !== event.target.value){
            //Exception for state/checkbox
            if (event.target.name === 'state'){
                data.template[event.target.name] = event.target.checked ? 1 : 0;
            }
            else{
                data.template[event.target.name] = event.target.value
            }
            
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
            }
            that.setState({data: data, editModal: false});
        }
        /*if (typeof this.state.data.template.state === 'undefined'){
            this.state.data.template.state = 0;
        }*/
        $glVars.webApi.saveTemplate(this.state.data.template, callback);
    }

    onShowActivities(value, refresh){
        refresh = (typeof refresh === 'undefined' ? false : refresh);
        let callback = (refresh ? () => this.getData(this.state.data.template.id) : null);
        this.setState({showActivities: value}, callback);
    }

    onShowAssignments(value, refresh){
        refresh = (typeof refresh === 'undefined' ? false : refresh);
        let callback = (refresh ? () => this.getData(this.state.data.template.id) : null);
        this.setState({showAssignments: value, editAssignment: -1}, callback);
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

    onDeleteAssignment(assignmentId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;
            JsNx.removeItem(data.assignments, 'id', assignmentId);
            that.setState({data: data});
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteAssignment(assignmentId, callback);
        }
    }

    onSearch(event){
        this.setState({queryStr: event.target.value});
    }
}

class ModalAssignmentPicker extends Component{
    static defaultProps = {        
        data: null,
        onClose: null
    };

    constructor(props){
        super(props);

        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {data: props.data, dropdownLists: {studentList: [], groupList: [], group: null, name: ''}, flags: {dataChanged: false}};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getStudentList(this.state.data.template.id, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let lists = this.state.dropdownLists;
        lists.studentList = result.data;

        lists.groupList = [];
        for (let user of result.data){
            for (let g of user.groupList){
                if (!lists.groupList.includes(g)){
                    lists.groupList.push(g);
                }
            }
        }
        for (let k in lists.groupList){
            lists.groupList[k] = {label: lists.groupList[k], value: lists.groupList[k]};
        }
        lists.groupList.unshift({label: '', value: null});

        this.setState({
            dropdownLists: lists
        });
    }

    getFilteredStudentList(){
        return this.state.dropdownLists.studentList.filter((item) => {
            let found = false;
            for(let assignment of this.state.data.assignments){
                if(parseInt(assignment.user.id, 10) === parseInt(item.userId, 10)){
                    found = true;
                    break;
                }
            }
            let show = true;
            if (found) show = false;
            if (this.state.dropdownLists.group && !item.groupList.includes(this.state.dropdownLists.group)) show = false;
            let fullname = `${item.firstName} ${item.lastName}`;
            if (this.state.dropdownLists.name.length > 1 && !fullname.toLowerCase().includes(this.state.dropdownLists.name.toLowerCase())) show = false;
            return show;
        });
    }

    render(){
        if(this.state.data === null){ return null; }

        let studentList = this.getFilteredStudentList();

        let body = 
            <div>
                <div>
                    <Form.Group as={Col} >
                        <Form.Label>{"Filtrez par groupe"}</Form.Label>
                        <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="group" value={this.state.dropdownLists.group} options={this.state.dropdownLists.groupList} onChange={(e) => this.onFilterChange(e.target.name, e.target.value)} />
                    </Form.Group>
                </div>
                <div className='mt-4 row'>
                    <div className='col-md-6'>
                        <div style={{display: 'flex', alignItems: "center", justifyContent: "space-between"}}>
                            <strong>Liste d'élèves</strong>
                            <Form.Control style={{width:'200px'}} onChange={(e) => this.onFilterChange(e.target.name, e.target.value)}  type="search" value={this.state.dropdownLists.name} name='name' placeholder="Rechercher..."/>
                        </div>
                        
                        <div className='mt-2 mb-2' style={{maxHeight: 500, overflowY: 'auto'}}>
                            <Table striped bordered hover>                                
                                <tbody>
                                    {studentList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                                    <a href={item.userUrl} target="_blank"><span dangerouslySetInnerHTML={{__html: item.avatar}}></span>{`${item.firstName} ${item.lastName}`}</a>
                                                    <Button onClick={() => this.onAdd(item)} variant="link" title="Ajouter"><FontAwesomeIcon icon={faArrowRight}/></Button>
                                                </td>
                                            </tr>

                                            return row;
                                        }
                                    )}
                                    {studentList.length == 0 && <tr><td className='text-muted'>Pas de données</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                        <Button variant="link" onClick={() => this.onAddSelected()}>{"Ajouter tous les utilisateurs "}<FontAwesomeIcon icon={faArrowRight}/></Button>
                    </div>
                    <div className='col-md-6'>
                        <div>
                            <h6>Élèves assignés <Badge variant="warning" className="p-2 rounded">{`${this.state.data.assignments.length}`}</Badge></h6>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>
                                    <tbody>
                                        {this.state.data.assignments.map((item, index) => {
                                                let row =
                                                    <tr key={index}>
                                                        <td>
                                                            <div className='d-flex align-items-center' style={{justifyContent: 'space-between'}}>
                                                                <div className='w-100'>
                                                                    <div>
                                                                        <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                                                        <strong>{`${item.user.firstName} ${item.user.lastName}`}</strong>
                                                                    </div>
                                                                    
                                                                </div>
                                                                <div>
                                                                    <Button variant="link" title="Supprimer" onClick={() => this.onDelete(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                                                </div>
                                                            </div>
                                                        </td>
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
            </div>;

        let main = <Modal title={'Attribuer un plan de travail'} body={body} width="800px" onClose={this.onClose} />;

        return (main);
    }

    onFilterChange(k, v){
        let list = this.state.dropdownLists;
        list[k] = v;
        this.setState({dropdownLists:list});
    }

    createNewAssignment(item){
        let result = {
            id: 0,
            template:{id: this.state.data.template.id},
            user: {id: item.userId, firstName: item.firstName, lastName: item.lastName, avatar: item.avatar},
            nbHoursPerWeek: 0,
            comment: '',
            startDate: new Date()
        };

        return result;
    }

    onAdd(item){
        let newItems = [this.createNewAssignment(item)]
        this.setState({flags: {dataChanged: true}}, () => this.onSave(newItems))
    }

    onAddSelected(){
        let newItems = []
        let studentList = this.getFilteredStudentList();
        for (let item of studentList){
            newItems.push(this.createNewAssignment(item));
        }
        this.setState({flags: {dataChanged: true}}, () => this.onSave(newItems))
    }

    onDelete(assignmentId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;
            JsNx.removeItem(data.assignments, 'id', assignmentId);
            that.setState({data: data, flags: {dataChanged: true}});
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteAssignment(assignmentId, callback);
        }
    }

    onDataChange(event, index){
        let tmp = this.state.data;
        let flags = this.state.flags;
        flags.dataChanged = (tmp.assignments[index][event.target.name] !== event.target.value);
        tmp.assignments[index][event.target.name] = event.target.value;
        this.setState({data: tmp, flags: flags});
    }

    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let index = 0;
            for (let item of data){
                if(parseInt(item.id,10) === 0){
                    item.id = result.data[index];
                    let tmp = that.state.data;
                    tmp.assignments.push(item);
                    that.setState({data: tmp});
                }
                index++;
            }
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.dataChanged);
    }
}

class ModalAssignmentForm extends Component{
    static defaultProps = {        
        data: null,
        onClose: null,
        assignment: null,
    };

    constructor(props){
        super(props);

        this.onClose = this.onClose.bind(this);

        let assignment = 0;
        let index = 0;
        for (let i in props.data.assignments){
            if (props.data.assignments[i].id == props.assignment){
                assignment = props.data.assignments[i];
                index = i;
                break
            }
        }
        if (!assignment.comment) assignment.comment = '';
        this.state = {data: props.data, flags: {dataChanged: false}, assignment:assignment, index:index};
    }


    render(){
        if(this.state.data === null){ return null; }

        let item = this.state.assignment;
        let body = 
            <Form>
                <Form.Group as={Row} >
                    <Form.Label column sm="2">{"Début"}</Form.Label>
                    <Col sm="10">
                        <DateInput value={item.startDate} name="startDate" onChange={(event) => this.onDataChange(event, this.state.index)} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"Commentaire"}</Form.Label>
                    <Col sm="10">
                        <Form.Control as="textarea" rows={4} className='w-100' name="comment" value={item.comment} onChange={(event) => this.onDataChange(event, this.state.index)}/>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"h/semaine"}</Form.Label>
                    <Col sm="10">
                        <Form.Control style={{width: '50px', display: 'inline'}} className="mr-3" type="text" value={item.nbHoursPerWeek} name="nbHoursPerWeek" onChange={(event) => this.onDataChange(event, this.state.index)} />
                    </Col>
                </Form.Group>
            </Form>;

        let modalFooter = 
        <ButtonGroup>
                <Button variant='secondary' onClick={this.onClose}>Annuler</Button>
                <Button disabled={!this.state.flags.dataChanged} variant='success' className='ml-2' onClick={() => {this.onSave([item]);}}>Enregistrer</Button>
        </ButtonGroup>;


        let main = <Modal title={'Modifier élève'} body={body} footer={modalFooter} width="800px" onClose={this.onClose} />;

        return (main);
    }

    onDataChange(event, index){
        let tmp = this.state.data;
        let flags = this.state.flags;
        flags.dataChanged = (tmp.assignments[index][event.target.name] !== event.target.value);
        tmp.assignments[index][event.target.name] = event.target.value;
        this.setState({data: tmp, flags: flags});
    }

    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let index = 0;
            for (let item of data){
                if(parseInt(item.id,10) === 0){
                    item.id = result.data[index];
                    let tmp = that.state.data;
                    tmp.assignments.push(item);
                    that.setState({data: tmp});
                }
                index++;
            }

            that.onClose();
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.dataChanged);
    }
}