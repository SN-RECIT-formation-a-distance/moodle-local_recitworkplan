import React, { Component } from 'react';
import {ButtonToolbar, Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faHome, faFileAlt, faSync} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {FeedbackCtrl, DataGrid} from '../libs/components/Components';
import { TemplatesView } from './TemplateView';
import { AssignmentsView } from './AssignmentView';
import {$glVars} from '../common/common';

export class AdminView extends Component {
    constructor(props) {
        super(props);

        this.onDetail = this.onDetail.bind(this);

        this.state = {tab: 'home', queryStr: ""};
    }
 
    render() {       
        let main =
            <Tabs activeKey={this.state.tab}  onSelect={(t) => this.setState({tab: t})}>
                <Tab eventKey="home" title={<><FontAwesomeIcon icon={faHome}/>{" Accueil"}</>}>
                    <HomeView onDetail={this.onDetail}/>
                </Tab>
                <Tab eventKey="assignments" title={<><FontAwesomeIcon icon={faTasks}/>{" Affectations"}</>}>
                    <AssignmentsView queryStr={this.state.queryStr}/>
                </Tab>
                <Tab eventKey="templates" title={<><FontAwesomeIcon icon={faFileAlt}/>{" Gabarits"}</>}>
                    <TemplatesView/>
                </Tab>
            </Tabs>

        return (main);
    }

    onDetail(templateName){
        this.setState({tab: 'assignments', queryStr: templateName});
    }
}

class HomeView extends Component{
    static defaultProps = {        
        onDetail: null
    };

    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: []};
    }

    componentDidMount(){
        //$glVars.webApi.addObserver("HomeView", this.getData, ['saveUserNote']);        
        this.getData();
    }

    componentWillUnmount(){
        //$glVars.webApi.removeObserver("HomeView");
    }

    componentDidUpdate(prevProps){
        /*if(prevProps.userId !== this.props.userId){
            this.getData();
        }*/
    }

    getData(){
        $glVars.webApi.getAssignmentList(true, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data});
    }

    render(){
        let main = 
            <div>
                <ButtonToolbar  className="mb-4 justify-content-end">
                    <ButtonGroup >
                        <Button  title="Actualiser" onClick={() => this.getData()} variant="primary"><FontAwesomeIcon icon={faSync}/></Button>
                    </ButtonGroup>
                </ButtonToolbar>
                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Plan de travail"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"# Élèves"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 100}}></DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {this.state.dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index}>
                                        <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.nbStudents}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                            <ButtonGroup size="sm">
                                                <Button onClick={() => this.props.onDetail(item.name)} title="Détails" variant="primary"><FontAwesomeIcon icon={faTasks}/></Button>
                                                <Button title="Apprentimètre" variant="primary"><FontAwesomeIcon icon={faTachometerAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
            </div>;

        return main;
    }
}