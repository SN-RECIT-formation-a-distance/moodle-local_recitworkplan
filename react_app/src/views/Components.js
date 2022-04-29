import React, { Component } from 'react';
import { Card, Button} from 'react-bootstrap';
import { JsNx } from '../libs/utils/Utils';

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
        children: null
    };

    render(){
        return <Button size='sm' variant='outline-primary' className='rounded-circle' title={this.props.title} onClick={this.props.onClick} >{this.props.children}</Button>;
    }
}
