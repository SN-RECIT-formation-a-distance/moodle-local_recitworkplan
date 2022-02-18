import { faCheck, faCross, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Component } from 'react';
import { DataGrid } from '../libs/components/DataGrid';
import { UtilsDateTime, WorkPlanUtils } from '../libs/utils/Utils';


export class ReportView extends Component {
    static defaultProps = {        
        reportData: null
    };

    constructor(props) {
        super(props);

    }
 
    render() {
        if (!this.props.reportData) return null;
           
        let main = <div>
        <span style={{fontWeight:'bold'}}>Nom du plan de travail :</span> {this.props.reportData.template.name}<br/>
        <span style={{fontWeight:'bold'}}>Élève :</span> <a href={this.props.reportData.userUrl} target="_blank"><span dangerouslySetInnerHTML={{__html: this.props.reportData.userPix}}></span>{`${this.props.reportData.firstName} ${this.props.reportData.lastName}`}</a><br/>
        <span style={{fontWeight:'bold'}}>Début :</span> {UtilsDateTime.getDate(this.props.reportData.startDate)}<br/>
        <span style={{fontWeight:'bold'}}>Fin :</span> {UtilsDateTime.getDate(this.props.reportData.endDate)}<br/>
        <span style={{fontWeight:'bold'}}>État :</span> {WorkPlanUtils.getCompletionState(this.props.reportData)}<br/>
        <span style={{fontWeight:'bold'}}>Rythme (h/semaine) :</span> {this.props.reportData.nbHoursPerWeek}
        <hr/>

        <DataGrid orderBy={true}>
            <DataGrid.Header>
                <DataGrid.Header.Row>
                    <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Cours"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"Activité"}</DataGrid.Header.Cell>
                    <DataGrid.Header.Cell >{"État"}</DataGrid.Header.Cell>
                </DataGrid.Header.Row>
            </DataGrid.Header>
            <DataGrid.Body>
                {this.props.reportData.template.activities.map((item, index) => {
                        let row = 
                            <DataGrid.Body.Row key={index}>
                                <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href={item.courseUrl}>{item.courseName}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell><a href={item.cmUrl}>{item.cmName}</a></DataGrid.Body.Cell>
                                <DataGrid.Body.Cell>{item.completionState == 1 ? <FontAwesomeIcon icon={faCheck} style={{color:'#00ff00'}} title='Complété'/> : <FontAwesomeIcon style={{color:'#ff0000'}} icon={faTimes}/>}</DataGrid.Body.Cell>
                            </DataGrid.Body.Row>
                        return (row);                                    
                    }
                )}
            </DataGrid.Body>
        </DataGrid>
        </div>;

        return (main);
    }
}