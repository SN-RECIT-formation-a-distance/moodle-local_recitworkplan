import React, { Component } from 'react';
import { Collapse, Row, Button, Form, FormGroup, InputGroup, FormControl, Col, Table, Badge, Card, ButtonGroup} from 'react-bootstrap';
import { faPencilAlt,  faTrashAlt, faPlusSquare,  faSearch, faCopy, faSync, faMinus, faPlus, faArrowsAlt, faArrowRight} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBoxPlus, FeedbackCtrl, DataGrid, Modal, Pagination} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsString } from '../libs/utils/Utils';


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
                <Collapse in={this.state.collapse} className="mb-3 w-100">
                        <div className='row'>
                            <Form.Group className='col-md-4'>
                                <Form.Label>{"Catégorie"}</Form.Label>
                                <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="categoryId" value={this.state.dropdownLists.categoryId} options={this.state.dropdownLists.categoryList} onChange={this.onFilterChange} />
                            </Form.Group>
                            <Form.Group className='col-md-4'>
                                <Form.Label>{"Cours"}</Form.Label>
                                <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="courseId" value={this.state.dropdownLists.courseId} options={tmpCourseList} onChange={this.onFilterChange} />
                            </Form.Group>
                            <Form.Group className='col-md-4'>
                                <Form.Label>{"Section"}</Form.Label>
                                <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="sectionId" value={this.state.dropdownLists.sectionId} options={tmpSectionList} onChange={this.onFilterChange} />
                            </Form.Group>
                        </div>
                </Collapse>
                <div className='row w-100'>
                    <div style={{backgroundColor: '#f9f9f9', padding: '1rem'}} className='col-md-4'>
                        <div>
                            <h6>Liste d'activités</h6>
                            <div style={{maxHeight: 500, maxWidth: 600, overflowY: 'scroll'}}>
                                <Table striped bordered hover>                                
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
                                <DataGrid.Body>
                                    {activities.map((item, index) => {
                                            let row =
                                                <DataGrid.Body.RowDraggable data={item} onDrag={this.onDragRow} onDrop={this.onDropRow} key={index}>
                                                    <DataGrid.Body.Cell>
                                                        <div className='align-items-center' style={{display: 'grid', gridTemplateColumns: "40px calc(100% - 40px - 40px) 40px", justifyContent: 'space-between'}}>
                                                            <div>
                                                                <FontAwesomeIcon icon={faArrowsAlt} title="Déplacer l'item"/>
                                                            </div>
                                                            <div>
                                                                <div><strong>{item.cmName}</strong></div>
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

        let main = <Modal title={this.props.title} style={{maxWidth:900, width:'auto'}} body={body} onClose={this.onClose} />;

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
            $glVars.webApi.deleteTplAct(this.state.data.id, tplActId, callback);
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
            $glVars.webApi.getCatCourseSectionActivityList(false, item.categoryId, item.courseId, (result) => {
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

export class WorkPlanTemplateView extends Component{
    static defaultProps = {        
        data: null,
        onSave: null,
    };

    constructor(props){
        super(props);

        this.onSave = this.onSave.bind(this);

        this.state = {editModal: false};
        if (this.props.data.template.id === 0){
            this.state.editModal = true;
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data.template.id != this.props.data.template.id && this.props.data.template.id === 0){
            this.setState({editModal: true});
        }
    }

    render(){
        if(this.state.data === null){ return null;}

        let template = this.props.data.template;
        let data = this.props.data;

        let nbHoursCompletionTotal = 0;
        let catList = "";
        let categories = [];
        for (let act of template.activities){
            if (!categories.includes(act.categoryName)){
                categories.push(act.categoryName);
                catList = catList + act.categoryName + ", ";
            }
            nbHoursCompletionTotal = nbHoursCompletionTotal + parseFloat(act.nbHoursCompletion);
        }
        catList = catList.substring(0,catList.length-2);

        let main =  
            <>
                <Card>
                    <Card.Body>
                        <div className='h4 mb-4'>Description <Button title="Éditer" variant="outline-primary" className='rounded-circle' onClick={() => this.setState({editModal:true})}><FontAwesomeIcon icon={faPencilAlt}/></Button></div>
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Nom</Col>
                            <Col sm={10} className='bg-light border border-secondary p-2 rounded'>{data.template.name}</Col>
                        </Row>
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Description</Col>
                            <Col sm={10} className='bg-light border border-secondary p-2 rounded'>{data.template.description}</Col>
                        </Row>
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>URL de communication</Col>
                            <Col sm={10} className='bg-light border border-secondary p-2 rounded'><a target="_blank" href={data.template.communication_url}>{data.template.communication_url}</a></Col>
                        </Row>             
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Temps à consacrer</Col>
                            <Col sm={10} className='bg-light border border-secondary p-2 rounded'>{`${nbHoursCompletionTotal} heures`}</Col>
                        </Row> 
                        <Row className='m-2'>
                            <Col className='text-muted' sm={2}>Catégories de cours</Col>
                            <Col sm={10} className=' bg-light border border-secondary p-2 rounded'>
                                {catList}
                            </Col>
                        </Row> 
                    </Card.Body>
                </Card>
                {this.state.editModal && <ModalTemplateForm data={data} onClose={() => this.setState({editModal:false})} onSave={this.onSave}/>}
            </>      
            
        return (main);
    }

    onSave(template){
        this.setState({editModal:false}, () => this.props.onSave(template));
    }
}

class ModalTemplateForm extends Component{
    static defaultProps = {        
        data: null,
        onClose: null,
        onSave: null
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSave = this.onSave.bind(this);

        this.state = {data: JsNx.clone(this.props.data)}
    }

    render(){
        let data = this.state.data;

        if(data === null){ return null;}

        let modalBody = 
            <Form>
                <div className='h3 mb-4'>Description</div>
                <Form.Group as={Row} >
                    <Form.Label column sm="2">{"Nom"}</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" value={data.template.name} name="name" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"Description"}</Form.Label>
                    <Col sm="10">
                        <Form.Control as="textarea" rows={4} className='w-100' value={data.template.description} name="description" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"URL de communication"}</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" className='w-100' value={data.template.communication_url} name="communication_url" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{""}</Form.Label>
                    <Col sm="10">
                        <Form.Check type="checkbox" label="Enregistrer en tant que gabarit" rows={4} className='w-100' disabled={data.assignments.length > 1} checked={data.template.state == 1} name="state" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
            </Form>;

        let modalFooter = 
            <ButtonGroup>
                    <Button variant='secondary' onClick={this.props.onClose}>Annuler</Button>
                    <Button variant='success' className='ml-2' onClick={this.onSave}>Enregistrer</Button>
            </ButtonGroup>;

        return <Modal title="Modifier gabarit" body={modalBody} onClose={this.props.onClose} footer={modalFooter}/>
    }

    onDataChange(event){
        let data = this.state.data;

        if(data.template[event.target.name] !== event.target.value){
            //Exception for state/checkbox
            if (event.target.name === 'state'){
                data.template[event.target.name] = event.target.checked ? 1 : 0;
            }
            else{
                data.template[event.target.name] = event.target.value
            }
            
            this.setState({data:data});
        }
    }

    onSave(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }
            that.props.onSave(result.data);            
        }
        
        $glVars.webApi.saveTemplate(this.state.data.template, callback);
    }
}