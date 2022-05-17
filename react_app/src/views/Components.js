import React, { Component } from 'react';
import { Card, Button, Form} from 'react-bootstrap';
import { JsNx, UtilsDateTime } from '../libs/utils/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {$glVars, WorkPlanUtils} from '../common/common';

export class UserActivityList extends Component{
    static defaultProps = {        
        data: null,
        user: null
    };

    constructor(props){
        super(props);
    }

    render(){
        let item = this.props.data;
        let userActivity = JsNx.getItem(this.props.user.activities, 'cmId', item.cmId, []);

        let main = 
            <Card className='rounded mt-2 mb-2'>
                <Card.Body style={{backgroundColor: "#ffffff", display: "grid", gridGap: '1rem', gridTemplateColumns: '50% auto auto', alignItems: 'center'}}>
                    <div>
                        <div className='h4'><strong><a href={item.cmUrl} target="_blank">{item.cmName}</a></strong></div>
                        <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                        <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                    </div>
                    <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                        {userActivity.completionState > 0 && <CustomBadge variant="bg-success" text="Complété"/>}
                        {userActivity.followup == 1 && <CustomBadge variant="bg-warning" text="En attente de correction"/>}
                        {userActivity.followup == 2 && <CustomBadge variant="bg-warning" text="En attente de rétroaction"/>}
                        {userActivity.passed == 0 && <CustomBadge variant="bg-danger" text="Risque d'échec"/>}
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
        <div className='d-flex d-block-mobile' style={{justifyContent: "space-between", alignItems: "center"}}>
            <div className='d-flex' style={{alignItems: "center"}}>
                {this.props.btnBefore}
                <span className='h2 mr-3 ml-3'>{this.props.title}</span>
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
        disabled: false
    };

    render(){
        let main =
            <Button disabled={this.props.disabled} size='sm' variant='outline-primary' className='rounded-circle' title={this.props.title} onClick={this.props.onClick} >
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
        variant: ''
    };

    render(){
        let main = 
            <span className={`badge rounded m-1 ${this.props.variant}`}>
                {this.props.faIcon !== null && <FontAwesomeIcon icon={this.props.faIcon}/>}
                {` ${this.props.text}`}
            </span>;

        return main;
    }
}

export class CustomBadgeCompletion extends Component{
    static defaultProps = {        
        title: '',
        stats: ''
    };

    render(){
        let main = 
            <span>
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
        name: '',
        className: '',
        style: null,
        placeholder: '',
        value: '',
        onBlur: null,
        type: '',
        as: '',
        rows: null
    };

    render(){
        let textArea = <Form.Control as={this.props.as} rows={this.props.rows} className={`rounded ${this.props.className}`} style={this.props.style} 
                placeholder={this.props.placeholder} value={this.props.value} 
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        let input = <Form.Control className={`rounded ${this.props.className}`} style={this.props.style} 
                type={this.props.type} placeholder={this.props.placeholder} value={this.props.value} 
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        return (this.props.as === 'textarea' ? textArea : input);
    }
}

export class FollowUpCard extends Component{
    static defaultProps = {        
        templateId: 0,
    };

    constructor(props){
        super(props);

        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {data: null, lastUpdate: null};
    }

    render(){
        let main = null;

        if(this.state.data !== null){
            let workPlan = this.state.data;
            let actStats = WorkPlanUtils.getActivityStats(workPlan);

            let noResult = !((workPlan.stats && workPlan.stats.nbLateStudents > 0) || (actStats.nbAwaitingGrade > 0) || (actStats.nbFails > 0));
            main =
                <div style={{textAlign: 'center'}}>
                    {workPlan.stats && workPlan.stats.nbLateStudents > 0 && <CustomBadge variant="bg-danger" text={`${workPlan.stats.nbLateStudents} apprenants en retard`}/>}
                    {actStats.nbAwaitingGrade > 0 && <CustomBadge variant="bg-warning" text={`${actStats.nbAwaitingGrade} travaux à corriger`}/>}
                    {actStats.nbFails > 0 && <CustomBadge variant="bg-danger" text={`${actStats.nbFails} risques d'échec`}/>}
                    {noResult && 
                        <>
                            <span className='text-muted'>{`Aucun suivi à faire.`}</span><br/>
                            <span className='text-muted'>{UtilsDateTime.format(this.state.lastUpdate)}</span>
                        </>
                    }
                </div>;
        }
        else{
            main = <Button variant='link' onClick={this.getData}>Charger le suivi des apprenants</Button>
        }
        return main;
    }

    getData(){
        $glVars.webApi.getWorkPlanFormKit(this.props.templateId, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        this.setState({data: result.data.data, lastUpdate: new Date()});
    }
}

export class AssignmentFollowUp extends Component{
    static defaultProps = {        
        data: null,
        userActivity: null
    };

    render(){
        let item = this.props.data;
        let result = [];

        if(item.completionState == 0){
            result.push(<CustomBadge key={result.length} variant="bg-success" text="En cours"/>);
        }

        if(item.completionState == 1){
            result.push(<CustomBadge key={result.length} variant="bg-info" text="Archivé"/>);
        }

        if(item.completionState == 2){
            result.push(<CustomBadge key={result.length} variant="bg-danger" text="Apprenant en retard"/>);
        }

        if(item.completionState == 3){
            result.push(<CustomBadge key={result.length} variant="bg-success" text="Complété"/>);
        }

        let el =  JsNx.getItem(this.props.data.user.activities, 'followup', 1, null);

        if(el){
            result.push(<CustomBadge key={result.length} variant="bg-warning" text="En attente de correction"/>);
        }
        
        el =  JsNx.getItem(this.props.data.user.activities, 'followup', 2, null);
        
        if(el){
            result.push(<CustomBadge key={result.length} variant="bg-warning" text="En attente de rétroaction"/>);
        }
        
        el =  JsNx.getItem(this.props.data.user.activities, 'passed', 0, null);
        
        if(el){
            result.push(<CustomBadge key={result.length} variant="bg-danger" text="Risque d'échec"/>);
        }

        return <div>{result}</div>;
    }
}