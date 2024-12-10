// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package   local_recitworkplan
 * @copyright 2019 RÉCIT 
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import React, { Component } from 'react';
import { FeedbackCtrl } from '../libs/components/Components';
import {$glVars, Options, WorkPlanUtils} from '../common/common';
import {  UtilsDateTime  } from '../libs/utils/Utils';
import { WorkPlanFollowUp, CustomBadgeCompletion, CustomBadge, WorkPlanCustomCard, WorkPlanCollapsible, AssignmentFollowUp  } from './Components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export class StudentBlockView extends Component{
    static defaultProps = {        
    };

    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, pagination: {current_page: 1, count: 0, item_per_page: 25}, loading: true};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, 'ongoing', true, 0, this.getDataResult, false);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.items, loading: false});
    }

    render(){
        let dataProvider = this.state.dataProvider.filter((item) => item.template.options.showStudentWorkPlan !== '2');
        

        let main = 
            <div>
                {this.state.loading && <FontAwesomeIcon icon={faSpinner} spin={true} className='m-auto' size={'3x'}/>}
                <div className='tiles'>
                    {dataProvider.length > 0 && dataProvider.map((workPlan, index) => {
                        let card = <WorkPlanStudentCardBlock key={index} data={workPlan}/>

                        return (card); 
                    })} 
                </div> 
                {dataProvider.length === 0 && <div className='alert alert-primary'>Aucun plan de travail à afficher.</div>}
            </div>;


        return main;
    }

}

export class WorkPlanStudentCardBlock extends WorkPlanCustomCard{
    static defaultProps = {        
        data: null,
    };

    constructor(props){
        super(props);

        this.onDetail = this.onDetail.bind(this);
        this.onClick = this.onClick.bind(this);

        this.state = {data: props.data};
    }

    render(){
        let workPlan = this.state.data;
        let assignment = workPlan.assignments[0];
        let studentId = 0;
        let progress = WorkPlanUtils.getWorkPlanProgress(null, studentId);
        let content = null;
        
        if(assignment){
            studentId = assignment.user.id;
            progress = WorkPlanUtils.getWorkPlanProgress(workPlan, studentId);
    
            content =
                <>
                    <CustomBadgeCompletion className="m-1" title="Le nombre d'activités complétées / le nombre d'activités" stats={progress.text}/>
                    <div className='m-1 text-muted'>{`Échéance: ${UtilsDateTime.formatDateTime(assignment.endDate, " ", "Non définie")}`}</div>
                    <AssignmentFollowUp data={workPlan} assignmentId={assignment.id}/>
                </>;
        }
       

        let main = <WorkPlanCollapsible progress={progress} data={workPlan} onClick={this.onClick}
                        contentCollapsible={content} onDetail={this.onDetail} studentId={studentId}/>;

        return main;
    }

    onClick(){
        window.location.href=`${Options.recitWorkPlanUrl}?id=${this.state.data.template.id}`;
    }

    onDetail(data){
        this.setState({data: data});
    }
}

export class AdminBlockView extends Component {
    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], pagination: {current_page: 1, count: 0, item_per_page: 25}, loading: true};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getWorkPlanList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, 'ongoing', false, 0, this.getDataResult, false);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let pagination = this.state.pagination;
        pagination.current_page = parseInt(result.data.current_offset) + 1; 
        pagination.count = parseInt(result.data.total_count);
        this.setState({dataProvider: result.data.items, pagination: pagination, loading: false}); 
    }

    render() {
        let main = 
            <div className='tiles'>
            {this.state.loading && <FontAwesomeIcon icon={faSpinner} spin={true} className='m-auto' size={'3x'}/>}
                {this.state.dataProvider.map((workPlan, index) => {

                        let card = <WorkPlanCardBlock key={index} data={workPlan}/>;

                        return (card);                                     
                    }
                )}

                {!this.state.loading && this.state.dataProvider.length === 0 && 
                        <a  href={Options.recitWorkPlanUrl} className='h5'>Créer un plan de travail...</a>}
            </div>;

        return (main);
    }
}

export class WorkPlanCardBlock extends Component{
    static defaultProps = {        
        data: null,
    };

    constructor(props){
        super(props);

        this.onDetail = this.onDetail.bind(this);
        this.onClick = this.onClick.bind(this);

        this.state = {data: props.data};
    }

    render(){
        let workPlan = this.state.data;
        let progress = WorkPlanUtils.getWorkPlanProgress(workPlan);

        let content = <WorkPlanFollowUp data={workPlan}/>;

        let main = <WorkPlanCollapsible progress={progress} data={workPlan} onClick={this.onClick}
                            contentCollapsible={content} onDetail={this.onDetail}/>;
        return main;
    }

    onClick(){
        window.location.href=`${Options.recitWorkPlanUrl}?id=${this.state.data.template.id}`;
    }

    onDetail(data){
        this.setState({data: data});
    }
}