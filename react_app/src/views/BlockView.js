import React, { Component } from 'react';
import { FeedbackCtrl } from '../libs/components/Components';
import {$glVars, WorkPlanUtils} from '../common/common';
import {  UtilsDateTime  } from '../libs/utils/Utils';
import { FollowUpCard, CustomCard, CustomBadgeCompletion, CustomBadge  } from './Components';

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
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, 'ongoing', true, 0, this.getDataResult);
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

                <div className='tiles'>
                    {dataProvider.map((workPlan, index) => {
                            let assignment = workPlan.assignments[0]; 
                            let progressValue = {text: '', value: 0};
                            let progressText  = `0/${workPlan.stats.nbActivities}`;
                            if(workPlan.stats.assignmentcompleted[`${assignment.user.id}`]){
                                progressValue = WorkPlanUtils.getAssignmentProgress(workPlan.template.activities, assignment);
                                progressText = `${workPlan.stats.assignmentcompleted[`${assignment.user.id}`]}/${workPlan.stats.nbActivities}`;
                            }

                            let card =
                            <CustomCard key={index} progressText={`${progressValue.value}%`} progressValue={`${progressValue.value}%`}>
                                <div className='d-flex' style={{justifyContent: 'space-between'}}>
                                    <a href={this.viewUrl} className='h3'>{workPlan.template.name}</a>
                                </div>        
                                <div className='m-1 p-1'>
                                    <CustomBadgeCompletion title="Le nombre d'activités complétées / le nombre d'activités" stats={progressText}/>      
                                </div>
                                <div className="m-1 p-1">
                                    {assignment.endDate && <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(assignment.endDate)}`}</div>}
                                </div>

                                <div className="m-3 p-2">
                                    <FollowUpCard templateId={workPlan.template.id} isStudent={true}/>
                                </div>
                            </CustomCard>;

                        return (card);                                     
                        }
                    )}
                </div>

            </div>;


        return main;
    }

}

export class AdminBlockView extends Component {
    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], pagination: {current_page: 1, count: 0, item_per_page: 25}};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, 'ongoing', false, 0, this.getDataResult);
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

    render() {
        let main = 
            <div className='tiles'>
                {this.state.dataProvider.map((workPlan, index) => {
                        let progress = '0';
                        
                        if(workPlan.stats  && workPlan.stats.nbStudents > 0){
                            progress = workPlan.stats.workPlanCompletion/workPlan.stats.nbStudents * 100;
                        }

                        let card = <WorkPlanCardBlock key={index} data={workPlan} progress={progress}/>;

                        return (card);                                     
                    }
                )}

                {this.state.dataProvider.length === 0 && 
                        <a  href={$glVars.recitWorkPlanUrl} className='h5'>Créer un plan de travail...</a>}
            </div>;

        return (main);
    }
}

export class WorkPlanCardBlock extends Component{
    static defaultProps = {        
        data: null,
        progress: ''
    };

    render(){
        let workPlan = this.props.data;

        let main =
            <CustomCard progressText={`${this.props.progress}%`} progressValue={`${this.props.progress}%`}>
                <div className='d-flex' style={{justifyContent: 'space-between'}}>
                    <a href={$glVars.recitWorkPlanUrl + '?id=' + workPlan.template.id} className='h3'>{workPlan.template.name}</a>
                </div>              
                {workPlan.stats && workPlan.stats.nbStudents > 0 && 
                    <div className="p-2 text-muted row">
                        <CustomBadgeCompletion title="Le nombre d'élèves qui ont complété le plan de travail / le nombre total d'élèves assigné au plan de travail" stats={`${workPlan.stats.workPlanCompletion}/${workPlan.stats.nbStudents}`}/>
                    </div>
                }
                 <div className="m-3 p-2">
                    <FollowUpCard templateId={workPlan.template.id}/>
                </div>  
            </CustomCard>;

        return main;
    }
}