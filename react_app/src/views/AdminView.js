import React, { Component } from 'react';
import {Tabs, Tab, ButtonGroup, Button, Form, Col, Table, Badge} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faPencilAlt,  faTrashAlt, faPlus, faHome, faFileAlt} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx } from '../libs/utils/Utils';

export class AdminView extends Component {
    constructor(props) {
        super(props);

        this.state = {tab: 'templates'};
    }

    render() {       
        let main =
            <Tabs activeKey={this.state.tab}  onSelect={(t) => this.setState({tab: t})}>
                <Tab eventKey="home" title={<><FontAwesomeIcon icon={faHome}/>{" Accueil"}</>}>
                    <HomeView/>
                </Tab>
                <Tab eventKey="assignments" title={<><FontAwesomeIcon icon={faTasks}/>{" Plans de travail"}</>}>
                    <AssignmentsView/>
                </Tab>
                <Tab eventKey="templates" title={<><FontAwesomeIcon icon={faFileAlt}/>{" Gabarits"}</>}>
                    <TemplatesView/>
                </Tab>
            </Tabs>

        return (main);
    }
}

class HomeView extends Component{
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
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data});
    }

    render(){
        let main = 
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
                                            <Button title="Détails" variant="primary"><FontAwesomeIcon icon={faTasks}/></Button>
                                            <Button title="Apprentimètre" variant="primary"><FontAwesomeIcon icon={faTachometerAlt}/></Button>
                                        </ButtonGroup>
                                    </DataGrid.Body.Cell>
                                </DataGrid.Body.Row>
                            return (row);                                    
                        }
                    )}
                </DataGrid.Body>
            </DataGrid>;

        return main;
    }
}

class AssignmentsView extends Component{
    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: 0};
    }

    componentDidMount(){
        $glVars.webApi.addObserver("AssignmentsView", this.getData, ['saveAssignment']);        
        this.getData();
    }

    componentWillUnmount(){
        $glVars.webApi.removeObserver("AssignmentsView");
    }

    componentDidUpdate(prevProps){
        /*if(prevProps.userId !== this.props.userId){
            this.getData();
        }*/
    }

    getData(){
        $glVars.webApi.getAssignmentList(false, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.detailed, templateId: 0});
    }

    render(){
        let main = 
            <div>
                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Plan de travail"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Description"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Élève"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 160}}>{"Date de début"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 150}}>{"Rythme par semaine (h)"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 120}}>{"Progrès"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 100}}>{}</DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {this.state.dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index}>
                                        <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.template.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.template.description}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{`${item.firstName} ${item.lastName}`}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.startDate}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.nbHoursPerWeek}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                            <ButtonGroup size="sm">
                                                <Button title="Éditer" onClick={() => this.setState({templateId: item.template.id})} variant="primary"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                                <Button title="Supprimer" variant="primary"><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
                {this.state.templateId > 0 && <ModalAssignmentForm templateId={this.state.templateId} onClose={() => this.setState({templateId: 0})}/>}
            </div>;

        return main;
    }
}

class ModalAssignmentForm extends Component{
    static defaultProps = {        
        templateId: 0,
        onClose: null
    };

    constructor(props){
        super(props);

        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {data: null, dropdownLists: {studentList: [], templateList: []}};
    }

    componentDidMount(){
        this.getData();
    }

