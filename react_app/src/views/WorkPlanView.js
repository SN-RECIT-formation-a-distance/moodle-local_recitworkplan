import React, { Component } from 'react';
import { Card, Tabs, Tab, Button, Form, DropdownButton, Dropdown} from 'react-bootstrap';
import { faPencilAlt,  faPlus, faTrashAlt, faCopy, faCheck, faArrowLeft, faEllipsisV, faSyncAlt, faBookmark, faChevronUp, faChevronDown, faArchive, faUser, faChalkboardTeacher} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FeedbackCtrl, ToggleButtons } from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime, WorkPlanUtils } from '../libs/utils/Utils';
import { Pagination } from '../libs/components/Pagination';
import {ActivityPicker, WorkPlanTemplateView} from './TemplateView';
import { UserActivityList } from './Components';
import { ModalAssignmentPicker, ModalAssignmentForm } from './AssignmentView';

export class AdminView extends Component {
    render() {       
        let main = <WorkPlanListView />;

        return (main);
    }
}

class WorkPlanListView extends Component{
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
                <div className='d-flex d-block-mobile' style={{justifyContent: "space-between"}}>
                    <div className='d-flex' style={{alignItems: "center"}}>
                        <span className='h1 mr-3'>Plans de travail</span>
                        <Button variant='outline-primary' className='rounded-circle' title='Créer un plan de travail.' onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/></Button>
                    </div>
                    <div>
                        <ToggleButtons name="completionState" onClick={this.onCompletionStateChange} type="radio" defaultValue={this.state.activeTab} options={[
                            {value: "ongoing", text: <span><FontAwesomeIcon icon={faSyncAlt} />{" En cours"}</span>}, 
                            {value: "archive", text:  <span><FontAwesomeIcon icon={faArchive} />{" Archivés"}</span>}, 
                            {value: "template", text: <span><FontAwesomeIcon icon={faBookmark} />{" Gabarits"}</span>},
                            {value: "manager", text: <span><FontAwesomeIcon icon={faChalkboardTeacher} />{" Gestionnaire"}</span>},
                            ]}/>
                    </div>
                </div> 

