import React, { Component } from 'react';
import { Card, Tabs, Tab, Button, Form, DropdownButton, Dropdown, ButtonGroup, ToggleButtonGroup, ToggleButton} from 'react-bootstrap';
import { faPencilAlt,  faPlus, faTrashAlt, faCopy, faCheck, faArrowLeft, faEllipsisV, faSyncAlt, faBookmark, faChevronUp, faChevronDown, faArchive, faChalkboardTeacher, faRedoAlt, faUserFriends, faUserAltSlash, faUserAlt} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FeedbackCtrl, ToggleButtons, Modal } from '../libs/components/Components';
import {$glVars, WorkPlanUtils} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime } from '../libs/utils/Utils';
import { Pagination } from '../libs/components/Pagination';
import {ActivityPicker, WorkPlanTemplateView} from './TemplateView';
import { UserActivityList, CustomCard, CustomHeader, CustomButton, CustomBadge, CustomBadgeCompletion, CustomFormControl, FollowUpCard, AssignmentFollowUp  } from './Components';
import { ModalAssignmentPicker, ModalAssignmentForm } from './AssignmentView';
import {StudentWorkPlanList} from './StudentView';

export class AdminView extends Component {

    static defaultProps = {
        workPlanId: 0
    }
    render() {       
        let main = <WorkPlanListView workPlanId={this.props.workPlanId} />;

        return (main);
    }
}

export class WorkPlanListView extends Component{
    static defaultProps = {
        workPlanId: 0
    };

