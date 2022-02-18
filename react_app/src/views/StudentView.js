import React, { Component } from 'react';
import {ButtonToolbar, Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faHome, faFileAlt, faSync, faFile, faCross, faCheck, faTimes} from '@fortawesome/free-solid-svg-icons';
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


        this.state = {tab: '0', dataProvider: null};
    }
 
    render() {
        if (!this.state.dataProvider) return null;
        let main =
            <Tabs activeKey={this.state.tab}  onSelect={(t) => this.setState({tab: t})}>
            {this.state.dataProvider.map((item, index) => {
                    let row = 
                        <Tab key={index} eventKey={index} title={item.template.name}>
                            <StudentReportView reportData={item}/>
                        </Tab>
                    return (row);                                    
                }
            )}
            </Tabs>;

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


export class StudentReportView extends Component {
    static defaultProps = {        
        reportData: null
    };

    constructor(props) {
        super(props);

    }
 
    render() {
        if (!this.props.reportData) return null;
           
        let main = <div>
        <span style={{fontWeight:'bold'}}>Nom du plan de travail :</span> {this.props.reportData.template.name}<br/>
        <span style={{fontWeight:'bold'}}>Progrès :</span> 
            <div className="progress" style={{height:'20px'}}>
                <div className="progress-bar" role="progressbar" style={{width:this.getActivityCompletionPercentage(this.props.reportData.template.activities) + '%'}} aria-valuenow={this.getActivityCompletionPercentage(this.props.reportData.template.activities)} aria-valuemin="0" aria-valuemax="100"></div>
            </div><br/>
        <span style={{fontWeight:'bold'}}>Rythme attendu :</span> 
            <div className="progress" style={{height:'20px'}}>
                <div className="progress-bar" role="progressbar" style={{width:this.getExpectedRhythmPercentage(this.props.reportData.template.activities) + '%'}} aria-valuenow={this.getExpectedRhythmPercentage(this.props.reportData.template.activities)} aria-valuemin="0" aria-valuemax="100"></div>
            </div><br/>
        <span style={{fontWeight:'bold'}}>Début :</span> {UtilsDateTime.getDate(this.props.reportData.startDate)}<br/>
        <span style={{fontWeight:'bold'}}>Fin :</span> {UtilsDateTime.getDate(this.props.reportData.endDate)}<br/>
        <span style={{fontWeight:'bold'}}>État :</span> {WorkPlanUtils.getCompletionState(this.props.reportData)}<br/>
        <span style={{fontWeight:'bold'}}>Rythme (h/semaine) :</span> {this.props.reportData.nbHoursPerWeek}
        <hr/>

        <DataGrid orderBy={true}>
            <DataGrid.Header>
                <DataGrid.Header.Row>
                    <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Cours"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Activité"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"État"}</DataGrid.Header.Cell>
                </DataGrid.Header.Row>
            </DataGrid.Header>
            <DataGrid.Body>
                {this.props.reportData.template.activities.map((item, index) => {
                        let row = 
                            <DataGrid.Body.Row key={index}>
                                <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href={item.courseUrl}>{item.courseName}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href={item.cmUrl}>{item.cmName}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><input type="checkbox" checked={item.completionState == 1}/></DataGrid.Body.Cell>
                            </DataGrid.Body.Row>
                        return (row);                                    
                    }
                )}
            </DataGrid.Body>
        </DataGrid>
        </div>;

        return (main);
    }
    
    
    getActivityCompletionPercentage(activities){
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
        return percentage;

    }
}