    render(){
        if(this.state.data === null){ return null; }

        let studentList = this.state.dropdownLists.studentList.filter(item => (JsNx.getItem(this.state.data.workPlanList, 'userId', item.userId, null) === null) );

        let body = 
            <Form noValidate validated={this.state.formValidated} ref={this.formRef}>
                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>{"Collection de notes:"}</Form.Label>
                        <ComboBox placeholder={"Sélectionnez votre option"} required={true}  name="templateId" value={this.state.data.templateId} options={this.state.dropdownLists.templateList} onChange={this.onDataChange} />
                    </Form.Group>
                </Form.Row>
                <div style={{display: 'grid',gridTemplateColumns: '400px 65%', gridGap: '1rem', marginTop: "1rem"}}>
                    <div>
                        <h4>Liste d'élèves <Badge>{`(${studentList.length})`}</Badge></h4>
                        <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                            <Table striped bordered hover>                                
                                <thead>
                                    <tr>
                                        <th>Élève</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td>
                                                    <Button onClick={() => this.onAdd(item)} size="sm" variant="primary" title="Ajouter" className="mr-2"><FontAwesomeIcon icon={faPlus}/></Button>
                                                    {`${item.firstName} ${item.lastName}`}
                                                </td>
                                            </tr>

                                            return row;
                                        }
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                    <div >
                        <div>
                            <h4>Élèves assignés <Badge>{`(${this.state.data.workPlanList.length})`}</Badge></h4>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Élève</th>
                                            <th>Date de début</th>
                                            <th>Rythme</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.data.workPlanList.map((item, index) => {
                                                let row =
                                                    <tr key={index}>
                                                        <td>{`${item.firstName} ${item.lastName}`}</td>
                                                        <td><Form.Control type="text" placeholder="" value={item.startDate} name="startDate" onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Form.Control type="text" placeholder="" value={item.nbHoursPerWeek} name="nbHoursPerWeek" onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Button size="sm" variant="primary" title="Supprimer" onClick={() => this.onRemove(item.userId)}><FontAwesomeIcon icon={faTrashAlt}/></Button></td>
                                                    </tr>;

                                                return row;
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>;

        let footer = 
            <div className="btn-tollbar" style={{width: "100%", display: "flex", justifyContent: "right", flexWrap: "wrap"}}>
                <div className="btn-group" style={{flexWrap: "wrap"}}>
                    <Button  variant="secondary" onClick={this.onClose}>{"Annuler"}</Button>
                    <Button  variant="success"  onClick={this.onSave}>{"Appliquer"}</Button>
                </div>
            </div>;
                
        let main = <Modal title={'Attribuer un plan de travail'} body={body} footer={footer} onClose={this.props.onClose} />;

        return (main);
    }

    getData(){
        $glVars.webApi.getAssignmentFormKit(this.props.templateId, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        let templateList = [];
        for(let item of result.data.templateList){
            templateList.push({text: item.name, value: item.id});
        }

        this.setState({
            prototype: result.data.prototype, 
            data: {templateId: this.props.templateId, workPlanList: result.data.data}, 
            dropdownLists: {studentList: result.data.studentList, templateList: templateList}}
        );
    }

    onAdd(item){
        let data = this.state.data;
        let newItem = JsNx.clone(this.state.prototype);
        newItem.userId = item.userId;
        newItem.firstName = item.firstName;
        newItem.lastName = item.lastName;
        newItem.template.id = this.state.data.templateId;
        data.workPlanList.push(newItem);
        this.setState({data: data})
    }

    onRemove(userId){
        JsNx.removeItem(this.state.data.workPlanList, 'userId', userId);
        this.forceUpdate();
    }

    onDataChange(event, index){
        let data = this.state.data;
        data.workPlanList[index][event.target.name] = event.target.value;
        this.setState({data: data});
    }

    onSave(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
            that.onClose();
        }

        $glVars.webApi.saveAssignment(this.state.data.workPlanList, callback);
    }

    onClose(){
        this.props.onClose();
    }
}

class TemplatesView extends Component{
    constructor(props){
        super(props);
        
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: 0};
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
        $glVars.webApi.getTemplateList(this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data, templateId: 0});
    }

    render(){
        let main = 
            <div>
                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Catégorie(s)"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Nom"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Description"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 100}}>{}</DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {this.state.dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index}>
                                        <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.categories}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.description}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                            <ButtonGroup size="sm">
                                                <Button title="Éditer" onClick={() => this.setState({templateId: item.id})} variant="primary"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                                <Button title="Supprimer" variant="primary"><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
                {this.state.templateId > 0 && <ModalTemplateForm templateId={this.state.templateId} onClose={() => this.setState({templateId: 0})}/>}
            </div>;

        return main;
    }
}

class ModalTemplateForm extends Component{
    static defaultProps = {        
        templateId: 0,
        onClose: null
    };

    constructor(props){
        super(props);

        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {data: null, dropdownLists: {activityList: []}};
    }

