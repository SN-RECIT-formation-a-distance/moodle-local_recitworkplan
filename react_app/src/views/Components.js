import React, { Component } from 'react';
import { Card, Button, Form, OverlayTrigger, Tooltip} from 'react-bootstrap';
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
        let className = (item.nbHoursCompletion === 0 ? 'bg-secondary' : '');

        let main = 
            <Card className={`rounded mt-2 mb-2`}>
                <Card.Body className={className} style={{backgroundColor: "#ffffff", display: "grid", gridGap: '1rem', gridTemplateColumns: '50% auto auto', alignItems: 'center'}}>
                    <div>
                        <div className='h4'>
                            <strong><a href={this.props.isTeacher ? userActivity.cmUrl : item.cmUrl} target="_blank">{item.cmName}</a></strong>
                            {userActivity.grade && <CustomBadge variant='bg-info' text={userActivity.grade}/>}
                        </div>
                        <div className='h6 text-muted pl-3'>{`${item.categoryName}/${item.courseName}`}</div>
                        <div className='h6 text-muted pl-3'>{`${item.nbHoursCompletion} heures`}</div>
                    </div>
                    <div className="p-2 text-muted" style={{alignItems: 'center', display: 'flex'}}>
                        {userActivity.completionState > 0 && <CustomBadge variant="completed"/>}
                        {userActivity.followup == 1 && <CustomBadge variant="correction"/>}
                        {userActivity.followup == 2 && <CustomBadge variant="feedback"/>}
                        {userActivity.passed == 0 && <CustomBadge variant="failure"/>}
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

        text = (this.props.nbIndicator > 1 ? <>${text}: ${this.props.nbIndicator}</> : text);


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
        rows: null,
        max: 0
    };

    render(){
        let spreadAttr = {};
        if (this.props.max > 0){
            spreadAttr.maxLength = this.props.max;
        }
        let textArea = <Form.Control as={this.props.as} rows={this.props.rows} className={`rounded ${this.props.className}`} style={this.props.style} 
                placeholder={this.props.placeholder} value={this.props.value} {...spreadAttr}
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        let input = <Form.Control className={`rounded ${this.props.className}`} style={this.props.style} {...spreadAttr}
                type={this.props.type} placeholder={this.props.placeholder} value={this.props.value} 
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        return (this.props.as === 'textarea' ? textArea : input);
    }
}

export class FollowUpCard extends Component{
    static defaultProps = {        
        templateId: 0,
        studentId: 0
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
                    {workPlan.stats && workPlan.stats.nbLateStudents > 0 && <CustomBadge variant="late" nbIndicator={workPlan.stats.nbLateStudents}/>}
                    {actStats.nbAwaitingGrade > 0 && <CustomBadge variant="correction" nbIndicator={actStats.nbAwaitingGrade}/>}
                    {actStats.nbFails > 0 && <CustomBadge variant="failure" nbIndicator={actStats.nbFails}/>}
                    {noResult && 
                        <>
                            <span className='text-muted'>{`Aucun suivi à faire.`}</span><br/>
                            <span className='text-muted'>{UtilsDateTime.format(this.state.lastUpdate)}</span>
                        </>
                    }
                    <br/>
                    <CustomButton faIcon={faSyncAlt} title='Rafraichir le suivi des activités' onClick={this.getData}></CustomButton>
                </div>;
        }
        else{
            main = 
                <div style={{textAlign: 'center'}}>
                    <CustomButton rounded={false} faIcon={faTasks} className='text-wrap' onClick={this.getData}>{" Suivi des activités"}</CustomButton>    
                </div>;
        }
        return main;
    }

    getData(){
        $glVars.webApi.getWorkPlan(this.props.templateId, this.props.studentId, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        this.setState({data: result.data, lastUpdate: new Date()});
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
        if (enddate < now){
            result.push(<CustomBadge key={result.length} variant="bg-warning" text="Échu"/>);
        }else if (item.nbHoursLate != 0 && this.props.template.options.showHoursLate == 1){
            let text = `En retard de ${item.nbHoursLate}h`;
            let variant = 'bg-warning';
            if (item.nbHoursLate < 0){
                text = `En avance de ${0-item.nbHoursLate}h`
                variant = 'bg-success';
            }
            text = 
            <OverlayTrigger overlay={<Tooltip>Le calcul des heures en retard ou en avance compare les deux valeurs ci-dessus: h temps consacré = h/semaine * nombre de semaines écoulées. Temps attendu = h par semaine * nombre de semaines h temps consacré</Tooltip>}>
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