    constructor(props){
        super(props);
        
        this.onAdd = this.onAdd.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onArchive = this.onArchive.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onCompletionStateChange = this.onCompletionStateChange.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onCopy = this.onCopy.bind(this);

        this.state = {dataProvider: [], templateId: -1, activeTab: 'ongoing', pagination: {current_page: 1, count: 0, item_per_page: 25}, editTab: 'activities'};
        
        if (props.workPlanId > 0){
            this.state.templateId = props.workPlanId;
        }
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, this.state.activeTab, false, 0, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let pagination = this.state.pagination;
        pagination.current_page = parseInt(result.data.current_offset) + 1; 
        pagination.count = parseInt(result.data.total_count);
        this.setState({dataProvider: result.data.items, pagination: pagination}); 
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
                <CustomHeader title="Plans de travail" btnAfter={<CustomButton title='Créer un plan de travail.' onClick={this.onAdd} ><FontAwesomeIcon icon={faPlus}/></CustomButton>}>
                    <ToggleButtons name="completionState" onClick={this.onCompletionStateChange} type="radio" defaultValue={this.state.activeTab} options={[
                            {value: "ongoing", text: <span><FontAwesomeIcon icon={faSyncAlt} />{" En cours"}</span>}, 
                            {value: "archive", text:  <span><FontAwesomeIcon icon={faArchive} />{" Archivés"}</span>}, 
                            {value: "template", text: <span><FontAwesomeIcon icon={faBookmark} />{" Gabarits"}</span>},
                            {value: "manager", text: <span><FontAwesomeIcon icon={faChalkboardTeacher} />{" Gestionnaire"}</span>},
                            ]}/>
                </CustomHeader>

                <div className='tiles'>
                    {dataProvider.map((workPlan, index) => {
                            let progress = '0';
                            
                            if(workPlan.stats && workPlan.stats.nbStudents > 0){
                                progress = workPlan.stats.workPlanCompletion/workPlan.stats.nbStudents * 100;
                            }

                            let card = <WorkPlanCard key={index} data={workPlan} progress={progress} onCopy={this.onCopy} onDelete={this.onDelete} onEdit={this.onEdit} onArchive={this.onArchive}/>;
                                
                            return (card);                                     
                        }
                    )}
                </div>

                {false && <Pagination pagination={this.state.pagination} onChangePage={(p) => this.changePage(p)}/>}                
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

class WorkPlanCard extends Component{
    static defaultProps = {        
        data: null,
        onEdit: null,
        onCopy: null,
        onDelete: null,
        onArchive: null,
        progress: ''
    };

    render(){
        let workPlan = this.props.data;

        let main =
            <CustomCard progressText={`${this.props.progress}%`} progressValue={`${this.props.progress}%`}>
                <div className='d-flex mb-2' style={{justifyContent: 'space-between'}}>
                    <a href='#' onClick={() => this.props.onEdit(workPlan.template.id, 'activities')} className='h4'>{workPlan.template.name}</a>
                    <ButtonGroup>
                        <DropdownButton bsPrefix='rounded btn btn-sm btn-outline-primary' variant='' title={<FontAwesomeIcon icon={faEllipsisV} />} id={`optionsWorkPlan${workPlan.template.id}`}>
                            <Dropdown.Item onClick={() => this.props.onCopy(workPlan.template.id)}><FontAwesomeIcon icon={faCopy}  />{" Copier"}</Dropdown.Item>
                            {workPlan.template.state == 1 && <Dropdown.Item onClick={() => this.props.onCopy(workPlan.template.id, 0)}><FontAwesomeIcon icon={faBookmark}  />{" Utiliser ce gabarit"}</Dropdown.Item>}
                            {workPlan.template.state != 1 && <Dropdown.Item onClick={() => this.props.onCopy(workPlan.template.id, 1)}><FontAwesomeIcon icon={faBookmark}  />{" Enregistrer en tant que gabarit"}</Dropdown.Item>}
                            <Dropdown.Item onClick={() => this.props.onDelete(workPlan.template.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                            {workPlan.assignments.length > 0 && !WorkPlanUtils.isArchived(JsNx.at(workPlan.assignments, 0, null)) &&  <Dropdown.Item onClick={() => this.props.onArchive(workPlan)}><FontAwesomeIcon icon={faArchive}  />{" Archiver"}</Dropdown.Item>}
                        </DropdownButton>
                    </ButtonGroup>
                </div>
                {workPlan.stats && workPlan.stats.nbStudents > 0 && 
                    <div className="p-2 text-muted row">                        
                        <div className='col-md-5' >
                            <span>
                                <div dangerouslySetInnerHTML={{__html: workPlan.template.creator.avatar}}></div>
                                <span>Créateur {workPlan.template.collaboratorList.length > 0 && <FontAwesomeIcon icon={faUserFriends} title={`Collaborateurs: ${workPlan.template.collaboratorList[0].firstName} ${workPlan.template.collaboratorList[0].lastName} et plus`}/>} </span>
                            </span>
                        </div>
                        <div className='col-md-7 d-flex align-items-center'>
                            <CustomBadgeCompletion title="Le nombre d'élèves qui ont complété le plan de travail / le nombre total d'élèves assigné au plan de travail" stats={`${workPlan.stats.workPlanCompletion}/${workPlan.stats.nbStudents}`}/>
                        </div>
                    </div>
                }
                <div className="m-2 p-2">
                    {workPlan.assignments.map((assignment, index2) => {
                        return <span key={index2} style={{marginLeft: '-15px'}} dangerouslySetInnerHTML={{__html: assignment.user.avatar}}></span>;
                    })}
                    {workPlan.template.state != 1 && !WorkPlanUtils.isArchived(JsNx.at(workPlan.assignments, 0, null)) && <CustomButton title='Attribuer un plan de travail.'  onClick={() => this.props.onEdit(workPlan.template.id, 'assignments')} faIcon={faPlus}/>}
                </div>
                {!WorkPlanUtils.isArchived(JsNx.at(workPlan.assignments, 0, null)) &&
                    <div className="m-3 p-2">
                        <FollowUpCard templateId={workPlan.template.id}/>
                    </div>
                }
            </CustomCard>;

        return main;
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
        $glVars.webApi.getWorkPlanFormKit(templateId, false, this.getDataResult);
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
                <CustomHeader title="Modifier le plan de travail" btnBefore={<CustomButton title="Revenir" onClick={this.props.onClose} faIcon={faArrowLeft}/>}>
                    {this.state.data.template.state == 1 && <CustomBadge variant='bg-warning' faIcon={faBookmark} text={"Gabarit"}/>}
                </CustomHeader>

                <WorkPlanTemplateView data={this.state.data} onSave={this.onSaveTemplate} />
                    
                <Tabs id="workPlanTabs" className="mt-3 bg-light" variant="pills" fill  activeKey={this.state.tab} onSelect={this.onTabChange}>
                    <Tab eventKey="activities" title="Activités">
                       <WorkPlanActivitiesView data={this.state.data} onClose={this.props.onClose} onRefresh={() => this.getData(this.state.data.template.id)}/>
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
        this.getData(template.id);
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

        this.state = {queryStr: "", detail: -1, showAssignments: false, filter: ['late','ongoing'], editAssignment: null, sortAssignment: 0, showUser: null};
    }

    render(){
        let data = this.props.data;
        let assignments = data.assignments;

        let regexp = UtilsString.getRegExp(this.state.queryStr);

        assignments = assignments.filter((item) =>{
            if (!this.state.filter.includes('late') && item.completionState == 2) return false;
            if (!this.state.filter.includes('ongoing') && item.completionState == 0) return false;
            if (!this.state.filter.includes('inactive') && item.completionState == 4) return false;
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

        let filters = [];
        if (this.countFlag(2) > 0){
            filters.push({value:'late', text: 'En retard ('+this.countFlag(2)+')'});
        }
        if (this.countFlag(0) > 0){
            filters.push({value:'ongoing', text: 'En cours ('+this.countFlag(0)+')'});
        }
        if (this.countFlag(4) > 0){
            filters.push({value:'inactive', text: 'Inactif ('+this.countFlag(4)+')'});
        }

        let main =  
            <>     
                <CustomHeader title="Affectations" btnAfter={<CustomButton  disabled={WorkPlanUtils.isArchived(JsNx.at(data.assignments, 0, null))} title='Attribuer un plan de travail.'  onClick={() => this.onShowAssignments(true)}><FontAwesomeIcon icon={faPlus}/></CustomButton>}>
                    <div className='d-flex align-items-center d-block-mobile w-100-mobile' >
                        Filtrer par <CustomFormControl className='w-100-mobile' style={{display:'inline',width:'200px',marginRight:'10px', marginLeft:'10px'}} onChange={this.onSearch} type="search" value={this.state.queryStr} name='queryStr' placeholder="Nom, groupe..."/>
                        Trier par <select type="select" className='form-control rounded ml-2 mr-2' style={{width:'115px'}} onChange={(e) => this.setState({sortAssignment:e.target.value})}>
                            <option value="lastname">Nom</option>
                            <option value="firstname">Prénom</option>
                            <option value="progress">Progrès</option>
                            <option value="enddate">Date d'échéance</option>
                        </select>
                        <ToggleButtons className='ml-2' type="checkbox" defaultValue={this.state.filter} onChange={this.onFilterChange} options={filters}/>
                    </div>
                </CustomHeader>            

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
                            let txtDuration = (item.nbHoursPerWeek > 0 ? `${Math.ceil(nbHoursCompletionTotal / item.nbHoursPerWeek)} semaines` : '');

                            let card = 
                                <CustomCard key={index} progressText={progressValue.text} progressValue={`${progressValue.value}%`}>
                                    <div className='grid-assignments'>
                                        <div>
                                            <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                        </div>
                                        <div>
                                            <a href='#' onClick={() => this.onOpenStudentView(item.user)}><strong>{item.user.firstName}</strong></a>
                                            <span  className='ml-3 text-muted'>Groupe:</span><span className='text-muted'>{` ${item.user.groupList}`}</span>
                                            <div className='text-muted'>Dernière connexion: {item.user.lastAccess}</div>
                                            <div className='text-muted'>{`Début: ${UtilsDateTime.getDate(item.startDate)} (${item.nbHoursPerWeek} h/semaine)`}</div>
                                            <div className='text-muted'>{`Durée: ${txtDuration}`}</div>
                                            <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(item.endDate)}`}</div>
                                        </div>
                                        <div className='w-100-mobile'>
                                            <AssignmentFollowUp data={item} template={this.props.data.template}/>
                                        </div>
                                        <div className="p-2 text-muted d-flex" style={{alignItems: 'center', justifyContent: 'flex-end'}}>
                                            <CustomBadgeCompletion title="Le nombre d'affectations complétées / le nombre d'activités avec une durée plus grande que 0" stats={progressText}/>
                                            <DropdownButton disabled={WorkPlanUtils.isArchived(JsNx.at(data.assignments, 0, null))} className='mr-3' bsPrefix='rounded btn btn-sm btn-outline-primary' variant='' title={<span><FontAwesomeIcon icon={faEllipsisV}  />{" "}</span>} id={`optionsAssignments${item.id}`}>
                                                <Dropdown.Item onClick={() => this.setState({editAssignment: item})}><FontAwesomeIcon icon={faPencilAlt}  />{" Modifier"}</Dropdown.Item>
                                                <Dropdown.Item onClick={() => this.onSetInactiveAssignment(item)}>
                                                    {item.completionState == 4 ? 
                                                        <><FontAwesomeIcon icon={faUserAlt}  />{"  Mettre actif"}</>
                                                         : 
                                                        <><FontAwesomeIcon icon={faUserAltSlash}  />{" Mettre inactif"}</>
                                                    }
                                                    </Dropdown.Item>
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
                                                    return (<UserActivityList isTeacher={true} user={item.user} data={act} key={index}/>);   
                                                }
                                            )}
                                    </div>}
                                </CustomCard>

                            return (card);                                     
                        }
                    )}
                </div>
                {this.state.showAssignments && <ModalAssignmentPicker data={data} onClose={(refresh) => this.onShowAssignments(false, refresh)}/>}
                {this.state.editAssignment !== null && <ModalAssignmentForm data={this.state.editAssignment} onClose={(refresh) => this.onShowAssignments(false, refresh)}/>}
            </>;

            let studentView = null;

            if(this.state.showUser !== null){
                let body =  
                <div>
                    <div className='mb-4 p-2' style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div className='mt2 d-flex align-items-center'>
                            <span dangerouslySetInnerHTML={{__html: this.state.showUser.avatar}}></span>
                            <span className='h2'>{`${this.state.showUser.firstName} ${this.state.showUser.lastName}`}</span>
                        </div>
                    </div>
                    <StudentWorkPlanList userId={this.state.showUser.id}/>
                </div>;

                studentView = <Modal title={`Plan de travail de l'élève`} body={body} style={{maxWidth:900, width:'auto'}} onClose={() => this.onOpenStudentView(null)} />;
                   
            }
                
            
        return (studentView ? studentView : main);
    }

    countFlag(flag){
        let count = 0;
        let data = this.props.data;
        let assignments = data.assignments;
        for (let a of assignments){
            if (a.completionState == flag){
                count++;
            }
        }
        return count;
    }

    onSetInactiveAssignment(item){
        let assignments = [];
        item.completionState = item.completionState == 4 ? 0 : 4;
        assignments.push(item);
        let callback = (this.props.onRefresh ? this.props.onRefresh : null);
        $glVars.webApi.saveAssignment(assignments, callback);
    }
    
    onDetail(id){
        this.setState({detail:id});
    }

    onFilterChange(e){
        this.setState({filter:e.target.value});
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
    
    onOpenStudentView(user){
        this.setState({showUser: user});
    }
}

class WorkPlanActivitiesView extends Component{
    static defaultProps = {        
        data: [],
        onRefresh: null,
        onClose: null,
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
        let template = this.props.data.template;
        if(this.props.data.stats === null){return null;}

        let regexp = UtilsString.getRegExp(this.state.queryStr);

        if(this.state.queryStr.length > 0){
            activityList = activityList.filter((item) => {
                return ((item.cmName.search(regexp) >= 0) || (item.categoryName.search(regexp) >= 0) || (item.courseName.search(regexp) >= 0));
            })
        }
        
        let main =  
            <>      
                <CustomHeader title="Activités" btnAfter={<CustomButton  disabled={WorkPlanUtils.isArchived(JsNx.at(this.props.data.assignments, 0, null))} title='Ajouter des activités.'  onClick={() => this.onShowActivities(true)}><FontAwesomeIcon icon={faPlus}/></CustomButton>}>
                    <div>
                        Filtrer par <CustomFormControl style={{width: '300px', display: 'inline-block'}} onChange={this.onSearch} type="search" value={this.state.queryStr} name='queryStr' placeholder="Catégories, cours..."/>
                    </div>
                </CustomHeader>          
                <div>
                    {activityList.map((item, index) => {
                            let progressValue = 0;
                            let progressText  = `0/${stats.nbStudents}`;
                            if(stats.activitycompleted[`${item.cmId}`]){
                                progressValue = stats.activitycompleted[`${item.cmId}`]/stats.nbStudents * 100;
                                progressText = `${stats.activitycompleted[`${item.cmId}`]}/${stats.nbStudents}`;
                            }

                            let actStats = WorkPlanUtils.getActivityStats(this.props.data, item);

                            progressValue = (isNaN(progressValue) ? 0 : Math.round(progressValue,1));
                            
                            let card = 
                                <CustomCard key={index} progressText={`${progressValue}% (le nombre d'activités complètes / le nombre d'élèves)`} progressValue={`${progressValue}%`}>
                                    <div className='d-flex d-block-mobile align-items-center' style={{justifyContent: 'space-between'}}>
                                        <div>
                                            <div className='h4'><strong><a href={item.cmUrl} target="_blank">{item.cmName}</a></strong></div>
                                            <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                                            <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                                        </div>
                                        <div className="m-3 p-2">
                                            {actStats.nbAwaitingGrade > 0 && <CustomBadge variant="correction" nbIndicator={actStats.nbAwaitingGrade}/>}
                                            {actStats.nbFails > 0 && <CustomBadge variant="failure" nbIndicator={actStats.nbFails}/>}
                                        </div>
                                        <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                                            <CustomBadgeCompletion title="Le nombre d'activités complètés / le nombre d'élèves" stats={progressText}/>
                                            <DropdownButton disabled={WorkPlanUtils.isArchived(JsNx.at(this.props.data.assignments, 0, null))} bsPrefix='rounded btn btn-sm btn-outline-primary' variant='' title={<span><FontAwesomeIcon icon={faEllipsisV}  />{" "}</span>} id={`optionsActivity${item.id}`}>
                                                <Dropdown.Item onClick={() => this.onShowActivities(true)}><FontAwesomeIcon icon={faPencilAlt}  />{" Modifier"}</Dropdown.Item>
                                                <Dropdown.Item onClick={() => this.onDeleteActivity(item.id)}><FontAwesomeIcon icon={faTrashAlt}  />{" Supprimer"}</Dropdown.Item>
                                            </DropdownButton>
                                        </div>
                                    </div>
                                    
                                </CustomCard>
                               
                            return (card);                                     
                        }
                    )}
                </div>
                {this.state.showActivities && <ActivityPicker templateId={template.id} onClose={(refresh) => this.onShowActivities(false, refresh)}/>}
            </>                                                   
            
        return (main);
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

        if (this.props.data.template.activities.length > 1){
            if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
                $glVars.webApi.deleteTplAct(this.props.data.template.id, tplActId, callback);
            }
        }else{
            if(window.confirm('Ce plan de travail ne lui restera plus d\'activité donc le plan sera supprimé. Êtes-vous sûre de vouloir supprimer ce plan de travail?')){
                $glVars.webApi.deleteWorkPlan(this.props.data.template.id, () => this.props.onClose());
            }
        }
    }

    onSearch(event){
        this.setState({queryStr: event.target.value});
    }
}
