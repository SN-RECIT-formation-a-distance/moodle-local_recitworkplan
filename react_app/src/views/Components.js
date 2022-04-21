import React, { Component } from 'react';
import { Card} from 'react-bootstrap';
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