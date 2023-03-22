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
import { Card, Button, Form, OverlayTrigger, Tooltip, ButtonGroup, Collapse} from 'react-bootstrap';
import { JsNx, UtilsDateTime } from '../libs/utils/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faInfoCircle, faSyncAlt, faTasks } from '@fortawesome/free-solid-svg-icons';
import {$glVars, WorkPlanUtils} from '../common/common';
import { FeedbackCtrl } from '../libs/components/Feedback';

export class UserActivityList extends Component{
    static defaultProps = {        
        data: null,
        user: null,
        isTeacher: false,
    };

    constructor(props){
        super(props);
    }

    render(){
        let item = this.props.data;
        let userActivity = JsNx.getItem(this.props.user.activities, 'cmId', item.cmId, []);
        console.log(item, userActivity, this.props.user.activities)
        let className = (item.nbHoursCompletion === 0 ? 'bg-secondary' : '');

        let main = 
            <Card className={`rounded mt-2 mb-2`}>
                <Card.Body className={`${className} p-2`} style={{backgroundColor: "#ffffff"}}>
                    <div className='h4 d-flex align-items-center' style={{justifyContent: 'space-between'}}>
                        <strong><a href={this.props.isTeacher ? userActivity.cmUrl : item.cmUrl} target="_blank">{item.cmName}</a></strong>
                        <div className='h5 text-muted'>{`${item.nbHoursCompletion} heures`}</div>
                    </div>
                    <div className='d-flex align-items-center' style={{justifyContent: 'space-between'}}>
                        <div className='h6 text-muted'>{`${item.categoryName}/${item.courseName}`}</div>                        
                        <div className="text-muted" style={{alignItems: 'center', display: 'flex'}}>
                            {userActivity.grade != null && <CustomBadge variant='bg-info' text={userActivity.grade}/>}
                            {userActivity.completionState > 0 && <CustomBadge variant="completed"/>}
                            {userActivity.followup == 1 && <CustomBadge variant="correction"/>}
                            {userActivity.followup == 2 && <CustomBadge variant="feedback"/>}
                            {userActivity.passed == 0 && <CustomBadge variant="failure"/>}
                        </div>
                    </div>
                </Card.Body>
            </Card>

        return main;
    }
}

export class CustomCard extends Component{
    static defaultProps = {        
        children: null,
        progressValue: '',
        progressText: '',
        progressColor: ''
    };

    constructor(props){
        super(props);
    }

    render(){
        let main =
            <Card className='rounded m-2'>
                <div className={this.props.progressColor} title={this.props.progressText} style={{backgroundColor: '#0f6fc5', width: this.props.progressValue, height: '5px', maxWidth: "100%"}}></div>
                <Card.Body style={{backgroundColor: "#f0f0f0"}}>
                    {this.props.children}
                </Card.Body>
            </Card>;

        return main;
    }
}

export class WorkPlanCustomCard extends Component{
    static defaultProps = {        
        children: null,
        data: null
    };
    render(){
        return null;
    }
}

export class WorkPlanCollapsible extends Component{
    static defaultProps = {   
        data: null,     
        buttons: null,
        contentCollapsible: null,
        studentId: 0,
        onDetail: null,
        onClick: null,
        progress: null
    };

    constructor(props){
        super(props);

        this.onCollapse = this.onCollapse.bind(this);

        this.state = {collapse: false}
    }

    componentDidUpdate(prevProps){
        if(JSON.stringify(prevProps.data.template.id) !== JSON.stringify(this.props.data.template.id)){
            this.setState({collapse: false});
        }
    }
    
