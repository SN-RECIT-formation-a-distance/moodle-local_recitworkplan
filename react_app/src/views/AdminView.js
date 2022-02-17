import React, { Component } from 'react';
import {ButtonToolbar, Tabs, Tab, ButtonGroup, Button} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faHome, faFileAlt, faSync, faFile} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {FeedbackCtrl, DataGrid} from '../libs/components/Components';
import { TemplatesView } from './TemplateView';
import { AssignmentsView } from './AssignmentView';
import {$glVars} from '../common/common';
import { Pagination } from '../libs/components/Pagination';
import { ReportView } from './ReportView';

export class AdminView extends Component {
    constructor(props) {
        super(props);

        this.onDetail = this.onDetail.bind(this);
        this.onReport = this.onReport.bind(this);

        this.state = {tab: 'home', queryStr: "", reportData: null};
    }
 
    render() {       
        let main =
            <Tabs activeKey={this.state.tab}  onSelect={(t) => this.setState({tab: t})}>
                <Tab eventKey="home" title={<><FontAwesomeIcon icon={faHome}/>{" Accueil"}</>}>
                    <HomeView onDetail={this.onDetail}/>
                </Tab>
                <Tab eventKey="assignments" title={<><FontAwesomeIcon icon={faTasks}/>{" Affectations"}</>}>
                    <AssignmentsView onReport={this.onReport} queryStr={this.state.queryStr}/>
                </Tab>
                <Tab eventKey="templates" title={<><FontAwesomeIcon icon={faFileAlt}/>{" Gabarits"}</>}>
                    <TemplatesView/>
                </Tab>
                <Tab eventKey="report" title={<><FontAwesomeIcon icon={faFile}/>{" Rapport"}</>}>
                    <ReportView reportData={this.state.reportData}/>
                </Tab>
            </Tabs>;

        return (main);
    }

    onDetail(templateName){
        this.setState({tab: 'assignments', queryStr: templateName});
    }

    onReport(query){
        this.setState({tab: 'report', reportData: query});
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

        this.state = {dataProvider: [], pagination: {current_page: 1, count: 0, item_per_page: 25}};
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
        $glVars.webApi.getAssignmentList(true, this.state.pagination.item_per_page, this.state.pagination.current_page - 1, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let pagination = this.state.pagination;
        pagination.current_page = parseInt(result.data.current_offset) + 1; 
        pagination.count = parseInt(result.data.total_count);
        this.setState({dataProvider: result.data.items, pagination: pagination});
    }

    changePage(page){
        let pagination = this.state.pagination;
        pagination.current_page = page
        this.setState({pagination: pagination}, this.getData);
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
                                    <DataGrid.Body.Cell>{(this.state.pagination.item_per_page * (this.state.pagination.current_page-1)) + index + 1}</DataGrid.Body.Cell>
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
                <Pagination pagination={this.state.pagination} onChangePage={(p) => this.changePage(p)}/>
            </div>;

        return main;
    }
}