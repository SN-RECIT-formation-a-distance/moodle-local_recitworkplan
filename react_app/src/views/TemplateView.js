import React, { Component } from 'react';
import { Collapse, ButtonGroup, Button, Form, FormGroup, InputGroup, FormControl, Col, Table, Badge, Card} from 'react-bootstrap';
import { faPencilAlt,  faTrashAlt, faPlusSquare,  faSearch, faCopy, faSync, faMinus, faPlus, faArrowsAlt, faArrowRight} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBoxPlus, FeedbackCtrl, DataGrid, Modal, Pagination} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString } from '../libs/utils/Utils';

export class TemplatesView extends Component{
    constructor(props){
        super(props);
        
        this.onClose = this.onClose.bind(this);
        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onClone = this.onClone.bind(this);

        this.state = {dataProvider: [], templateId: -1, queryStr: "", pagination: {current_page: 1, count: 0, item_per_page: 25}};
    }

    componentDidMount(){
      //  $glVars.webApi.addObserver("TemplatesView", this.getData, ['saveTemplate']);        
        this.getData();
    }

    componentWillUnmount(){
      //  $glVars.webApi.removeObserver("TemplatesView");
    }

    getData(){
        $glVars.webApi.getTemplateList(this.state.pagination.item_per_page, this.state.pagination.current_page - 1, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let pagination = this.state.pagination;
        pagination.current_page = parseInt(result.data.current_offset) + 1; 
        pagination.count = parseInt(result.data.total_count);
        this.setState({dataProvider: result.data.items, templateId: -1, pagination: pagination});
    }

    changePage(page){
        let pagination = this.state.pagination;
        pagination.current_page = page
        this.setState({pagination: pagination}, this.getData);
    }

    render(){
        let dataProvider = this.state.dataProvider;
        let regexp = UtilsString.getRegExp(this.state.queryStr);
        let that = this;

        if(this.state.queryStr.length > 0){
            
            dataProvider = dataProvider.filter(function(item){
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
                <ButtonToolbar className="mb-4 justify-content-end">
                    <ButtonGroup className="mr-1">
                        <Button  title="Ajouter" onClick={() => this.setState({templateId: 0})} variant="primary"><FontAwesomeIcon icon={faPlusSquare}/>{" Créer un gabarit"}</Button>
                    </ButtonGroup>
                    <ButtonGroup >
                        <Button  title="Actualiser" onClick={() => this.getData()} variant="primary"><FontAwesomeIcon icon={faSync}/></Button>
                    </ButtonGroup>
                </ButtonToolbar>

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
                                        <DataGrid.Body.Cell>{(this.state.pagination.item_per_page * (this.state.pagination.current_page-1)) + index + 1}</DataGrid.Body.Cell>
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
                <Pagination pagination={this.state.pagination} onChangePage={(p) => this.changePage(p)}/>
                {this.state.templateId >= 0 && <ModalTemplateForm templateId={this.state.templateId} title={this.state.templateId == 0 ? 'Créer un gabarit' : 'Modifer un gabarit'} onClose={this.onClose}/>}
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

        if(window.confirm($glVars.i18n.tags.msgConfirmClone)){
            $glVars.webApi.cloneTemplate(templateId, callback);
        }
    }
}

export class ActivityPicker extends Component{
    static defaultProps = {        
        templateId: 0,
        onClose: null,
        title: "Sélecteur d'activités"
    };

    constructor(props){
        super(props);

        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onSaveTplAct = this.onSaveTplAct.bind(this);
        this.onRemoveTplAct = this.onRemoveTplAct.bind(this);
        this.onAddTplAct = this.onAddTplAct.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
        this.onDragRow = this.onDragRow.bind(this);
        this.onDropRow = this.onDropRow.bind(this);

        this.state = {
            data: null, 
            collapse: true, 
            draggingItem: null, 
            dropdownLists: {
                categoryId: "0", 
                categoryList: [], 
                courseId: "0", 
                courseList: [], 
                sectionId: "0", 
                sectionList: [], 
                activityList: []
            }, 
            flags: {
                dataChanged: false
            }
        };
    }

    componentDidMount(){
        this.getData();
    }

    render(){
        if(this.state.data === null){ return null; }

        let tmpActivityList = this.state.dropdownLists.activityList.filter(item => (JsNx.getItem(this.state.data.activities, 'cmId', item.cmId, null) === null && item.sectionId === this.state.dropdownLists.sectionId) );

        let tmpCourseList = this.state.dropdownLists.courseList.filter(item => (item.data.categoryId === this.state.dropdownLists.categoryId));
        
        let tmpSectionList = this.state.dropdownLists.sectionList.filter(item => (item.courseId === this.state.dropdownLists.courseId));

        let activities = this.state.data.activities.sort((item, item2) => { return item.slot - item2.slot });

        let body = 
            <div className='d-flex flex-wrap'>
                <div className='w-100 d-flex align-items-center mb-3'>
                    <span className='h4'>Filtrez par catégorie et cours</span>
                    <Button variant="link" size="sm" onClick={() => {this.setState({collapse: !this.state.collapse})}}>
                        {this.state.collapse ? <FontAwesomeIcon icon={faMinus}/> : <FontAwesomeIcon icon={faPlus}/>}
                    </Button>
                </div>
                <Collapse in={this.state.collapse} className="mb-3">
                    <div>
                        <div style={{display: 'grid', gridGap: "1rem", gridTemplateColumns: "auto auto auto"}}>
                            <Form.Group as={Col} >
                                <Form.Label>{"Catégorie"}</Form.Label>
                                <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="categoryId" value={this.state.dropdownLists.categoryId} options={this.state.dropdownLists.categoryList} onChange={this.onFilterChange} />
                            </Form.Group>
                            <Form.Group as={Col} >
                                <Form.Label>{"Cours"}</Form.Label>
                                <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="courseId" value={this.state.dropdownLists.courseId} options={tmpCourseList} onChange={this.onFilterChange} />
                            </Form.Group>
                            <Form.Group as={Col} >
                                <Form.Label>{"Section"}</Form.Label>
                                <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="sectionId" value={this.state.dropdownLists.sectionId} options={tmpSectionList} onChange={this.onFilterChange} />
                            </Form.Group>
                        </div>
                    </div>
                </Collapse>
                <div className='row w-100'>
                    <div style={{backgroundColor: '#f9f9f9', padding: '1rem'}} className='col-md-4'>
                        <div>
                            <h6>Liste d'activités</h6>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>                                
                                    <thead>
                                        <tr>
                                            <th>Activité</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tmpActivityList.map((item, index) => {
                                            let row =
                                                <tr key={index}>
                                                    <td>
                                                        {item.cmName}
                                                        <Button onClick={() => this.onAddTplAct(item)} variant="link" title="Ajouter" className="mr-2 float-right"><FontAwesomeIcon icon={faArrowRight}/></Button>
                                                    </td>
                                                </tr>

                                                return row;
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-8'>
                        <h6>Activités sélectionnées <Badge variant="warning" className="p-2 rounded">{`${this.state.data.activities.length}`}</Badge></h6>
                        <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                            <DataGrid>
                                <DataGrid.Header>
                                    <DataGrid.Header.Row>
                                        <DataGrid.Header.Cell>Cours/Activité</DataGrid.Header.Cell>
                                    </DataGrid.Header.Row>
                                </DataGrid.Header>
                                <DataGrid.Body>
                                    {activities.map((item, index) => {
                                            let row =
                                                <DataGrid.Body.RowDraggable data={item} onDrag={this.onDragRow} onDrop={this.onDropRow} key={index}>
                                                    <DataGrid.Body.Cell>
                                                        <div className='d-flex align-items-center' style={{justifyContent: 'space-between'}}>
                                                            <div>
                                                                <FontAwesomeIcon icon={faArrowsAlt} title="Déplacer l'item"/>
                                                            </div>
                                                            <div>
                                                                <div>{item.cmName}</div>
                                                                <span className='text-muted'>{item.courseName}</span>
                                                                <div className='d-flex align-items-center'>
                                                                    <Form.Control className='mr-3' style={{width: '100px'}} type="text" placeholder="Durée" value={item.nbHoursCompletion} onBlur={() => this.onSaveTplAct(item)} name="nbHoursCompletion" onChange={(event) => this.onDataChange(event, index)} />
                                                                    <span>heures</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Button variant="link" title="Supprimer" onClick={() => this.onRemoveTplAct(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                                            </div>
                                                        </div>
                                                    </DataGrid.Body.Cell>
                                                </DataGrid.Body.RowDraggable>;

                                            return row;
                                        }
                                    )}
                                </DataGrid.Body>
                            </DataGrid>
                        </div>
                    </div>
                </div>                
            </div>;

        let main = <Modal title={this.props.title} width="60%" body={body} onClose={this.onClose} />;

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
        let list = this.state.dropdownLists;

        list.categoryList = [];
        for(let item of result.data.catCourseList){
            if(JsNx.getItem(list.categoryList, 'value', item.categoryId, null) === null){
                list.categoryList.push({label: item.categoryName, value: item.categoryId});
            }
        }

        list.courseList = [];
        for(let item of result.data.catCourseList){
            if(JsNx.getItem(list.courseList, 'value', item.courseId, null) === null){
                let isDisabled = !item.roles && !item.categoryroles;
                list.courseList.push({label: item.courseName, value: item.courseId, data: item, isDisabled: isDisabled});
            }
        }

        this.setState({
            data: result.data.data, 
            dropdownLists: list
        });
    }

    onDragRow(item, index){
        this.setState({draggingItem: item});
    }

    onDropRow(item, index){
        let data = this.state.data;
        item = JsNx.getItem(data.activities, 'id', item.id, null);
        let draggingItem = JsNx.getItem(data.activities, 'id', this.state.draggingItem.id, null);
        
        if(item.id === draggingItem.id){ return; }

        let oldSlot = item.slot;
        item.slot = draggingItem.slot;
        draggingItem.slot = oldSlot;

        this.setState({flags: {dataChanged: true}}, () => {this.onSaveTplAct(item); this.onSaveTplAct(draggingItem)});
    }

    onAddTplAct(item){
        let newItem = {};
        newItem.id = 0;
        newItem.slot = this.state.data.activities.length + 1;
        newItem.cmId = item.cmId;
        newItem.cmName = item.cmName;
        newItem.courseName = item.courseName;
        newItem.templateId = this.state.data.id;
        newItem.nbHoursCompletion = 0;
        this.setState({flags: {dataChanged: true}}, () => this.onSaveTplAct(newItem));
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
            that.setState({data: data, flags: {dataChanged: true}});
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

        this.setState({data: data, flags: flags});
    }

    onFilterChange(event){
        let that = this;
        let item = this.state.dropdownLists;
        item[event.target.name] = event.target.value;

        if(event.target.name === "categoryId"){
            item.courseId = "0";
            item.activityList = [];
            item.sectionList = [];
        }

        if(item.courseId !== "0"){
            $glVars.webApi.getCatCourseSectionActivityList(true, item.categoryId, item.courseId, (result) => {
                item.activityList = result.data;
                item.sectionList = [];
                for (let v of result.data){
                    if(JsNx.getItem(item.sectionList, 'value', v.sectionId, null) === null){
                        let sectionName = v.sectionName;
                        item.sectionList.push({label: sectionName, value: v.sectionId, courseId: v.courseId});
                    }
                }
                that.setState({dropdownLists: item});
            });
        }
        else{
            this.setState({dropdownLists: item});
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

            that.setState({data: data});
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveTplAct({templateId: this.state.data.id, id: tplAct.id, cmId: tplAct.cmId, nbHoursCompletion: tplAct.nbHoursCompletion, slot: tplAct.slot}, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.dataChanged);
    }
}