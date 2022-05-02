import React, { Component } from 'react';
import { Card, Button, Form} from 'react-bootstrap';
import { JsNx } from '../libs/utils/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {WorkPlanUtils} from '../common/common';

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
                        {userActivity.completionState > 0 && <span className='badge bg-success'>Complété</span>}
                        {userActivity.followup == 1 && <span className='badge bg-warning'>En attente de correction</span>}
                        {userActivity.followup == 2 && <span className='badge bg-warning'>En attente de rétroaction</span>}
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
        faIcon: null
    };

    render(){
        let main =
            <Button size='sm' variant='outline-primary' className='rounded-circle' title={this.props.title} onClick={this.props.onClick} >
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
            <span className={`badge rounded ml-2 ${this.props.variant}`}>
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
        data: null,
    };

    render(){
        let workPlan = this.props.data;

        let actStats = WorkPlanUtils.getActivityStats(workPlan);

        let main =
            <>
                {workPlan.stats && workPlan.stats.nbLateStudents > 0 && <CustomBadge variant="bg-danger" text={`${workPlan.stats.nbLateStudents} apprenants en retard`}/>}
                {actStats.nbAwaitingGrade > 0 && <CustomBadge variant="bg-warning" text={`${actStats.nbAwaitingGrade} travaux à corriger`}/>}
                {actStats.nbFails > 0 && <CustomBadge variant="bg-warning" text={`${actStats.nbFails} risques d'échec`}/>}
                {workPlan.template.followUps.map((followUps, index2) => {
                    <CustomBadge key={index2} variant={followUps.variant} text={followUps.desc}/>
                })}
            </>;

        return main;
    }
}