import React, { Component } from 'react';
import {ButtonToolbar, ButtonGroup, Button, Form, Col, DropdownButton, Dropdown, Modal, Nav, Card, Pagination, Row} from 'react-bootstrap';
import {faArrowLeft, faArrowRight, faPencilAlt, faPlusCircle, faWrench, faTrashAlt, faBars, faTv, faEye, faAngleRight, faGripVertical, faPen, faUser, faChalkboardTeacher, faWindowClose} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid} from '../libs/components/Components';
import {JsNx} from '../libs/utils/Utils';
import {$glVars} from '../common/common';
import { PageView } from './StudentView';



export class TeacherView extends Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    render() {       
        let main =
            <div>
                <TemplatesView/>
            </div>

        return (main);
    }

}


class GroupUserSelect extends Component{
    static defaultProps = {
        onSelectUser: null
    };

    constructor(props){
        super(props);

        this.onSelectGroup = this.onSelectGroup.bind(this);
        this.onSelectUser = this.onSelectUser.bind(this);
        this.onPrevious = this.onPrevious.bind(this);
        this.onNext = this.onNext.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {selectedUserIndex: -1, selectedGroupId: -1, groupList:[], userList: []};
    }

    componentDidMount(){
        this.getData();
    }
    
    getData(){
        $glVars.webApi.getEnrolledUserList($glVars.urlParams.id, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }
        
        let groupList = [];
        let userList = [];
        for(let group of result.data){
            groupList.push({text: group[0].groupName, value: group[0].groupId, data: group});
            for(let user of group){
                if(JsNx.getItem(userList, "value", user.userId, null) === null){
                    userList.push({text: user.userName, value: user.userId, data: user});
                }
            }
        }

        groupList.sort((a, b) => { return ('' + a.text).localeCompare(b.text);})
        userList.sort((a, b) => { return ('' + a.text).localeCompare(b.text);})

        if(!$glVars.urlParams.loaded){
            this.setState(
                {groupList: groupList, userList: userList, selectedUserIndex: JsNx.getItemIndex(userList, 'value', $glVars.urlParams.userId)}, 
                () => this.props.onSelectUser($glVars.urlParams.userId)
            );
        }
        else{
            this.setState({groupList: groupList, userList: userList});
        }
    }

    render(){
        let userList = this.state.userList;
        let selectedGroupId = this.state.selectedGroupId;

        if(selectedGroupId > 0){
            userList = this.state.userList.filter(function(item){
                return (item.data.groupId.toString() === selectedGroupId.toString());
            })
        }

        let value = ""; 
            
        if(JsNx.exists(userList, this.state.selectedUserIndex)){
            value = userList[this.state.selectedUserIndex].value;
        }

        let main =
            <div>
                <Row>
                    <Col sm={6}>
                        <Form.Group as={Col}>
                            <Form.Label>Sélectionnez le groupe:</Form.Label>
                            <ComboBox placeholder={"Sélectionnez votre option"} options={this.state.groupList} onChange={this.onSelectGroup} value={this.state.selectedGroupId}/>
                        </Form.Group>
                    </Col>
                    {this.props.onSelectUser !== null && 
                        <Col sm={6}>
                            <Row>
                                <Col sm={12}>
                                    <Form.Group  as={Col}>
                                        <Form.Label>Sélectionnez l'utilisateur:</Form.Label>
                                        <ComboBox placeholder={"Sélectionnez votre option"} options={userList} onChange={this.onSelectUser} value={value} style={{float: "left", width: "90%"}}/>
                                        <ButtonGroup style={{display: "flex"}}>
                                            <Button variant="link" onClick={() => this.onPrevious(userList)} disabled={(this.state.selectedUserIndex <= -1)}><FontAwesomeIcon icon={faArrowLeft}/></Button>
                                            <Button variant="link" onClick={() => this.onNext(userList)} disabled={(userList.length <= (this.state.selectedUserIndex + 1))}><FontAwesomeIcon icon={faArrowRight}/></Button>
                                        </ButtonGroup>
                                    </Form.Group>
                                    
                                </Col>
                            </Row>
                        </Col>       
                    }        
                </Row>
            </div>;

        return (main);
    }

    onSelectGroup(event){
        this.setState({selectedGroupId: event.target.value, selectedUserIndex: -1});
    }

    onSelectUser(event){
        let userId = parseInt(event.target.value, 10) || 0;
        this.setState({selectedUserIndex: event.target.index}, () => this.props.onSelectUser(userId));
    }

    onPrevious(userList){
        let newIndex = this.state.selectedUserIndex - 1;
        let value = (newIndex < 0 ? 0 : userList[newIndex].value);
        this.setState({selectedUserIndex: newIndex}, this.props.onSelectUser(parseInt(value, 10)));
    }

    onNext(userList){
        let newIndex = this.state.selectedUserIndex + 1;
        let value = userList[newIndex].value;
        this.setState({selectedUserIndex: newIndex}, this.props.onSelectUser(parseInt(value, 10)));
    }
}

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
            <Button onClick={() => this.props.onClose()} title="Fermer"><FontAwesomeIcon icon={faWindowClose}/></Button>
            <br/><br/>
                    <h3>Élève</h3>
                    <Form noValidate validated={this.state.formValidated} onSubmit={this.onSubmit} ref={this.formRef}>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <ComboBox placeholder={"Sélectionnez votre option"} options={this.state.users} onChange={this.onDataChange} name="userid" value={data.userid} style={{float: "left", width: "90%"}}/>
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