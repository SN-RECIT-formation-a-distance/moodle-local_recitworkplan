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
import { FollowUpCard, CustomCard, CustomBadgeCompletion, CustomBadge, WorkPlanCustomCard  } from './Components';
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
        let dataProvider = this.state.dataProvider;
        
        let main = 
            <div>
                {this.state.loading && <FontAwesomeIcon icon={faSpinner} spin={true} className='m-auto' size={'3x'}/>}
                <div className='tiles'>
                    {dataProvider.map((workPlan, index) => {
                        let card = <WorkPlanStudentCardBlock key={index} data={workPlan}/>

                        return (card); 
                    })}
                </div>

            </div>;


        return main;
    }

}
export class WorkPlanStudentCardBlock extends WorkPlanCustomCard{
    static defaultProps = {        
        data: null,
    };

    render(){
        let viewUrl = Options.recitWorkPlanUrl;
        let workPlan = this.state.data;
        let assignment = workPlan.assignments[0]; 
        let studentId = assignment.user.id;
        let progress = this.getProgress(studentId);


        let main =
        <CustomCard progressText={`${progress.text}`} progressValue={`${progress.value}%`}>
            <div className='d-flex' style={{justifyContent: 'space-between'}}>
                <a href={viewUrl+'?id='+workPlan.template.id} className='h3'>{workPlan.template.name}</a>
            </div>       
            <div className='m-1 p-1'>
                <CustomBadgeCompletion title="Le nombre d'activités complétées / le nombre d'activités" stats={progress.text}/> 
            </div>
            <div className="m-1 p-1">
                {assignment.endDate && <div className='text-muted'>{`Échéance: ${UtilsDateTime.getDate(assignment.endDate)}`}</div>}
            </div>

            <div className="m-3 p-2">
                <FollowUpCard templateId={workPlan.template.id} studentId={studentId} detail={workPlan} onDetail={() => this.getDetail(studentId)}/>
            </div>
        </CustomCard>;

        return main;
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

export class WorkPlanCardBlock extends WorkPlanCustomCard{
    static defaultProps = {        
        data: null,
    };

    render(){
        let workPlan = this.state.data;
        let progress = this.getProgress()

        let main =
            <CustomCard progressText={`${progress.text}%`} progressValue={`${progress.value}%`}>
                <div className='d-flex' style={{justifyContent: 'space-between'}}>
                    <a href={Options.recitWorkPlanUrl + '?id=' + workPlan.template.id} className='h3'>{workPlan.template.name}</a>
                </div> 
                {workPlan.stats && workPlan.stats.nbStudents > 0 && 
                    <div className="p-2 text-muted row">
                        <CustomBadgeCompletion title="Le nombre d'élèves qui ont complété le plan de travail / le nombre total d'élèves assigné au plan de travail" stats={`${workPlan.stats.workPlanCompletion}/${workPlan.stats.nbStudents}`}/>
                    </div>
                }
                 <div className="m-3 p-2">
                    <FollowUpCard templateId={workPlan.template.id} data={workPlan} onDetail={this.props.onDetail}/>
                </div>  
            </CustomCard>;

        return main;
    }
}