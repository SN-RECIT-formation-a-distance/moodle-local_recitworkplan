import React, { Component } from 'react';
import {Tabs, Tab, ButtonGroup, Button, Form, Col, Table, Badge} from 'react-bootstrap';
import {faArrowLeft, faArrowRight, faPencilAlt,  faTrashAlt, faPlus, faChalkboardTeacher, faWindowClose} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx } from '../libs/utils/Utils';

export class AdminView extends Component {
    constructor(props) {
        super(props);

        this.state = {tab: 'workplans'};
    }

    render() {       
        let main =
            <Tabs activeKey={this.state.tab}  onSelect={(t) => this.setState({tab: t})}>
                <Tab eventKey="home" title="Accueil">
                    <HomeView/>
                </Tab>
                <Tab eventKey="workplans" title="Plans de travail">
                    <WorkPlanAssignView/>
                </Tab>
                <Tab eventKey="templates" title="Gabarits">
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
        $glVars.webApi.getWorkPlanList(true, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data});
    }

    render(){
        let that = this;

        let main = 
            <DataGrid orderBy={true}>
                <DataGrid.Header>
                    <DataGrid.Header.Row>
                        <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                        <DataGrid.Header.Cell >{"Plan de travail"}</DataGrid.Header.Cell>
                        <DataGrid.Header.Cell >{"# Élèves"}</DataGrid.Header.Cell>
                        <DataGrid.Header.Cell >{"Plus d'info"}</DataGrid.Header.Cell>
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
                                            <Button title="Détails" variant="link"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                            <Button title="Apprentimètre" variant="link"><FontAwesomeIcon icon={faPencilAlt}/></Button>
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

class WorkPlanAssignView extends Component{
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
        $glVars.webApi.getWorkPlanList(false, this.getDataResult);
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
                {this.state.templateId > 0 && <ModalWorkPlanAssign templateId={this.state.templateId} onClose={() => this.setState({templateId: 0})}/>}
            </div>;

        return main;
    }
}

class ModalWorkPlanAssign extends Component{
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
                <div style={{display: 'grid',gridTemplateColumns: '400px 65%', gridGap: '1rem'}}>
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
        $glVars.webApi.getWorkPlanAssignFormKit(this.props.templateId, this.getDataResult);
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

        $glVars.webApi.saveWorkPlanAssign(this.state.data.workPlanList, callback);
    }

    onClose(){
        this.props.onClose();
    }
}

