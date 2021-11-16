import React, { Component } from 'react';
import { ButtonGroup, Button, Form, FormGroup, InputGroup, FormControl, Col, Table, Badge} from 'react-bootstrap';
import { faPencilAlt,  faTrashAlt, faPlus,  faSearch, faCopy} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBox, FeedbackCtrl, DataGrid, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString } from '../libs/utils/Utils';

export class TemplatesView extends Component{
    constructor(props){
        super(props);
        
        this.onClose = this.onClose.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onClone = this.onClone.bind(this);

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
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
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
                                                <Button title="Copier" onClick={() => this.onClone(item.id)} variant="primary"><FontAwesomeIcon icon={faCopy}/></Button>
                                                <Button title="Supprimer" onClick={() =>  this.onRemove(item.id)} variant="primary"><FontAwesomeIcon icon={faTrashAlt}/></Button>
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
                FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            }
            else{
                FeedbackCtrl.instance.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
                that.getData();
            }
        };

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteTemplate(templateId, callback);
        }
    }

    onClone(templateId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            }
            else{
                FeedbackCtrl.instance.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
                that.getData();
            }
        };

        if(window.confirm($glVars.i18n.tags.msgConfirm)){
            $glVars.webApi.cloneTemplate(templateId, callback);
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
        this.onSaveTplAct = this.onSaveTplAct.bind(this);
        this.onRemoveTplAct = this.onRemoveTplAct.bind(this);
        this.onAddTplAct = this.onAddTplAct.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);

        this.state = {data: null, dropdownLists: {categoryId: "0", categoryList: [], courseId: "0", courseList: [], activityList: []}, flags: {dataChanged: false, refresh: false}};
    }

    componentDidMount(){
        this.getData();
    }

    render(){
        if(this.state.data === null){ return null; }

        let tmpActivityList = this.state.dropdownLists.activityList.filter(item => (JsNx.getItem(this.state.data.activities, 'cmId', item.cmId, null) === null) );

        let tmpCourseList = this.state.dropdownLists.courseList.filter(item => (item.data.categoryId === this.state.dropdownLists.categoryId));

        let body = 
            <div style={{display: 'grid', gridTemplateColumns: '48% 48%', gridGap: '2rem'}}>
                <div style={{backgroundColor: '#f9f9f9', padding: '1rem'}}>
                    <h6>Filtrez par catégorie et cours</h6>
                    <fieldset className="mb-3">
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>{"Catégorie"}</Form.Label>
                                <ComboBox placeholder={"Sélectionnez votre option"} name="categoryId" value={this.state.dropdownLists.categoryId} options={this.state.dropdownLists.categoryList} onChange={this.onFilterChange} />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col}>
                                <Form.Label>{"Cours"}</Form.Label>
                                <ComboBox placeholder={"Sélectionnez votre option"} name="courseId" value={this.state.dropdownLists.courseId} options={tmpCourseList} onChange={this.onFilterChange} />
                            </Form.Group>
                        </Form.Row>
                    </fieldset>
                    <div>
                        <h6>Liste d'activités <Badge variant="warning" className="p-2 rounded">{`${tmpActivityList.length}`}</Badge></h6>
                        <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                            <Table striped bordered hover>                                
                                <thead>
                                    <tr>
                                        <th>Activité</th>
                                        <th style={{width: 70}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tmpActivityList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td>{item.cmName}</td>
                                                <td style={{textAlign: 'center'}}><Button onClick={() => this.onAddTplAct(item)} size="sm" variant="primary" title="Ajouter" className="mr-2"><FontAwesomeIcon icon={faPlus}/></Button></td>
                                            </tr>

                                            return row;
                                        }
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
                <div>
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
                                <Form.Control as="textarea" rows={4}  value={this.state.data.description} onBlur={() => this.onSave(this.state.data)}  name="description" onChange={this.onDataChange} />
                            </Form.Group>
                        </Form.Row>
                        <div>
                            <h6>Activités sélectionnées <Badge variant="warning" className="p-2 rounded">{`${this.state.data.activities.length}`}</Badge></h6>
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
                                                        <td><Form.Control type="text" placeholder="" value={item.nbHoursCompletion} onBlur={() => this.onSaveTplAct(item)} name="nbHoursCompletion" onChange={(event) => this.onDataChange(event, index)} /></td>
                                                        <td><Button size="sm" variant="primary" title="Supprimer" onClick={() => this.onRemoveTplAct(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button></td>
                                                    </tr>;

                                                return row;
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>;

        let main = <Modal title={'Créer un gabarit'} body={body} onClose={this.onClose} />;

        return (main);
    }

    getData(){
        $glVars.webApi.getTemplateFormFormKit(this.props.templateId, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let categoryList = [];
        for(let item of result.data.catCourseList){
            if(JsNx.getItem(categoryList, 'value', item.categoryId, null) === null){
                categoryList.push({text: item.categoryName, value: item.categoryId});
            }
        }

        let courseList = [];
        for(let item of result.data.catCourseList){
            if(JsNx.getItem(courseList, 'value', item.courseId, null) === null){
                courseList.push({text: item.courseName, value: item.courseId, data: item});
            }
        }

        this.setState({
            data: result.data.data, 
            dropdownLists: {categoryList: categoryList, courseList: courseList, activityList: []}
        });
    }

    onAddTplAct(item){
        let newItem = {};
        newItem.id = 0;
        newItem.cmId = item.cmId;
        newItem.cmName = item.cmName;
        newItem.courseName = item.courseName;
        newItem.templateId = this.state.data.id;
        newItem.nbHoursCompletion = 0;
        this.setState({flags: {dataChanged: true, refresh: true}}, () => this.onSaveTplAct(newItem));
    }

    onRemoveTplAct(tplActId){
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

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteTplAct(tplActId, callback);
        }
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

    onFilterChange(event){
        let that = this;
        let item = this.state.dropdownLists;
        item[event.target.name] = event.target.value;

        if(event.target.name === "categoryId"){
            item.courseId = "0";
            item.activityList = [];
        }

        if(item.courseId !== "0"){
            $glVars.webApi.getCatCourseSectionActivityList(true, item.categoryId, item.courseId, (result) => {
                item.activityList = result.data;
                that.setState({dropdownLists: item});
            });
        }
        else{
            this.setState({dropdownLists: item});
        }
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

    onSaveTplAct(tplAct){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;

            if(tplAct.id === 0){
                tplAct.id = result.data.tplActId;
                data.activities.push(tplAct);
            }
            
            if(data.id === 0){
                data.id = result.data.templateId;
            }

            that.setState({data: data, flags: {dataChanged: false, refresh: that.state.flags.refresh}});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveTplAct({templateId: this.state.data.id, id: tplAct.id, cmId: tplAct.cmId, nbHoursCompletion: tplAct.nbHoursCompletion}, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.refresh);
    }
}