    render(){
        let workPlan = this.props.data;
        let hasAccess = workPlan.template.hasAccess == 1;
        let progress = this.props.progress;
        
        let main =
            <CustomCard progressColor={progress.color} progressText={`${progress.text}%`} progressValue={`${progress.value}%`}>
                <div className='d-flex mb-2' style={{justifyContent: 'space-between'}}>
                    {hasAccess && <a href='#' onClick={this.props.onClick} className='h5'>{workPlan.template.name}</a>}
                    
                    {!hasAccess && <span className='h4 text-muted'>{workPlan.template.name} <OverlayTrigger overlay={
                                            <Tooltip>Vous êtes créateur de ce plan, mais vous n'avez pas accès aux cours.</Tooltip>}>
                                                <a><FontAwesomeIcon icon={faInfoCircle}/> </a>
                                                </OverlayTrigger></span>}

                    <ButtonGroup >
                        <Button size='sm' className='text-wrap' variant={(this.state.collapse ? 'primary' : 'outline-primary')} 
                                onClick={this.onCollapse} title={"Suivi des activités"}
                                aria-controls={`collapse-${workPlan.template.id}`} aria-expanded={this.state.collapse}>
                                <FontAwesomeIcon icon={faTasks}/>
                        </Button>

                        {this.props.buttons}
                    </ButtonGroup>
                </div>

                <Collapse in={this.state.collapse}>
                    <div id={`collapse-${workPlan.template.id}`} className='row align-items-center justify-content-center'>
                        {this.props.contentCollapsible}
                    </div>
                </Collapse>
            </CustomCard>;

        return main;
    }

    onCollapse(){
        if(!this.state.collapse){
            this.getDetail();
        }
       
        this.setState({collapse: !this.state.collapse})
    }

    getDetail(){
        let studentId = this.props.studentId;

        let that = this;
        $glVars.webApi.getWorkPlan(this.props.data.template.id, studentId, (result) =>{
            if(!result.success){
                FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let workPlan = result.data;
            workPlan.lastUpdate = new Date();

            if(that.props.onDetail){
                that.props.onDetail(workPlan);
            }
        });
    }
}

export class CustomHeader extends Component{
    static defaultProps = {        
        children: null,
        title: '',
        btnBefore: null,
        btnAfter: null
    };

    constructor(props){
        super(props);
    }

    render(){
        let main =
        <div className='d-flex d-block-mobile flex-wrap' style={{justifyContent: "space-between", alignItems: "center"}}>
            <div className='d-flex' style={{alignItems: "center"}}>
                {this.props.btnBefore}
                {this.props.title.length > 0 && <span className='h2 mr-3 ml-3'>{this.props.title}</span>}
                {this.props.btnAfter}
            </div>
            <div>
                {this.props.children}
            </div>
        </div> ;

        return main;
    }
}

export class CustomButton extends Component{
    static defaultProps = {        
        title: '',
        onClick: null,
        children: null,
        faIcon: null,
        disabled: false,
        className: '',
        rounded: true
    };

    render(){
        let className = (this.props.rounded ? 'rounded-circle' : 'rounded') + ' ' + this.props.className;

        let main =
            <Button disabled={this.props.disabled} size='sm' variant='outline-primary' className={className} title={this.props.title} onClick={this.props.onClick} >
                {this.props.faIcon && <FontAwesomeIcon icon={this.props.faIcon}/>}
                {this.props.children}
            </Button>;

        return main;
    }
}

export class CustomBadge extends Component{
    static defaultProps = {        
        faIcon: null,
        text: '',
        variant: '',
        nbIndicator: 0
    };

    render(){
        let variant = this.props.variant;
        let text = this.props.text;

        switch(variant){
            case 'completed': 
                variant = 'bg-success'; 
                text = <>Complété</>;
                break;
            case 'correction': 
                variant = 'bg-info'; 
                text = <>Travaux à corriger</>;
                break;
            case 'feedback': 
                variant = 'bg-warning'; 
                text = <>Rétroactions attendues</>;
                break;
            case 'failure': 
                variant = 'bg-danger'; 
                text = 
                <OverlayTrigger overlay={<Tooltip>Dans une activité QUIZ, dès que la note de passage n’est pas atteinte et que l’achèvement y est liée.</Tooltip>}>
                  <span className="d-inline-block">
                    Risque d'échec <FontAwesomeIcon icon={faInfoCircle}/>
                  </span>
                </OverlayTrigger>;
                break;
            case 'late': 
                variant = 'bg-warning';
                text = <>En retard</>;
                break;
        }

        text = (this.props.nbIndicator > 1 ? <>{text}: {this.props.nbIndicator}</> : text);


        let main = 
            <span className={`badge rounded m-1 ${variant}`}>
                {this.props.faIcon !== null && <FontAwesomeIcon icon={this.props.faIcon}/>}
                {text}
            </span>;

        return main;
    }
}

export class CustomBadgeCompletion extends Component{
    static defaultProps = {        
        title: '',
        stats: '',
        className: ''
    };

    render(){
        if(this.props.stats.length === 0){ return null; }

        let main = 
            <span className={this.props.className}>
                <span title={this.props.title}>
                    {"Achèvement "}
                    <FontAwesomeIcon icon={faCheck}/>
                </span>
                <span className='ml-2 mr-2'>
                    {this.props.stats}
                </span>
            </span>;

        return main;
    }
}

export class CustomFormControl extends Component{
    static defaultProps = {        
        onChange: null,
        disabled: false,
        name: '',
        className: '',
        style: null,
        placeholder: '',
        value: '',
        onBlur: null,
        type: '',
        as: '',
        rows: null,
        max: 0
    };

    render(){
        let spreadAttr = {};
        if (this.props.max > 0){
            spreadAttr.maxLength = this.props.max;
        }
        let textArea = <Form.Control as={this.props.as} rows={this.props.rows} className={`rounded ${this.props.className}`} style={this.props.style} disabled={this.props.disabled}
                placeholder={this.props.placeholder} value={this.props.value} {...spreadAttr}
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        let input = <Form.Control className={`rounded ${this.props.className}`} style={this.props.style} {...spreadAttr} disabled={this.props.disabled}
                type={this.props.type} placeholder={this.props.placeholder} value={this.props.value} 
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        return (this.props.as === 'textarea' ? textArea : input);
    }
}

export class FollowUpCard extends Component{
    static defaultProps = {        
        data: null,
    };

    render(){
        let main = null;

        if(this.props.data?.stats){
            let workPlan = this.props.data;
            let actStats = WorkPlanUtils.getActivityStats(workPlan);

            let noResult = !(
                        (workPlan.stats && workPlan.stats.nbLateStudents > 0) || 
                        (actStats.nbAwaitingGrade > 0) || 
                        (actStats.nbFails > 0));

            let notArchived = !WorkPlanUtils.isArchived(JsNx.at(workPlan.assignments, 0, null));

            main =
                <>
                    {notArchived && workPlan.stats && workPlan.stats.nbLateStudents > 0 && <CustomBadge variant="late" nbIndicator={workPlan.stats.nbLateStudents}/>}
                    {notArchived && actStats.nbAwaitingGrade > 0 && <CustomBadge variant="correction" nbIndicator={actStats.nbAwaitingGrade}/>}
                    {notArchived && actStats.nbFails > 0 && <CustomBadge variant="failure" nbIndicator={actStats.nbFails}/>}
                    {noResult && <span className='text-muted'>{`Aucun suivi à faire.`}</span>}
                </>;
        }

        return main;
    }
}

export class AssignmentFollowUp extends Component{
    static defaultProps = {        
        data: null,
        template: null,
        userActivity: null
    };

    render(){
        let item = this.props.data;
        let result = [];


        if(item.completionState == 1){
            result.push(<CustomBadge key={result.length} variant="bg-info" text="Archivé"/>);
        }

        let enddate = new Date(item.endDate);
        let now = new Date();
        
        if( (enddate.getTime() > 0) && (enddate.getTime() < now.getTime())){
            result.push(<CustomBadge key={result.length} variant="bg-warning" text="Échu"/>);
        }else if (item.nbHoursLate != 0 && this.props.template.options.showHoursLate == 1){
            let text = `En retard de ${item.nbHoursLate}h`;
            let variant = 'bg-warning';
            if (item.nbHoursLate < 0){
                text = `En avance de ${0-item.nbHoursLate}h`
                variant = 'bg-success';
            }
            text = 
            <OverlayTrigger overlay={<Tooltip>On compare le nombre d'heures restantes à réaliser au plan de travail aux nombres d'heures restantes selon la date d'échéance du plan de travail.</Tooltip>}>
              <span className="d-inline-block">
                {text} <FontAwesomeIcon icon={faInfoCircle}/>
              </span>
            </OverlayTrigger>;
            result.push(<CustomBadge key={result.length} variant={variant} text={text}/>);
        }else if(item.completionState == 2){
            result.push(<CustomBadge key={result.length} variant="late"/>);
        }else if(item.completionState == 0){
            result.push(<CustomBadge key={result.length} variant="bg-success" text="En cours"/>);
        }

        if(item.completionState == 3){
            result.push(<CustomBadge key={result.length} variant="completed"/>);
        }

        if(item.completionState == 4){
            result.push(<CustomBadge key={result.length} variant="bg-info" text="Inactif"/>);
        }

        let el =  JsNx.getItem(this.props.data.user.activities, 'followup', 1, null);

        if(el){
            result.push(<CustomBadge key={result.length} variant="correction"/>);
        }
        
        el =  JsNx.getItem(this.props.data.user.activities, 'followup', 2, null);
        
        if(el){
            result.push(<CustomBadge key={result.length} variant="feedback"/>);
        }
        
        el = JsNx.getItem(this.props.data.user.activities, 'passed', 0, null);
        
        if(el){
            result.push(<CustomBadge key={result.length} variant="failure"/>);
        }

        return <div>{result}</div>;
    }
}