/*
class ModalPlanForm extends Component{
    static defaultProps = {        
        plan: null,
        onClose: null,
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onSaveResult = this.onSaveResult.bind(this);
        this.onClose = this.onClose.bind(this);
        
        this.state = {data: {id: 0},  formValidated: false};
        if (this.props.plan){
            this.state.data = this.props.plan;
        }

        this.formRef = React.createRef();
    }

    render(){
        if(this.state.data === null) return null;

        let data = this.state.data;
    
        let main =
            <div>
            <Button onClick={() => this.props.onClose()} title="Fermer"><FontAwesomeIcon icon={faWindowClose}/></Button>
            <br/><br/>
                    <h3>{`Plan: ${data.name}`}</h3>
                    <Form noValidate validated={this.state.formValidated} onSubmit={this.onSubmit} ref={this.formRef}>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>{$glVars.i18n.tags.name}</Form.Label>
                                <Form.Control type="text" required value={data.name} name="name" onChange={this.onDataChange}/>
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>Description</Form.Label>
                                <Form.Control type="text" required value={data.description} name="description" onChange={this.onDataChange}/>
                            </Form.Group>
                        </Form.Row>
                    </Form>
                    <ButtonGroup>
                        <Button variant="secondary" onClick={this.onClose}>{"Annuler"}</Button>
                        <Button variant="success" onClick={this.onSubmit} disabled={!this.state.formValidated}>{"Enregistrer"}</Button>
                    </ButtonGroup>
            </div>; 

        return (main);
    }

    onClose(){
        this.props.onClose();
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        if (this.formRef.current.checkValidity() === false) {
            this.setState({formValidated: false, data:data});            
        }else{
            this.setState({formValidated: true, data:data});
        }
    }

    onSubmit(e){
        if (e) e.preventDefault();
        this.onSave();
    };

    onSave(){
        let data = JsNx.clone(this.state.data);
        $glVars.webApi.addOrUpdateTrainingPlan(data, this.onSaveResult);
    }

    onSaveResult(result){
        if(result.success){
            this.onClose();

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }
        else{
            $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
        }
    }
}

class TemplatesView extends Component{
    static defaultProps = {
        userId: 0
    };

    constructor(props){
        super(props);

        this.state = {dataProvider: [], edit: null, popup: null};
        this.getDataResult = this.getDataResult.bind(this);
        this.onClose = this.onClose.bind(this);
    }
    
    componentDidMount(){
        this.getData();
    }

    componentWillUnmount(){
    }

    getData(){        
        $glVars.webApi.getTrainingPlans(this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data});
    }

    render(){

        let main = null;
        if (this.state.popup == 'p'){
            main = <ModalPlanForm plan={this.state.edit} onClose={this.onClose} />;
        }else if (this.state.popup == 'u'){
            main = <UserForm plan={this.state.edit} onClose={this.onClose} />;
        }else if (this.state.popup == 'a'){
            main = <ActivityForm plan={this.state.edit} onClose={this.onClose} />;
        }else{
            main = <div>
                <Button onClick={() => this.onAdd()} title="Ajouter">Ajouter un gabarit de plan de travail</Button>
                <br/><br/>
                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>{$glVars.i18n.tags.name}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>Description</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 40}}></DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {this.state.dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index} onDbClick={() => this.onEdit(item, 'p')}>
                                        <DataGrid.Body.Cell>{item.id}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.description}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>
                                            <ButtonGroup size='sm'>
                                                <Button onClick={() => this.onEdit(item, 'p')} title="Modifier"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                                <Button onClick={() => this.onEdit(item, 'a')} title="Modifier parcours"><FontAwesomeIcon icon={faChalkboardTeacher}/></Button>
                                                <Button onClick={() => this.onEdit(item, 'u')} title="Modifier étudiants"><FontAwesomeIcon icon={faUser}/></Button>
                                                <Button onClick={() => this.onDelete(item)} title="Supprimer" variant="danger"><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
            </div>;
        }

        return (main);
    }

    onEdit(item, popup){
        if(item.id === 0){
            alert('Objet non existant');
            return;
        }
        this.setState({edit: item, popup: popup});
    }

    onAdd(){
        this.setState({edit: {id: null, name: '', description: ''}, popup: 'p'});
    }

    onDelete(item){
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet item?")){
            return;
        }
        $glVars.webApi.deleteTrainingPlan(item, (result) => {
        if(result.success){
            this.onClose();

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }
        else{
            $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
        }
    });        
    }

    onClose(){
        this.setState({edit: null, popup: null});
        this.getData();
    }
}

class UserForm extends Component{

    constructor(props){
        super(props);

        this.state = {dataProvider: [], edit: null, popup: null};
        this.getDataResult = this.getDataResult.bind(this);
        this.onClose = this.onClose.bind(this);
    }
    
    componentDidMount(){
        this.getData();
    }

    componentWillUnmount(){
    }

    getData(){
        $glVars.webApi.getTrainingPlan(this.props.plan.id, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.assignments});
    }

    render(){

        let main = null;
        if (this.state.popup == 'p'){
            main = <AddUserForm user={this.state.edit} plan={this.props.plan} onClose={this.onClose} />;
        }else{
            main = <div>
                <Button onClick={() => this.props.onClose()} variant="danger" title="Fermer"><FontAwesomeIcon icon={faWindowClose}/></Button>
                <Button onClick={() => this.onAdd()} title="Ajouter">Ajouter un élève</Button>
                <br/><br/>
                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>{$glVars.i18n.tags.name}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>Travail dans la semaine (heure)</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>Heure de départ</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 40}}></DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {this.state.dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index} onDbClick={() => this.onEdit(item, 'p')}>
                                        <DataGrid.Body.Cell>{item.id}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.worktimeweek}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{this.totime(item.timestart)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>
                                            <ButtonGroup size='sm'>
                                                <Button onClick={() => this.onEdit(item, 'p')} title="Modifier"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                                <Button onClick={() => this.onDelete(item)} title="Supprimer" variant="danger"><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
            </div>;
        }

        return (main);
    }

    onEdit(item, popup){
        if(item.id === 0){
            alert('Objet non existant');
            return;
        }
        this.setState({edit: item, popup: popup});
    }

    onAdd(){
        this.setState({edit: {id: null, userid: '', timestart: '', worktimeweek: ''}, popup: 'p'});
    }

    onDelete(item){
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet item?")){
            return;
        }
        $glVars.webApi.deleteTrainingPlanAssignment(item, (result) => {
        if(result.success){
            this.onClose();

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }
        else{
            $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
        }
    });        
    }

    onClose(){
        this.setState({edit: null, popup: null});
        this.getData();
    }

    totime(timestamp){
        return new Date(parseInt(timestamp)*1000).toLocaleString();
    }
}

class AddUserForm extends Component{
    static defaultProps = {        
        user: null,
        onClose: null,
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onSaveResult = this.onSaveResult.bind(this);
        this.onClose = this.onClose.bind(this);
        
        this.state = {data: {id: 0}, formValidated: false, users: []};
        if (this.props.user){
            this.state.data = this.props.user;
            let date = new Date(this.state.data.timestart * 1000).toISOString()
            this.state.data.timestart = date.substr(0, date.length-1);
        }

        this.formRef = React.createRef();
        this.getUsers();
    }

    getUsers(){
        $glVars.webApi.getStudents(null, (result) => {
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({users: result.data});
    });
    }

    render(){
        if(this.state.data === null) return null;

        let data = this.state.data;
    
        let main =
            <div>
                <Button onClick={() => this.props.onClose()} variant="danger" title="Fermer"><FontAwesomeIcon icon={faWindowClose}/></Button>
            <br/><br/>
                    <h3>Élève</h3>
                    <Form noValidate validated={this.state.formValidated} onSubmit={this.onSubmit} ref={this.formRef}>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <ComboBox placeholder={"Sélectionnez votre option"} options={this.state.users} onChange={this.onDataChange} name="userid" value={data.userid}/>
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>Temps à travailler par semaine</Form.Label>
                                <Form.Control type="number" required value={data.worktimeweek} name="worktimeweek" onChange={this.onDataChange}/>
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>Heure de début</Form.Label>
                                <Form.Control type="datetime-local" required value={data.timestart} name="timestart" onChange={this.onDataChange}/>
                            </Form.Group>
                        </Form.Row>
                    </Form>
                    <ButtonGroup>
                        <Button variant="secondary" onClick={this.onClose}>{"Annuler"}</Button>
                        <Button variant="success" onClick={this.onSubmit} disabled={!this.state.formValidated}>{"Enregistrer"}</Button>
                    </ButtonGroup>
            </div>; 

        return (main);
    }

    onClose(){
        this.props.onClose();
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        if (this.formRef.current.checkValidity() === false) {
            this.setState({formValidated: false, data:data});            
        }else{
            this.setState({formValidated: true, data:data});
        }
    }

    onSubmit(e){
        if (e) e.preventDefault();
        this.onSave();
    };

    onSave(){
        let data = JsNx.clone(this.state.data);
        data.tid = this.props.plan.id;
        data.timestart = Date.parse(data.timestart) / 1000;
        $glVars.webApi.addOrUpdateTrainingPlanAssignment(data, this.onSaveResult);
    }

    onSaveResult(result){
        if(result.success){
            this.onClose();

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }
        else{
            $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
        }
    }
}


class ActivityForm extends Component{

    constructor(props){
        super(props);

        this.state = {dataProvider: [], edit: null, popup: null};
        this.getDataResult = this.getDataResult.bind(this);
        this.onClose = this.onClose.bind(this);
    }
    
    componentDidMount(){
        this.getData();
    }

    componentWillUnmount(){
    }

    getData(){
        $glVars.webApi.getTrainingPlan(this.props.plan.id, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.activities});
    }

    render(){

        let main = null;
        if (this.state.popup == 'p'){
            main = <AddActivityForm activity={this.state.edit} plan={this.props.plan} onClose={this.onClose} />;
        }else{
            main = <div>
                <Button onClick={() => this.props.onClose()} variant="danger" title="Fermer"><FontAwesomeIcon icon={faWindowClose}/></Button>
                <Button onClick={() => this.onAdd()} title="Ajouter">Ajouter une activité</Button>
                <br/><br/>
                <h3>Parcours du plan {this.props.plan.name}</h3>
                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>Nom du cours</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>Nom de l'activité</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell>Temps pour compléter (h)</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 40}}></DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {this.state.dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index} onDbClick={() => this.onEdit(item, 'p')}>
                                        <DataGrid.Body.Cell>{item.id}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.coursename}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell><a target="_blank" href={item.cmurl}>{item.cmname}</a></DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.time_to_complete}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>
                                            <ButtonGroup size='sm'>
                                                <Button onClick={() => this.onEdit(item, 'p')} title="Modifier"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                                <Button onClick={() => this.onDelete(item)} title="Supprimer" variant="danger"><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
            </div>;
        }

        return (main);
    }

    onEdit(item, popup){
        if(item.id === 0){
            alert('Objet non existant');
            return;
        }
        this.setState({edit: item, popup: popup});
    }

    onAdd(){
        this.setState({edit: {id: null, course: '', cmid: '', time_to_complete: ''}, popup: 'p'});
    }

    onDelete(item){
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet item?")){
            return;
        }
        $glVars.webApi.deleteTrainingPlanActivity(item, (result) => {
        if(result.success){
            this.onClose();

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }
        else{
            $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
        }
    });        
    }

    onClose(){
        this.setState({edit: null, popup: null});
        this.getData();
    }
}

class AddActivityForm extends Component{
    static defaultProps = {        
        activity: null,
        plan: null,
        onClose: null,
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onSaveResult = this.onSaveResult.bind(this);
        this.onClose = this.onClose.bind(this);
        
        this.state = {data: {id: 0}, formValidated: false, courses: [], cms: [], dataFetched: []};
        if (this.props.activity){
            this.state.data = this.props.activity;
        }

        this.formRef = React.createRef();
        this.getCourses();
    }

    getCourses(){
        $glVars.webApi.getAvailableCourses((result) => {
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.state.dataFetched = result.data;
        let courses = [];
        for (let c of this.state.dataFetched){
            courses.push({value: c.id, text: c.name});
        }

        this.setState({courses: courses});
        if (this.props.activity.course){
            this.getCms(this.props.activity.course);
        }
    });
    }

    getCms(courseid){
        let cms = [];
        for (let c of this.state.dataFetched){
            if (c.id == courseid){
                for (let cm of c.cms){
                    cms.push({value: cm.id, text: cm.name});
                }
            }
        }

        this.setState({cms: cms});
    }

    render(){
        if(this.state.data === null) return null;

        let data = this.state.data;
    
        let main =
            <div>
            <Button onClick={() => this.props.onClose()} title="Fermer"><FontAwesomeIcon icon={faWindowClose}/></Button>
            <br/><br/>
                    <h3>Parcours du plan {this.props.plan.name}</h3>
                    <Form noValidate validated={this.state.formValidated} onSubmit={this.onSubmit} ref={this.formRef}>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <ComboBox placeholder={"Sélectionnez un cours"} options={this.state.courses} onChange={this.onDataChange} name="course" value={data.course} />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <ComboBox placeholder={"Sélectionnez une activité"} options={this.state.cms} onChange={this.onDataChange} name="cmid" value={data.cmid} />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>Temps à travailler pour compléter</Form.Label>
                                <Form.Control type="number" required value={data.time_to_complete} name="time_to_complete" onChange={this.onDataChange}/>
                            </Form.Group>
                        </Form.Row>
                    </Form>
                    <ButtonGroup>
                        <Button variant="secondary" onClick={this.onClose}>{"Annuler"}</Button>
                        <Button variant="success" onClick={this.onSubmit} disabled={!this.state.formValidated}>{"Enregistrer"}</Button>
                    </ButtonGroup>
            </div>; 

        return (main);
    }

    onClose(){
        this.props.onClose();
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        if (event.target.name == 'course'){
            this.getCms(event.target.value);
        }
        if (this.formRef.current.checkValidity() === false) {
            this.setState({formValidated: false, data:data});            
        }else{
            this.setState({formValidated: true, data:data});
        }
    }

    onSubmit(e){
        if (e) e.preventDefault();
        this.onSave();
    };

    onSave(){
        let data = JsNx.clone(this.state.data);
        data.tid = this.props.plan.id;
        $glVars.webApi.addOrUpdateTrainingPlanActivity(data, this.onSaveResult);
    }

    onSaveResult(result){
        if(result.success){
            this.onClose();

            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }
        else{
            $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
        }
    }
}*/