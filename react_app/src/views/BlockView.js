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
import { WorkPlanListView } from './WorkPlanView';

export class StudentBlockView extends Component{
    static defaultProps = {        
    };

    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, pagination: {current_page: 1, count: 0, item_per_page: 25}};
        this.viewUrl = $glVars.recitWorkPlanUrl;
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, 'ongoing', true, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.items});
    }

    render(){
        let dataProvider = this.state.dataProvider;
        
        let main = 
            <div>

                <div className='grid-4'>
                    {dataProvider.map((workPlan, index) => {
                            let assignment = workPlan.assignments[0]; 
                            let progressValue = {text: '', value: 0};
                            let progressText  = `0/${workPlan.stats.nbActivities}`;
                            if(workPlan.stats.assignmentcompleted[`${assignment.user.id}`]){
                                progressValue = WorkPlanUtils.getAssignmentProgress(workPlan.template.activities, assignment);
                                progressText = `${workPlan.stats.assignmentcompleted[`${assignment.user.id}`]}/${workPlan.stats.nbActivities}`;
                            }

                            let card = 
                                <Card key={index} className='rounded'>
                                    <div style={{backgroundColor: '#0f6fc5', width: `${progressValue.value}%`, height: '5px', maxWidth: "100%"}}>
                                         
                                    </div>
                                    <Card.Body style={{backgroundColor: "#f0f0f0"}}>
                                        <div className='d-flex' style={{justifyContent: 'space-between'}}>
                                            <a href='#' href={this.viewUrl} className='h3'>{workPlan.template.name}</a>
                                        </div>
                                        <div className='m-1 p-1'>
                                            <span title="Le nombre d'activités complétées / le nombre d'activités">{"Achèvement "}<FontAwesomeIcon icon={faCheck}/></span><span className='ml-2'>{progressText}</span>  
                                        </div>
                                        <div className="m-1 p-1">
                                            {assignment.endDate && <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(assignment.endDate)}`}</div>}
                                        </div>
                                        <div className='m-1 p-1'>
                                            {assignment.completionState == 2 &&
                                                <div>
                                                    <span className='badge btn-danger'>{`En retard`}</span>
                                                </div> 
                                            }
                                        </div>
                                    </Card.Body>
                                </Card>
                            return (card);                                     
                        }
                    )}
                </div>

            </div>;


        return main;
    }

}


export class AdminBlockView extends Component {
    render() {
        let main = <WorkPlanListView isBlock={true} />;

        return (main);
    }
}