    componentDidMount(){
        this.getData();
    }

    render(){
        if(this.state.data === null){ return null; }

        let tmpActivityList = this.state.dropdownLists.activityList.filter(item => (JsNx.getItem(this.state.data.activities, 'cmId', item.cmId, null) === null) );

        let body = 
            <Form noValidate validated={this.state.formValidated} ref={this.formRef}>
                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>{"Nom"}</Form.Label>
                        <Form.Control type="text" value={this.state.data.name} name="name" onChange={this.onDataChange} />
                    </Form.Group>
                </Form.Row>
                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>{"Description"}</Form.Label>
                        <Form.Control as="textarea" rows={3}  value={this.state.data.description} name="description" onChange={this.onDataChange} />
                    </Form.Group>
                </Form.Row>
                <div style={{display: 'grid',gridTemplateColumns: '49% 49%', gridGap: '1rem', marginTop: "1rem"}}>
                    <div>
                        <h4>Liste d'activités <Badge>{`(${tmpActivityList.length})`}</Badge></h4>
                        <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                            <Table striped bordered hover>                                
                                <thead>
                                    <tr>
                                        <th>Cours</th>
                                        <th>Activité</th>
                                        <th style={{width: 70}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tmpActivityList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td>{item.courseName}</td>
                                                <td>{item.cmName}</td>
                                                <td style={{textAlign: 'center'}}><Button onClick={() => this.onAdd(item)} size="sm" variant="primary" title="Ajouter" className="mr-2"><FontAwesomeIcon icon={faPlus}/></Button></td>
                                            </tr>

                                            return row;
                                        }
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                    <div >
                        <div>
                            <h4>Activités sélectionnées <Badge>{`(${this.state.data.activities.length})`}</Badge></h4>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Cours</th>
                                            <th>Activité</th>
                                            <th>Temps en heure</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.data.activities.map((item, index) => {
                                                let row =
                                                    <tr key={index}>
                                                        <td>{item.courseName}</td>
                                                        <td>{item.cmName}</td>
                                                        <td><Form.Control type="text" placeholder="" value={item.nbHoursCompletion} name="nbHoursCompletion" onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Button size="sm" variant="primary" title="Supprimer" onClick={() => this.onRemove(item.cmId)}><FontAwesomeIcon icon={faTrashAlt}/></Button></td>
                                                    </tr>;

                                                return row;
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>;

        let footer = 
            <div className="btn-tollbar" style={{width: "100%", display: "flex", justifyContent: "right", flexWrap: "wrap"}}>
                <div className="btn-group" style={{flexWrap: "wrap"}}>
                    <Button  variant="secondary" onClick={this.onClose}>{"Annuler"}</Button>
                    <Button  variant="success"  onClick={this.onSave}>{"Appliquer"}</Button>
                </div>
            </div>;
                
        let main = <Modal title={'Créer un gabarit'} body={body} footer={footer} onClose={this.props.onClose} />;

        return (main);
    }

    getData(){
        $glVars.webApi.getTemplateFormFormKit(this.props.templateId, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({
            prototype: result.data.prototype, 
            data: result.data.data, 
            dropdownLists: {activityList: result.data.activityList}
        });
    }

    onAdd(item){
        let data = this.state.data;
        let newItem = JsNx.clone(this.state.prototype);
        newItem.cmId = item.cmId;
        newItem.cmName = item.cmName;
        newItem.courseName = item.courseName;
        data.activities.push(newItem);
        this.setState({data: data})
    }

    onRemove(cmId){
        JsNx.removeItem(this.state.data.activities, 'cmId', cmId);
        this.forceUpdate();
    }

    onDataChange(event, index){
        index = (index >= 0 ? index : -1);
        let data = this.state.data;

        if(index >= 0){
            data.activities[index][event.target.name] = event.target.value;
        }
        else{
            data[event.target.name] = event.target.value;
        }
        
        this.setState({data: data});
    }

    onSave(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
            that.onClose();
        }

        $glVars.webApi.saveTemplate(this.state.data, callback);
    }

    onClose(){
        this.props.onClose();
    }
}