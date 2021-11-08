import React, { Component } from 'react';
import {Tabs, Tab, ButtonGroup, Button, Form, FormGroup, InputGroup, FormControl, Col, Table, Badge} from 'react-bootstrap';
import {faTachometerAlt, faTasks, faPencilAlt,  faTrashAlt, faPlus, faHome, faFileAlt, faSearch} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString, UtilsDateTime } from '../libs/utils/Utils';

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
                                            <Button onClick={() => this.props.onDetail(item.name)} title="Détails" variant="primary"><FontAwesomeIcon icon={faTasks}/></Button>
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
    static defaultProps = {        
        queryStr: ""
    };

    constructor(props){
        super(props);
        
        this.onClose = this.onClose.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, queryStr: this.props.queryStr};
    }

    componentDidMount(){
       // $glVars.webApi.addObserver("AssignmentsView", this.getData, ['saveAssignment']);        
        this.getData();
    }

    componentWillUnmount(){
        //$glVars.webApi.removeObserver("AssignmentsView");
    }

    componentDidUpdate(prevProps, prevState){
        if(this.props.queryStr !== this.state.queryStr){
            this.setState({queryStr: this.props.queryStr});
        }
    }

    getData(){
        $glVars.webApi.getAssignmentList(false, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        this.setState({dataProvider: result.data.detailed, templateId: -1});
    }

    render(){
        let dataProvider = this.state.dataProvider;
        let regexp = UtilsString.getRegExp(this.state.queryStr);

        if(this.state.queryStr.length > 0){
            dataProvider = this.state.dataProvider.filter(function(item){
                if((item.template.name.search(regexp) >= 0) || (item.firstName.search(regexp) >= 0) || (item.lastName.search(regexp) >= 0) || (item.startDate.toString().search(regexp) >= 0)){
                    return true;
                }
                else{
                    return false;
                }
            })
        }

        let main = 
            <div>
                <Button className="mb-3" title="Ajouter" onClick={() => this.setState({templateId: 0})} variant="primary"><FontAwesomeIcon icon={faPlus}/>{" Attribuer un plan de travail"}</Button>

                <FormGroup>
                    <InputGroup>
                        <FormControl autoFocus type="text" placeholder={"Recherchez..."} onChange={(event) => this.setState({queryStr: event.target.value})} value={this.state.queryStr}  aria-describedby="inputGroupPrepend" />
                        <InputGroup.Prepend>
                            <InputGroup.Text id="inputGroupPrepend"><FontAwesomeIcon icon={faSearch}/></InputGroup.Text>
                        </InputGroup.Prepend>
                    </InputGroup>
                </FormGroup>

                <DataGrid orderBy={true}>
                    <DataGrid.Header>
                        <DataGrid.Header.Row>
                            <DataGrid.Header.Cell style={{width: 80}}>{"#"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Plan de travail"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell >{"Élève"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 160}}>{"Date de début"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 150}}>{"Rythme par semaine (h)"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 120}}>{"Progrès"}</DataGrid.Header.Cell>
                            <DataGrid.Header.Cell style={{width: 100}}>{}</DataGrid.Header.Cell>
                        </DataGrid.Header.Row>
                    </DataGrid.Header>
                    <DataGrid.Body>
                        {dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index}>
                                        <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.template.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{`${item.firstName} ${item.lastName}`}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{UtilsDateTime.getDate(item.startDate)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.nbHoursPerWeek}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                            <ButtonGroup size="sm">
                                                <Button title="Éditer" onClick={() => this.setState({templateId: item.template.id})} variant="primary"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
                {this.state.templateId >= 0 && <ModalAssignmentForm templateId={this.state.templateId} onClose={this.onClose}/>}
            </div>;

        return main;
    }

    onClose(refresh){
        if(refresh){
            this.getData();
        }
        else{
            this.setState({templateId: -1});
        }
    }
}

class ModalAssignmentForm extends Component{
    static defaultProps = {        
        templateId: 0,
        onClose: null
    };

    constructor(props){
        super(props);

        this.getDataResult = this.getDataResult.bind(this);
        this.getData = this.getData.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onDeleteAssignment = this.onDeleteAssignment.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {templateId: props.templateId, assignmentList: [], dropdownLists: {studentList: [], templateList: []}, flags: {dataChanged: false, refresh: false}};
    }

    componentDidMount(){
        this.getData(this.state.templateId, true);
    }

    render(){
        if(this.state.data === null){ return null; }

        let studentList = this.state.dropdownLists.studentList.filter(item => (JsNx.getItem(this.state.assignmentList, 'userId', item.userId, null) === null) );

        let body = 
            <Form noValidate validated={this.state.formValidated} ref={this.formRef}>
                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>{"Collection de notes:"}</Form.Label>
                        <ComboBox placeholder={"Sélectionnez votre option"} required={true}  name="templateId" value={this.state.templateId} options={this.state.dropdownLists.templateList} onChange={this.onDataChange} />
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
                                        <th style={{width: 50}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td>{`${item.firstName} ${item.lastName}`}</td>
                                                <td><Button onClick={() => this.onAdd(item)} size="sm" variant="primary" title="Ajouter" className="mr-2"><FontAwesomeIcon icon={faPlus}/></Button></td>
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
                            <h4>Élèves assignés <Badge>{`(${this.state.assignmentList.length})`}</Badge></h4>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Élève</th>
                                            <th>Date de début</th>
                                            <th>Rythme</th>
                                            <th style={{width: 50}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.assignmentList.map((item, index) => {
                                                let row =
                                                    <tr key={index}>
                                                        <td>{`${item.firstName} ${item.lastName}`}</td>
                                                        <td><Form.Control type="text" placeholder="" value={item.startDate} name="startDate" onBlur={() => this.onSave(item)} onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Form.Control type="text" placeholder="" value={item.nbHoursPerWeek} name="nbHoursPerWeek" onBlur={() => this.onSave(item)} onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Button size="sm" variant="primary" title="Supprimer" onClick={() => this.onDeleteAssignment(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button></td>
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

        let main = <Modal title={'Attribuer un plan de travail'} body={body} onClose={this.onClose} />;

        return (main);
    }

    getData(templateId, complete){
        templateId = templateId || 0;
        complete = (typeof complete === 'undefined' ? false : complete);
        $glVars.webApi.getAssignmentFormKit(templateId, complete, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            return;
        }

        let templateList = [];
        if(result.data.templateList !== null){
            for(let item of result.data.templateList){
                templateList.push({text: item.name, value: item.id});
            }
        }
        else{
            templateList = this.state.dropdownLists.templateList;
        }
        
        this.setState({
            assignmentList: result.data.data,
            prototype: (result.data.prototype !== null ? result.data.prototype : this.state.prototype), 
            dropdownLists: {studentList: result.data.studentList, templateList: templateList}}
        );
    }

    onAdd(item){
        let assignmentList = this.state.assignmentList;
        let newItem = JsNx.clone(this.state.prototype);
        newItem.userId = item.userId;
        newItem.firstName = item.firstName;
        newItem.lastName = item.lastName;
        newItem.template.id = this.state.templateId;
        assignmentList.push(newItem);
        this.setState({assignmentList: assignmentList, flags: {dataChanged: true, refresh: true}}, () => this.onSave(newItem))
    }

    onDeleteAssignment(assignmentId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let assignmentList = that.state.assignmentList;
            JsNx.removeItem(assignmentList, 'id', assignmentId);
            that.setState({assignmentList: assignmentList, flags: {dataChanged: that.state.flags.dataChanged, refresh: true}});
        }

        $glVars.webApi.deleteAssignment(assignmentId, callback);
    }

    onDataChange(event, index){
        if(index >= 0){
            let assignmentList = this.state.assignmentList;
            let flags = this.state.flags;
            flags.dataChanged = (assignmentList[index][event.target.name] !== event.target.value);
            flags.refresh = true;
            assignmentList[index][event.target.name] = event.target.value;
            this.setState({assignmentList: assignmentList, flags: flags});
        }
        else{
            let data = this.state;
            data[event.target.name] = event.target.value;
            this.setState(data, () => this.getData(event.target.value));
        }
    }

    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            that.setState({flags: {dataChanged: false, refresh: that.state.flags.refresh}});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.refresh);
    }
}

class TemplatesView extends Component{
    constructor(props){
        super(props);
        
        this.onClose = this.onClose.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);

        this.state = {dataProvider: [], templateId: -1, queryStr: ""};
    }

    componentDidMount(){
      //  $glVars.webApi.addObserver("TemplatesView", this.getData, ['saveTemplate']);        
        this.getData();
    }

    componentWillUnmount(){
      //  $glVars.webApi.removeObserver("TemplatesView");
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

        this.setState({dataProvider: result.data, templateId: -1});
    }

    render(){
        let dataProvider = this.state.dataProvider;
        let regexp = UtilsString.getRegExp(this.state.queryStr);
        let that = this;

        if(this.state.queryStr.length > 0){
            
            dataProvider = this.state.dataProvider.filter(function(item){
                let categories = that.getCategories(item);
                if((item.name.search(regexp) >= 0) || (item.description.search(regexp) >= 0) || (categories.search(regexp) >= 0)){
                    return true;
                }
                else{
                    return false;
                }
            })
        }

        let main = 
            <div>
                <Button className="mb-3" title="Ajouter" onClick={() => this.setState({templateId: 0})} variant="primary"><FontAwesomeIcon icon={faPlus}/>{" Créer un gabarit"}</Button>

                <FormGroup>
                    <InputGroup>
                        <FormControl autoFocus type="text" placeholder={"Recherchez..."} onChange={(event) => this.setState({queryStr: event.target.value})} value={this.state.queryStr}  aria-describedby="inputGroupPrepend" />
                        <InputGroup.Prepend>
                            <InputGroup.Text id="inputGroupPrepend"><FontAwesomeIcon icon={faSearch}/></InputGroup.Text>
                        </InputGroup.Prepend>
                    </InputGroup>
                </FormGroup>

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
                        {dataProvider.map((item, index) => {
                                let row = 
                                    <DataGrid.Body.Row key={index}>
                                        <DataGrid.Body.Cell>{index + 1}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{this.getCategories(item)}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.name}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell>{item.description}</DataGrid.Body.Cell>
                                        <DataGrid.Body.Cell style={{textAlign: 'center'}}>
                                            <ButtonGroup size="sm">
                                                <Button title="Éditer" onClick={() => this.setState({templateId: item.id})} variant="primary"><FontAwesomeIcon icon={faPencilAlt}/></Button>
                                                <Button title="Supprimer" onClick={() => this.onRemove(item.id)} variant="primary"><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                            </ButtonGroup>
                                        </DataGrid.Body.Cell>
                                    </DataGrid.Body.Row>
                                return (row);                                    
                            }
                        )}
                    </DataGrid.Body>
                </DataGrid>
                {this.state.templateId >= 0 && <ModalTemplateForm templateId={this.state.templateId} onClose={this.onClose}/>}
            </div>;

        return main;
    }

    getCategories(item){
        let result = [];
        for(let act of item.activities){
            result.push(act.categoryName);
        }
        result = [...new Set(result)]; // distinct values
        return result.join(", ");
    }

    onClose(refresh){
        if(refresh){
            this.getData();
        }
        else{
            this.setState({templateId: -1});
        }
    }

    onRemove(templateId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                FeedbackCtrl.instance.showError($glVars.i18n.appName, result.msg);
            }
            else{
                FeedbackCtrl.instance.showInfo($glVars.i18n.appName, $glVars.i18n.msgSuccess, 3);
                that.getData();
            }
        };

        if(window.confirm($glVars.i18n.msgConfirmDeletion)){
            $glVars.webApi.deleteTemplate(templateId, callback);
        }
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
        this.onSaveActTpl = this.onSaveActTpl.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {data: null, dropdownLists: {activityList: []}, flags: {dataChanged: false, refresh: false}};
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
                        <Form.Control type="text" value={this.state.data.name}  onBlur={() => this.onSave(this.state.data)} name="name" onChange={this.onDataChange} />
                    </Form.Group>
                </Form.Row>
                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>{"Description"}</Form.Label>
                        <Form.Control as="textarea" rows={3}  value={this.state.data.description} onBlur={() => this.onSave(this.state.data)}  name="description" onChange={this.onDataChange} />
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
                                                        <td><Form.Control type="text" placeholder="" value={item.nbHoursCompletion} onBlur={() => this.onSaveActTpl(item)} name="nbHoursCompletion" onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Button size="sm" variant="primary" title="Supprimer" onClick={() => this.onRemove(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button></td>
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

        let main = <Modal title={'Créer un gabarit'} body={body} onClose={this.onClose} />;

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
            data: result.data.data, 
            dropdownLists: {activityList: result.data.activityList}
        });
    }

    onAdd(item){
        let newItem = {};
        newItem.id = 0;
        newItem.cmId = item.cmId;
        newItem.cmName = item.cmName;
        newItem.courseName = item.courseName;
        newItem.templateId = this.state.data.id;
        newItem.nbHoursCompletion = 0;
        this.setState({flags: {dataChanged: true, refresh: true}}, () => this.onSaveActTpl(newItem));
    }

    onRemove(tplActId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;
            JsNx.removeItem(data.activities, 'id', tplActId);
            that.setState({data: data, flags: {dataChanged: that.state.flags.dataChanged, refresh: true}});
        }

        $glVars.webApi.deleteActTpl(tplActId, callback);
    }

    onDataChange(event, index){
        index = (index >= 0 ? index : -1);
        let data = this.state.data;
        let flags = this.state.flags;

        if(index >= 0){
            flags.dataChanged = (data.activities[index][event.target.name] !== event.target.value);
            data.activities[index][event.target.name] = event.target.value;
        }
        else{
            flags.dataChanged = (data[event.target.name] !== event.target.value);
            data[event.target.name] = event.target.value;
        }

        flags.refresh = true;
        this.setState({data: data, flags: flags});
    }
    
    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            data.id = result.data;
            that.setState({data: data, flags: {dataChanged: false, refresh: that.state.flags.refresh}});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveTemplate(data, callback);
        }
    }

    onSaveActTpl(tplAct){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            tplAct.id = result.data;
            let data = that.state.data;
            data.activities.push(tplAct);
            that.setState({data: data, flags: {dataChanged: false, refresh: that.state.flags.refresh}});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveActTpl(tplAct, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.refresh);
    }
}