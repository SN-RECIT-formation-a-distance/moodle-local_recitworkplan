import React, { Component } from 'react';
import {ButtonToolbar, Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faHome, faFileAlt, faSync, faFile, faCross, faCheck, faTimes, faBackward} from '@fortawesome/free-solid-svg-icons';
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
            <div className='tiles'>
            {this.state.dataProvider.map((item, index) => {
                    let row = <StudentTemplateTile key={index} reportData={item} onClick={() => this.setState({activeReport: item})}/>
                    return (row);
                }
            )}
            </div>
            </div>;

            if (this.state.activeReport) {
                main = <StudentReportView reportData={this.state.activeReport} onBack={() => this.setState({activeReport: null})}/>;
            }

        return (main);
    }
    

    componentDidMount(){ 
         this.getData();
    }
 
     getData(){
         $glVars.webApi.getAssignmentList(false, 30, 0, true, this.getDataResult.bind(this));
     }
 
     getDataResult(result){
         if(!result.success){
             FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
             return;
         }
 
         this.setState({dataProvider: result.data.items.detailed});
     }
}
/*
export class StudentTemplateTile extends Component {
    static defaultProps = {        
        reportData: null,
        onClick: null,
    };

    constructor(props) {
        super(props);

    }
 
    render() {
        if (!this.props.reportData) return null;
        let completionPercentage = StudentReportView.getActivityCompletionPercentage(this.props.reportData.template.activities);

        let main = <div className='templatetile' onClick={() => this.props.onClick()}>
            <div className="progress" style={{height:'4px'}}>
                <div className="progress-bar" role="progressbar" style={{width:completionPercentage+'%'}} aria-valuenow={completionPercentage} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <p className='title'>{this.props.reportData.template.name}</p>
            Début : {UtilsDateTime.getDate(this.props.reportData.startDate)}<br/>
            Fin : {UtilsDateTime.getDate(this.props.reportData.endDate)}<br/>
            État : {WorkPlanUtils.getCompletionState(this.props.reportData)}<br/>
            Rythme (h/semaine) : {this.props.reportData.nbHoursPerWeek}<br/>
        </div>
        return main;
    }
}

export class StudentReportView extends Component {
    static defaultProps = {        
        reportData: null,
        onBack: null,
    };

    constructor(props) {
        super(props);

    }
 
    render() {
        if (!this.props.reportData) return null;
        
        let completionPercentage = StudentReportView.getActivityCompletionPercentage(this.props.reportData.template.activities);
        let rythmePercentage = this.getExpectedRhythmPercentage(this.props.reportData.template.activities);
        let rythmeColor = this.getProgressBarRythmColor();
        
        let activities = this.props.reportData.template.activities.sort((item, item2) => { return item.slot - item2.slot });

        let main = <div>
            <a href='#' onClick={() => this.props.onBack()}><FontAwesomeIcon icon={faBackward}/> Retour</a>
            <div className='row'>
                <div className='col-md-6'>
                    <span style={{fontWeight:'bold'}}>Nom du plan de travail :</span> {this.props.reportData.template.name}<br/>
                    <span style={{fontWeight:'bold'}}>Progrès :</span> 
                    <div className="progress" style={{height:'20px'}}>
                        <div className="progress-bar" role="progressbar" style={{width:completionPercentage+'%'}} aria-valuenow={completionPercentage} aria-valuemin="0" aria-valuemax="100">{completionPercentage+'%'}</div>
                    </div><br/>
                    <span style={{fontWeight:'bold'}}>Rythme attendu :</span> 
                    <div className="progress" style={{height:'20px'}}>
                        <div className={"progress-bar "+rythmeColor} role="progressbar" style={{width:rythmePercentage+'%'}} aria-valuenow={rythmePercentage} aria-valuemin="0" aria-valuemax="100">{rythmePercentage+'%'}</div>
                    </div>
                </div>
                <div className='col-md-6'>
                    <span style={{fontWeight:'bold'}}>Début :</span> {UtilsDateTime.getDate(this.props.reportData.startDate)}<br/>
                    <span style={{fontWeight:'bold'}}>Fin :</span> {UtilsDateTime.getDate(this.props.reportData.endDate)}<br/>
                    <span style={{fontWeight:'bold'}}>État :</span> {WorkPlanUtils.getCompletionState(this.props.reportData)}<br/>
                    <span style={{fontWeight:'bold'}}>Rythme (h/semaine) :</span> {this.props.reportData.nbHoursPerWeek}<br/>
                    <span style={{fontWeight:'bold'}}>Professeur :</span> <a href={this.props.reportData.assignorUrl} target="_blank"><span dangerouslySetInnerHTML={{__html: this.props.reportData.assignorPix}}></span>{`${this.props.reportData.assignorFirstName} ${this.props.reportData.assignorLastName}`}</a>
                </div>
            </div>
        <hr/>

        <DataGrid orderBy={true}>
            <DataGrid.Header>
                <DataGrid.Header.Row>
                    <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Cours"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Activité"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Durée estimée"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"État"}</DataGrid.Header.Cell>
                </DataGrid.Header.Row>
            </DataGrid.Header>
            <DataGrid.Body>
                {activities.map((item, index) => {
                        let row = 
                            <DataGrid.Body.Row key={index}>
                                <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href={item.courseUrl}>{item.courseName}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href={item.cmUrl}>{item.cmName}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell>{item.nbHoursCompletion+' h'}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><input type="checkbox" readOnly checked={item.completionState == 1}/></DataGrid.Body.Cell>
                            </DataGrid.Body.Row>
                        return (row);                                    
                    }
                )}
            </DataGrid.Body>
        </DataGrid>
        </div>;

        return (main);
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
        let weeksElapsed = Math.floor(((Date.now() / 1000) - UtilsDateTime.toTimestamp(this.props.reportData.startDate)) / 604800); //604800 seconds in a week
        let hoursExpected = this.props.reportData.nbHoursPerWeek * weeksElapsed;
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
        if (isNaN(percentage)) percentage = 0;
        return percentage;
    }

    getProgressBarRythmColor(){
        if (this.props.reportData.completionState == 2) return 'bg-danger';
        let percentage = this.getExpectedRhythmPercentage(this.props.reportData.template.activities);
        if (percentage == 100) return 'bg-success';
        return 'bg-warning';
    }
}*/