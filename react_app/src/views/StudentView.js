import React, { Component } from 'react';
import {Button, Card} from 'react-bootstrap';
import { faSyncAlt, faArchive, faCheck, faChevronUp, faChevronDown, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {FeedbackCtrl, ToggleButtons} from '../libs/components/Components';
import {$glVars, WorkPlanUtils} from '../common/common';
import { UserActivityList, CustomCard, AssignmentFollowUp, CustomBadgeCompletion, CustomHeader, CustomButton, FollowUpCard } from './Components';
import { UtilsDateTime } from '../libs/utils/Utils';
import { ClickableElipsis } from '../libs/components/ClickableElipsis';

export class StudentView extends Component {
    static defaultProps = {        
        userId: 0,
    };

    constructor(props) {
        super(props);

        this.state = {lastUpdate: 0, activeTab: 'ongoing', detail: -1};
    }
 
    render() {
        let list = 
            <div>
                <div className='d-flex' style={{justifyContent: "space-between"}}>
                    <div className='d-flex' style={{alignItems: "center"}}>
                        <span className='h1 mr-3'>Plans de travail</span>
                    </div>
                    <div>
                        <ToggleButtons name="completionState" onChange={(e) => this.onCompletionStateChange(e)} type="radio" defaultValue={this.state.activeTab} options={
                            [{value: "ongoing", text: <span><FontAwesomeIcon icon={faSyncAlt}  />{" En cours"}</span>}, 
                            {value: "archive", text: <span><FontAwesomeIcon icon={faArchive}  />{" Archivés"}</span>}]}/>
                    </div>
                </div> 

               <StudentWorkPlanList state={this.state.activeTab} onDetail={(tplId) => this.setState({detail:tplId})} lastUpdate={this.state.lastUpdate}/>
            </div>;

        let details = <StudentTemplateDetail templateId={this.state.detail} onClose={() => this.setState({detail: -1})}/>

        let main = this.state.detail == -1 ? list : details;

        return (main);
    }
    
    onCompletionStateChange(event){
        this.setState({activeTab: event.target.value, lastUpdate: Date.now()}, this.getData); 
    }
}

export class StudentWorkPlanList extends Component {
    static defaultProps = {        
        userId: 0,
        lastUpdate: 0,
        state: 'ongoing',
        onDetail: null
    };

    constructor(props) {
        super(props);

        this.state = {dataProvider: null, detail: -1};
    }
 
    render() {
        if (!this.state.dataProvider){
            return null;
        }

        let list = 
            <div className='tiles'>
                {this.state.dataProvider.map((item, index) => {
                        let row = <StudentTemplateTile onDetail={this.props.onDetail} key={index} reportData={item}/>
                        return (row);
                    }
                )}
            </div>;

        return list;
    }
    
    componentDidMount(){
        this.getData();
    }

    componentDidUpdate(prevProps){ 
        if(prevProps.lastUpdate !== this.props.lastUpdate){
            this.getData();
        }
    }
 
     getData(){
         $glVars.webApi.getWorkPlanList(30, 0, this.props.state, true, this.props.userId, this.getDataResult.bind(this));
     }
 
     getDataResult(result){
         if(!result.success){
             FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
             return;
         }
 
         this.setState({dataProvider: result.data.items});
     }
}

export class StudentTemplateTile extends Component {
    static defaultProps = {        
        reportData: null,
        onDetail: null     
    };

    constructor(props) {
        super(props);
        this.state = {assignment: this.props.reportData.assignments[0]};
    }
 
    render() {
        if (!this.props.reportData) return null;
        let reportData = this.props.reportData;
        let progressValue = {text: '', value: 0};
        let progressText  = `0/${reportData.stats.nbActivities}`;
        if(reportData.stats.assignmentcompleted[`${this.state.assignment.user.id}`]){
            progressValue = WorkPlanUtils.getAssignmentProgress(reportData.template.activities, this.state.assignment);
            progressText = `${reportData.stats.assignmentcompleted[`${this.state.assignment.user.id}`]}/${reportData.stats.nbActivities}`;
        }
        let rythmeColor = StudentTemplateTile.getProgressBarRythmColor(reportData, this.state.assignment);

        let main = 
            <CustomCard progressColor={rythmeColor} progressText={progressValue.text} progressValue={`${progressValue.value}%`}>
                <div className='mb-3'>
                    <a onClick={() => this.props.onDetail(reportData.template.id)} href='#' className='h4'>{reportData.template.name}</a>
                </div>
                
                <div>
                    <div className="p-2 text-muted row">                        
                        <div className='col-md-5' >
                            <span>
                                <div><a href={this.state.assignment.assignor.url} target="_blank"><span dangerouslySetInnerHTML={{__html: this.state.assignment.assignor.avatar}}></span></a></div>
                                <span>{`Attribué par `}</span>
                            </span>
                        </div>
                        <div className='col-md-7 d-flex align-items-center'>
                            <CustomBadgeCompletion title="Le nombre d'activités complétées / le nombre d'activités" stats={progressText}/>
                        </div>
                    </div>
                    <div>
                        <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(this.state.assignment.endDate)}`}</div>
                        <div className='text-muted'>{`Rythme: ${this.state.assignment.nbHoursPerWeek} (h/semaine)`}</div>
                    </div>
                    <div className="m-3 p-2">
                        <FollowUpCard templateId={reportData.template.id} isStudent={true}/>
                    </div>
                </div>
            </CustomCard>

        return main;
    }

    static getActivityCompletionPercentage(activities){
        let count = 0;
        for(let item of activities){
            if(item.completionState >= 1){
                count++;
            }
        }

        return Math.ceil(count / activities.length * 100).toString();
    }

    static getExpectedRhythmPercentage(activities, assignment){
        let weeksElapsed = Math.floor(((Date.now() / 1000) - UtilsDateTime.toTimestamp(assignment.startDate)) / 604800); //604800 seconds in a week
        let hoursExpected = assignment.nbHoursPerWeek * weeksElapsed;
        let hoursWorked = 0;
        for(let item of activities){
            if(item.completionState >= 1){
                hoursWorked = hoursWorked + item.nbHoursCompletion;
            }
        }

        let percentage = Math.ceil(hoursWorked / hoursExpected);
        if (percentage > 100){
            percentage = 100;
        }
        if (percentage < 0){
            percentage = 0;
        }
        if (isNaN(percentage)) percentage = 0;
        return percentage;
    }

    static getProgressBarRythmColor(reportData, assignment){
        if (reportData.completionState == 2) return 'bg-danger';
        let percentage = this.getExpectedRhythmPercentage(reportData.template.activities, assignment);
        if (percentage == 100) return 'bg-success';
        return 'bg-warning';
    }
}

class StudentTemplateDetail extends Component {
    static defaultProps = {
        onClose: null,
        templateId: 0,
    }

    constructor(props) {
        super(props);

        this.state = {dataProvider: null};
    }

    componentDidMount(){
        this.getData();
    }
 
    getData(){
        $glVars.webApi.getWorkPlan(this.props.templateId, true, this.getDataResult.bind(this));
    }
 
    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }
 
        this.setState({dataProvider: result.data, assignment: result.data.assignments[0]});
    }

    render(){
        if (!this.state.dataProvider) return null;
        let reportData = this.state.dataProvider;
        let progressValue = {text: '', value: 0};
        let progressText  = `0/${reportData.stats.nbActivities}`;
        if(reportData.stats.assignmentcompleted[`${this.state.assignment.user.id}`]){
            progressValue = WorkPlanUtils.getAssignmentProgress(reportData.template.activities, this.state.assignment);
            progressText = `${reportData.stats.assignmentcompleted[`${this.state.assignment.user.id}`]}/${reportData.stats.nbActivities}`;
        }
        let rythmeColor = StudentTemplateTile.getProgressBarRythmColor(reportData, this.state.assignment);

        let main = <>
            <CustomHeader title="Plan de travail" btnBefore={<CustomButton title="Revenir" onClick={this.props.onClose} faIcon={faArrowLeft}/>}>
            </CustomHeader>
            <CustomCard progressColor={rythmeColor} progressText={progressValue.text} progressValue={`${progressValue.value}%`}>
                <div className='mb-3'>
                    <div className='h4'>{reportData.template.name}</div>
                    <p>{reportData.template.description}</p>
                </div>
                
                <div style={{ justifyContent: 'space-between', display: "flex", alignItems: "center", flexWrap: 'wrap'}}>
                    <div>
                        <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(this.state.assignment.endDate)}`}</div>
                        <div className='text-muted'>{`Rythme: ${this.state.assignment.nbHoursPerWeek} (h/semaine)`}</div>
                    </div>
                    <div>
                        <div className='text-muted'>{`Attribué par `}<a href={this.state.assignment.assignor.url} target="_blank"><span dangerouslySetInnerHTML={{__html: this.state.assignment.assignor.avatar}}></span></a></div>
                        {reportData.template.communicationUrl && reportData.template.communicationUrl.length > 0 && <div className='text-muted'><a href={reportData.template.communicationUrl} target="_blank">Contacter</a></div>}
                    </div>
                    <AssignmentFollowUp data={this.state.assignment}/>
                    <div>
                        <CustomBadgeCompletion title="Le nombre d'activités complétées / le nombre d'activités" stats={progressText}/>
                    </div>
                </div>
                <div className='mt-3 d-flex align-items-center'>
                    <strong>{"Activités"}</strong>
                </div>
                    <div style={{width:'100%'}}>                        
                        {reportData.template.activities.map((item, index) => {
                                return (<UserActivityList user={this.state.assignment.user} data={item} key={index}/>);                                     
                            }
                        )}
                </div>
            </CustomCard>
            </>
      
        return main;       
    }
}