                <div className='grid-3'>
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
                                                {workPlan.template.state == 1 && <Dropdown.Item onClick={() => this.onCopy(workPlan.template.id, 0)}><FontAwesomeIcon icon={faBookmark}  />{" Utiliser ce gabarit"}</Dropdown.Item>}
                                                {workPlan.template.state != 1 && <Dropdown.Item onClick={() => this.onCopy(workPlan.template.id, 1)}><FontAwesomeIcon icon={faBookmark}  />{" Enregistrer en tant que gabarit"}</Dropdown.Item>}
                                                <Dropdown.Item onClick={() => this.onDelete(workPlan.template.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                                                {workPlan.assignments.length > 0 && JsNx.getItem(workPlan.assignments, 'completionState', 1, null) === null &&  <Dropdown.Item onClick={() => this.onArchive(workPlan)}><FontAwesomeIcon icon={faArchive}  />{" Archiver"}</Dropdown.Item>}
                                            </DropdownButton>
                                        </div>
                                        <div className="m-2 p-2">
                                            {workPlan.assignments.map((assignment, index2) => {
                                                return <span key={index2} style={{marginLeft: '-15px'}} dangerouslySetInnerHTML={{__html: assignment.user.avatar}}></span>;
                                            })}
                                            {workPlan.template.state != 1 && <Button variant='outline-primary' className='rounded-circle' title='Attribuer un plan de travail.' onClick={() => this.onEdit(workPlan.template.id, 'assignments')}><FontAwesomeIcon icon={faPlus}/></Button>}
                                        </div>
                                        <div className="m-3 p-2">
                                            {workPlan.stats && workPlan.stats.nbLateStudents > 0 && <span className='badge bg-danger'>{`${workPlan.stats.nbLateStudents} apprenants en retard`}</span>}
                                        </div>  
                                        {workPlan.stats && workPlan.stats.nbStudents > 0 && 
                                            <div className="p-2 text-muted row">
                                                <div className='col-md-6'>
                                                    <span title="Le nombre d'élèves qui ont complété le plan de travail / le nombre total d'élèves assigné au plan de travail">{"Achèvement "}<FontAwesomeIcon icon={faCheck}/></span><span className='ml-2'>{`${workPlan.stats.workPlanCompletion}/${workPlan.stats.nbStudents}`}</span>
                                                </div>
                                                <div className='col-md-6' style={{textAlign:'right'}}>
                                                    {this.state.activeTab == 'manager' && 
                                                        <span>
                                                            <div dangerouslySetInnerHTML={{__html: workPlan.template.creator.avatar}}></div>
                                                            <span>Créateur</span>
                                                        </span>
                                                        }
                                                </div>
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

        let form = <WorkPlanView templateId={this.state.templateId} activeTab={this.state.editTab} onClose={this.onClose}/>;


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

class WorkPlanView extends Component{
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

        this.state = {tab: this.props.activeTab, data: null};
    }

    componentDidMount(){
        this.getData(this.props.templateId);
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

        let main =  
            <div>                
                <div className='d-flex mb-4' style={{alignItems: "center"}}>
                    <Button title="Revenir" onClick={this.props.onClose} className='rounded-circle' variant='outline-primary'><FontAwesomeIcon icon={faArrowLeft}/></Button>
                    <span className="h1 ml-3">Plan de travail</span>
                </div>

                <WorkPlanTemplateView data={this.state.data} onSave={this.onSaveTemplate} />
                    
                <Tabs id="workPlanTabs" className="mt-3 bg-light" variant="pills" fill  activeKey={this.state.tab} onSelect={this.onTabChange}>
                    <Tab eventKey="activities" title="Activités">
                       <WorkPlanActivitiesView data={this.state.data} onRefresh={() => this.getData(this.state.data.template.id)}/>
                    </Tab>
                    <Tab eventKey="assignments" title="Affectations" disabled={this.state.data.template.state == 1}>
                        <WorkPlanAssignmentsView data={this.state.data} onRefresh={() => this.getData(this.state.data.template.id)}/>
                    </Tab>
                </Tabs>  
            </div>
            
        return (main);
    }
    
    onTabChange(k){
        this.setState({tab: k});
    }

    onSaveTemplate(template){
        let data = this.state.data;
        data.template = template;
        this.setState({data: data});
    }
}

class WorkPlanAssignmentsView extends Component{
    static defaultProps = {        
        data: [],
        onRefresh: null
    };

    constructor(props){
        super(props);

        this.onShowAssignments = this.onShowAssignments.bind(this);
        this.onDeleteAssignment = this.onDeleteAssignment.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);

        this.state = {queryStr: "", detail: -1, showAssignments: false, filter: {late:false}, editAssignment: null, sortAssignment: 0};
    }

    render(){
        let data = this.props.data;
        let assignments = data.assignments;

        let regexp = UtilsString.getRegExp(this.state.queryStr);

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
            if (this.state.sortAssignment == 'enddate'){
                if (!a.endDate || !b.endDate) return 0;
                return a.endDate.localeCompare(b.endDate);
            }
            if (this.state.sortAssignment == 'progress'){
                let progressValueA = 0;
                if(data.stats.assignmentcompleted[`${a.user.id}`]){
                    progressValueA = data.stats.assignmentcompleted[`${a.user.id}`]/data.stats.nbActivities * 100;
                }
                let progressValueB = 0;
                if(data.stats.assignmentcompleted[`${b.user.id}`]){
                    progressValueB = data.stats.assignmentcompleted[`${b.user.id}`]/data.stats.nbActivities * 100;
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

        let main =  
            <>                
                <div className='d-flex d-block-mobile' style={{justifyContent: "space-between", alignItems: "center"}}>
                    <div className='d-flex' style={{alignItems: "center"}}>
                        <span className='h2 mr-3'>Affectations</span>
                        <Button variant='outline-primary' className='rounded-circle' title='Attribuer un plan de travail.' onClick={() => this.onShowAssignments(true)} ><FontAwesomeIcon icon={faPlus}/></Button>
                    </div>
                    <div className='d-flex align-items-center d-block-mobile w-100-mobile' style={{width: "60%", justifyContent: "space-between"}}>
                        Filtrer par <Form.Control className='rounded w-100-mobile' style={{display:'inline',width:'200px',marginRight:'10px'}} onChange={this.onSearch} type="search" value={this.state.queryStr} name='queryStr' placeholder="Nom, groupe..."/>
                        Trier par <select type="select" className='form-control rounded' style={{width:'115px',}} onChange={(e) => this.setState({sortAssignment:e.target.value})}>
                            <option value="lastname">Nom</option>
                            <option value="firstname">Prénom</option>
                            <option value="progress">Progrès</option>
                            <option value="enddate">Date d'échéance</option>
                        </select>
                        <Form.Check style={{display:'inline',marginLeft:'10px'}} type="checkbox" onChange={this.onFilterChange} value={this.state.filter.late} name="late" label="Afficher seulement les élèves en retard"/>
                    </div>
                </div>

                <div>
                    {assignments.map((item, index) => {
                            let progressValue = {text: '', value: 0};
                            let progressText  = `0/${data.stats.nbActivities}`;
                            if(data.stats.assignmentcompleted[`${item.user.id}`]){
                                progressValue = WorkPlanUtils.getAssignmentProgress(data.template.activities, item);
                                progressText = `${data.stats.assignmentcompleted[`${item.user.id}`]}/${data.stats.nbActivities}`;
                            }
                            
                            let nbHoursCompletionTotal = 0;
                            for (let act of this.props.data.template.activities){
                                nbHoursCompletionTotal = nbHoursCompletionTotal + parseFloat(act.nbHoursCompletion);
                            }
                            let nbWeeks = Math.ceil(nbHoursCompletionTotal / item.nbHoursPerWeek);

                            let card = 
                                <Card key={index} className='rounded mt-2 mb-2'>
                                    <div title={`${progressValue.text}`} style={{backgroundColor: '#0f6fc5', width: `${progressValue.value}%`, height: '5px'}}>
                                        
                                    </div>
                                    <Card.Body className='bg-light'>
                                        <div className='grid-assignments'>
                                            <div>
                                                <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                            </div>
                                            <div>
                                                <strong>{item.user.firstName}</strong><span  className='ml-3 text-muted'>Groupe:</span><span className='text-muted'>{` ${item.user.groupList}`}</span>
                                                <div className='text-muted'>Dernière connexion: {item.user.lastAccess}</div>
                                                <div className='text-muted'>{`Début: ${UtilsDateTime.getDate(item.startDate)} (${item.nbHoursPerWeek} h/semaine)`}</div>
                                                <div className='text-muted'>{`Durée: ${nbWeeks} semaines`}</div>
                                                <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(item.endDate)}`}</div>
                                            </div>
                                            <div>
                                                {item.completionState == 0 && <span className='badge bg-success'>{`En cours`}</span>}
                                                {item.completionState == 1 && <span className='badge bg-secondary'>{`Archivé`}</span>}
                                                {item.completionState == 2 && <span className='badge bg-danger'>{`Apprenant en retard`}</span>}
                                                {item.completionState == 3 && <span className='badge bg-success'>{`Complété`}</span>}
                                            </div>
                                            <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex', justifyContent: 'flex-end'}}>
                                                <span title="Le nombre d'affectations complétées / le nombre d'activités" className='mr-3'>{"Achèvement "}<FontAwesomeIcon icon={faCheck}/></span>
                                                <span className='ml-2 mr-3'>{progressText}</span>  
                                                <DropdownButton className='mr-3'variant='outline-primary' title={<span><FontAwesomeIcon icon={faEllipsisV}  />{" "}</span>} id={`optionsAssignments${item.id}`}>
                                                    <Dropdown.Item onClick={() => this.setState({editAssignment: item})}><FontAwesomeIcon icon={faPencilAlt}  />{" Modifier"}</Dropdown.Item>
                                                    <Dropdown.Item onClick={() => this.onDeleteAssignment(item.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                                                </DropdownButton>
                                            </div>
                                        </div>
                                        <div className='mt-3 d-flex align-items-center'>
                                            <strong>{"Activités"}</strong>
                                            <Button variant='link'  onClick={() => this.onDetail(this.state.detail == item.id ? -1 : item.id)}><FontAwesomeIcon icon={this.state.detail == item.id ? faChevronUp : faChevronDown}/></Button>
                                        </div>  
                                        {this.state.detail == item.id && 
                                            <div style={{width:'100%'}}>
                                                {data.template.activities.map((act, index) => {
                                                        return (<UserActivityList user={item.user} data={act} key={index}/>);   
                                                    }
                                                )}
                                        </div>}
                                    </Card.Body>
                                </Card>
                            return (card);                                     
                        }
                    )}
                </div>
                {this.state.showAssignments && <ModalAssignmentPicker data={data} onClose={(refresh) => this.onShowAssignments(false, refresh)}/>}
                {this.state.editAssignment !== null && <ModalAssignmentForm data={this.state.editAssignment} onClose={(refresh) => this.onShowAssignments(false, refresh)}/>}
            </>
            
        return (main);
    }
    
    onDetail(id){
        this.setState({detail:id});
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

    onShowAssignments(value, refresh){
        refresh = (typeof refresh === 'undefined' ? false : refresh);
        let callback = (refresh ? this.props.onRefresh : null);
        this.setState({showAssignments: value, editAssignment: null}, callback);
    }

    onDeleteAssignment(assignmentId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            that.props.onRefresh();
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteAssignment(assignmentId, callback);
        }
    }

    onSearch(event){
        this.setState({queryStr: event.target.value});
    }
}

class WorkPlanActivitiesView extends Component{
    static defaultProps = {        
        data: [],
        onRefresh: null
    };

    constructor(props){
        super(props);

        this.onSearch = this.onSearch.bind(this);
        this.onShowActivities = this.onShowActivities.bind(this);
        this.onDeleteActivity = this.onDeleteActivity.bind(this);

        this.state = {queryStr: "", showActivities: false};
    }

    render(){
        if(this.props.data === null){return null;}

        let activityList = this.props.data.template.activities;
        let stats = this.props.data.stats;
        let template = this.props.data.template

        let regexp = UtilsString.getRegExp(this.state.queryStr);

        if(this.state.queryStr.length > 0){
            activityList = activityList.filter((item) => {
                return ((item.cmName.search(regexp) >= 0) || (item.categoryName.search(regexp) >= 0) || (item.courseName.search(regexp) >= 0));
            })
        }
        
        let main =  
            <>                
                <div className='d-flex' style={{justifyContent: "space-between", alignItems: "center"}}>
                    <div className='d-flex' style={{alignItems: "center"}}>
                        <span className='h2 mr-3'>Activités</span>
                        <Button variant='outline-primary' className='rounded-circle' title='Ajouter des activités.' onClick={() => this.onShowActivities(true)} ><FontAwesomeIcon icon={faPlus}/></Button>
                    </div>
                    <div>
                        Filtrer par <Form.Control style={{width: '300px', display: 'inline-block'}} className='rounded' onChange={this.onSearch} type="search" value={this.state.queryStr} name='queryStr' placeholder="Catégories, cours..."/>
                    </div>
                </div> 
                <div>
                    {activityList.map((item, index) => {
                            let progressValue = 0;
                            let progressText  = `0/${stats.nbStudents}`;
                            if(stats.activitycompleted[`${item.cmId}`]){
                                progressValue = stats.activitycompleted[`${item.cmId}`]/stats.nbStudents * 100;
                                progressText = `${stats.activitycompleted[`${item.cmId}`]}/${stats.nbStudents}`;
                            }

                            let actStats = this.getActivityStats(item);

                            progressValue = (isNaN(progressValue) ? 0 : Math.round(progressValue,1));
                            
                            let card = 
                                <Card key={index} className='rounded mt-2 mb-2'>
                                    <div title={`${progressValue}% (le nombre d'activités complètes / le nombre d'élèves)`} style={{backgroundColor: '#0f6fc5', width: `${progressValue}%`, height: '5px'}}>
                                        
                                    </div>
                                    <Card.Body className='grid-activity bg-light'>
                                        <div>
                                            <div className='h4'><strong><a href={item.cmUrl} target="_blank">{item.cmName}</a></strong></div>
                                            <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                                            <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                                        </div>
                                        <div className="m-3 p-2">
                                            {template.followUps.map((followUps, index2) => {
                                                return <Button key={index2} variant={followUps.variant}>{followUps.desc}</Button>;
                                            })}
                                            {actStats.nbAwaitingGrade > 0 && <span className='badge bg-warning'>{actStats.nbAwaitingGrade} travaux à corriger</span>}
                                            {actStats.nbFails > 0 && <span className='badge bg-warning'>{actStats.nbFails} risques d'échec</span>}
                                        </div>
                                        <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                                            <span title="Le nombre d'activités complètés / le nombre d'élèves" className='mr-3'>{"Achèvement "} <FontAwesomeIcon icon={faCheck}/></span>
                                            <span className='ml-2 mr-3'>{progressText}</span>  
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
                {this.state.showActivities && <ActivityPicker templateId={template.id} onClose={(refresh) => this.onShowActivities(false, refresh)}/>}
            </>                                                   
            
        return (main);
    }

    getActivityStats(activity){
        let nbAwaitingGrade = 0;
        let nbFails = 0;
        for (let assignment of this.props.data.assignments){
            for (let act of assignment.user.activities){
                if (act.cmId == activity.cmId){
                    if (act.followup == 1){
                        nbAwaitingGrade++;
                    }
                    if (act.completionState == 3){
                        nbFails++;
                    }
                }
            }
        }
        return {nbAwaitingGrade:nbAwaitingGrade, nbFails:nbFails};
    }

    onShowActivities(value, refresh){
        refresh = (typeof refresh === 'undefined' ? false : refresh);
        let callback = (refresh ? this.props.onRefresh : null);
        this.setState({showActivities: value}, callback);
    }

    onDeleteActivity(tplActId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            that.props.onRefresh();
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteTplAct(this.props.data.template.id, tplActId, callback);
        }
    }

    onSearch(event){
        this.setState({queryStr: event.target.value});
    }
}
