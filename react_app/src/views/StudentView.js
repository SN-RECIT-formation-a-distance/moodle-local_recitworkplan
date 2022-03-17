import React, { Component } from 'react';
import {ButtonToolbar, Tabs, Tab, ButtonGroup, Button, Card} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faHome, faFileAlt, faSync, faFile, faCross, faCheck, faTimes, faBackward, faArrowCircleUp, faArrowCircleDown} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {FeedbackCtrl, DataGrid} from '../libs/components/Components';
import { TemplatesView } from './TemplateView';
import { AssignmentsView } from './AssignmentView';
import {$glVars} from '../common/common';
import { Pagination } from '../libs/components/Pagination';
import { ReportView } from './ReportView';
import { UtilsDateTime, WorkPlanUtils } from '../libs/utils/Utils';

export class StudentView extends Component {
    constructor(props) {
        super(props);


        this.state = {activeReport: null, dataProvider: null};
    }
 
    render() {
        if (!this.state.dataProvider) return null;
        let main = <div>
            <h2>Plans</h2>
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
    

    componentDidMount(){ 
         this.getData();
    }
 
     getData(){
         $glVars.webApi.getWorkPlanList(30, 0, 'ongoing', true, this.getDataResult.bind(this));
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
        this.state = {detail:false, assignment:this.props.reportData.assignments[0]};
        console.log(this.state.assignment)
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
            <div className={rythmeColor} style={{width: `${progressValue}%`, height: '5px', maxWidth: "100%"}}>
                 
            </div>
            <Card.Body style={{backgroundColor: "#f0f0f0"}}>
                <div className='d-flex' style={{justifyContent: 'space-between'}}>
                    <a href='#' onClick={() => this.setState({detail:this.props.reportData.id})} className='h3'>{this.props.reportData.template.name}</a>
                </div>
                <div className='row'>
                    <div className="col-md-4">
                        <span style={{fontWeight:'bold'}}>Début :</span> {UtilsDateTime.getDate(this.state.assignment.startDate)}<br/>
                        <span style={{fontWeight:'bold'}}>Fin :</span> {UtilsDateTime.getDate(this.state.assignment.endDate)}<br/>
                        <span style={{fontWeight:'bold'}}>État :</span> {WorkPlanUtils.getCompletionState(this.state.assignment)}<br/>
                        <span style={{fontWeight:'bold'}}>Rythme (h/semaine) :</span> {this.state.assignment.nbHoursPerWeek}<br/>
                        <span style={{fontWeight:'bold'}}>Professeur :</span> <a href={this.state.assignment.assignor.url} target="_blank"><span dangerouslySetInnerHTML={{__html: this.state.assignment.assignor.avatar}}></span>{`${this.state.assignment.assignor.firstName} ${this.state.assignment.assignor.lastName}`}</a>
                    </div>
                    <div className="col-md-3">
                        {this.state.assignment.completionState > 0 && <Button variant={"danger"}>{`En retard`}</Button>}
                    </div> 
                    <div className="col-md-4">
                        <span style={{fontWeight:'bold'}}>{"Achèvement "}</span><FontAwesomeIcon icon={faCheck}/><span className='ml-2'>{progressText}</span>  
                    </div>
                    <div className="col-md-1" style={{textAlign: 'right'}}>
                        <a href="#" onClick={() => this.setState({detail:this.state.detail == this.props.reportData.id ? -1 : this.props.reportData.id})}><FontAwesomeIcon icon={this.state.detail == this.props.reportData.id ? faArrowCircleUp : faArrowCircleDown}/></a>
                    </div>
                </div>
                {this.state.detail == this.props.reportData.id && 
                    <div style={{width:'100%'}}>
                        
                        {this.props.reportData.template.activities.map((item, index) => {
                                
                                let card2 = 
                                    <Card key={index} className='rounded mt-2 mb-2'>
                                        <Card.Body style={{backgroundColor: "#ffffff", display: "grid", gridGap: '1rem', gridTemplateColumns: '50% auto auto', alignItems: 'center'}}>
                                            <div>
                                                <div className='h4'><strong><a href={item.cmUrl} target="_blank">{item.cmName}</a></strong></div>
                                                <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                                                <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                                            </div>
                                            <div className="m-3 p-2">
                                                {this.props.reportData.template.followUps.map((followUps, index2) => {
                                                    return <Button key={index2} variant={followUps.variant}>{followUps.desc}</Button>;
                                                })}
                                            </div>
                                            <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                                                {item.completionState > 0 && <Button variant='success'>Complété</Button>}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                return (card2);                                     
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