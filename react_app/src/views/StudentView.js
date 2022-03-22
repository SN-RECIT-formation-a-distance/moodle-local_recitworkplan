import React, { Component } from 'react';
import {ButtonToolbar, Tabs, Tab, ButtonGroup, Button, Card, ToggleButton} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faHome, faFileAlt, faSync, faFile, faCross, faCheck, faTimes, faBackward, faArrowCircleUp, faArrowCircleDown} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {FeedbackCtrl, ToggleButtons} from '../libs/components/Components';
import { TemplatesView } from './TemplateView';
import { AssignmentsView } from './AssignmentView';
import {$glVars} from '../common/common';
import { Pagination } from '../libs/components/Pagination';
import { UserActivityList } from './Components';
import { UtilsDateTime, WorkPlanUtils } from '../libs/utils/Utils';
import { ClickableElipsis } from '../libs/components/ClickableElipsis';

export class StudentView extends Component {
    constructor(props) {
        super(props);


        this.state = {activeReport: null, dataProvider: null, activeTab: 'ongoing'};
    }
 
    render() {
        if (!this.state.dataProvider) return null;
        let main = <div>
        <div className='d-flex' style={{justifyContent: "space-between"}}>
            <div className='d-flex' style={{alignItems: "center"}}>
                <span className='h1 mr-3'>Plans de travail</span>
            </div>
            <div>
                <ToggleButtons name="completionState" onChange={(e) => this.onCompletionStateChange(e)} type="radio"  defaultValue={this.state.activeTab} options={
                    [{value: "ongoing", text: "En Cours"}, {value: "archive", text: "Archivés"}]}/>
            </div>
        </div> 

            <div style={{display: "grid", gridGap: "1rem", gridTemplateColumns: "auto"}}>
            {this.state.dataProvider.map((item, index) => {
                    let row = <StudentTemplateTile key={index} reportData={item}/>
                    return (row);
                }
            )}
            </div>
            </div>;

        return (main);
    }
    
    onCompletionStateChange(event){
        this.setState({activeTab: event.target.value}, this.getData); 
    }

    componentDidMount(){ 
         this.getData();
    }
 
     getData(){
         $glVars.webApi.getWorkPlanList(30, 0, this.state.activeTab, true, this.getDataResult.bind(this));
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
        onClick: null,
    };

    constructor(props) {
        super(props);
        this.state = {detail: this.props.reportData.id, assignment: this.props.reportData.assignments[0]};
    }
 
    render() {
        if (!this.props.reportData) return null;
        let progressValue = 0;
        let progressText  = `0/${this.props.reportData.stats.nbActivities}`;
        if(this.props.reportData.stats.assignmentcompleted[`userid${this.state.assignment.user.id}`]){
            progressValue = this.props.reportData.stats.assignmentcompleted[`userid${this.state.assignment.user.id}`]/this.props.reportData.stats.nbActivities * 100;
            progressText = `${this.props.reportData.stats.assignmentcompleted[`userid${this.state.assignment.user.id}`]}/${this.props.reportData.stats.nbActivities}`;
        }
        progressValue = (isNaN(progressValue) ? 0 : progressValue);
        let rythmePercentage = this.getExpectedRhythmPercentage(this.props.reportData.template.activities);
        let rythmeColor = this.getProgressBarRythmColor();

        let main = 
        <Card className='rounded' style={{width:'100%'}}>
            <div className={rythmeColor} style={{width: `${progressValue}%`, height: '5px', maxWidth: "100%"}}></div>
            <Card.Body style={{backgroundColor: "#f0f0f0"}} >
                <div className='h4'>{this.props.reportData.template.name}</div>
                <ClickableElipsis text={this.props.reportData.template.description}/>
                <div style={{backgroundColor: "#f0f0f0", justifyContent: 'space-between', display: "flex", alignItems: "center"}}>
                    <div>
                        <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(this.state.assignment.endDate)}`}</div>
                        <div className='text-muted'>{`Rythme: ${this.state.assignment.nbHoursPerWeek} (h/semaine)`}</div>
                    </div>
                    <div>
                        <div className='text-muted'>{`Attribué par `}<a href={this.state.assignment.assignor.url} target="_blank"><span dangerouslySetInnerHTML={{__html: this.state.assignment.assignor.avatar}}></span></a></div>
                    </div>
                    <div>
                        {this.state.assignment.completionState == 2 && <Button variant={"danger"}>{`En retard`}</Button>}
                    </div> 
                    <div >
                        <span style={{fontWeight:'bold'}}>{"Achèvement "}</span><FontAwesomeIcon icon={faCheck}/><span className='ml-2'>{progressText}</span>  
                    </div>
                    <div >
                        <Button variant='outline-primary' onClick={() => this.setState({detail:this.state.detail == this.props.reportData.id ? -1 : this.props.reportData.id})}><FontAwesomeIcon icon={this.state.detail == this.props.reportData.id ? faArrowCircleUp : faArrowCircleDown}/></Button>
                    </div>
                </div>
                {this.state.detail == this.props.reportData.id && 
                    <div style={{width:'100%'}}>
                        
                        {this.props.reportData.template.activities.map((item, index) => {
                                return (<UserActivityList user={this.state.assignment.user} data={item} key={index}/>);                                     
                            }
                        )}
                    </div>}
            </Card.Body>
        </Card>
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

    getExpectedRhythmPercentage(activities){
        let weeksElapsed = Math.floor(((Date.now() / 1000) - UtilsDateTime.toTimestamp(this.state.assignment.startDate)) / 604800); //604800 seconds in a week
        let hoursExpected = this.state.assignment.nbHoursPerWeek * weeksElapsed;
        let hoursWorked = 0;
        for(let item of activities){
            if(item.completionState >= 1){
                hoursWorked = hoursWorked + item.nbHoursCompletion;
            }
        }

        /*
                    <div className="col-md-4">
                        <span style={{fontWeight:'bold'}}>Rythme attendu :</span> 
                        <div className="progress" style={{height:'20px'}}>
                            <div className={"progress-bar "+rythmeColor} role="progressbar" style={{width:rythmePercentage+'%'}} aria-valuenow={rythmePercentage} aria-valuemin="0" aria-valuemax="100">{rythmePercentage+'%'}</div>
                        </div>
                    </div>*/

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

    getProgressBarRythmColor(){
        if (this.props.reportData.completionState == 2) return 'bg-danger';
        let percentage = this.getExpectedRhythmPercentage(this.props.reportData.template.activities);
        if (percentage == 100) return 'bg-success';
        return 'bg-warning';
    }
}