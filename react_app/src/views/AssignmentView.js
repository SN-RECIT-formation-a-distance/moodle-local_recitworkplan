import React, { Component } from 'react';
import { ButtonGroup,  Button, Form, Col, Row, Table, Badge} from 'react-bootstrap';
import { faTrashAlt, faArrowRight} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBoxPlus, DataGrid, FeedbackCtrl, InputNumber, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx, UtilsDateTime } from '../libs/utils/Utils';
import {CustomFormControl} from './Components'
import { DateInput } from '../libs/components/DateTime';

export class ModalAssignmentPicker extends Component{
    static defaultProps = {        
        data: null,
        onClose: null
    };

    constructor(props){
        super(props);

        this.getData = this.getData.bind(this);
        this.getDataResult = this.getDataResult.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onAdd = this.onAdd.bind(this);

        this.state = {data: props.data, dropdownLists: {studentList: [], groupList: [], group: null, name: ''}, flags: {dataChanged: false},};
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        $glVars.webApi.getStudentList(this.state.data.template.id, this.getDataResult);
    }

    getDataResult(result){
        if(!result.success){
            FeedbackCtrl.instance.showError($glVars.i18n.tags.appName, result.msg);
            return;
        }

        let lists = this.state.dropdownLists;
        lists.studentList = result.data;

        lists.groupList = [];
        for (let user of result.data){
            for (let g of user.groupList){
                if (!lists.groupList.includes(g)){
                    lists.groupList.push(g);
                }
            }
        }
        for (let k in lists.groupList){
            lists.groupList[k] = {label: lists.groupList[k], value: lists.groupList[k]};
        }
        lists.groupList.unshift({label: '', value: null});

        this.setState({
            dropdownLists: lists
        });
    }

    getFilteredStudentList(){
        return this.state.dropdownLists.studentList.filter((item) => {
            let found = false;
            for(let assignment of this.state.data.assignments){
                if(parseInt(assignment.user.id, 10) === parseInt(item.userId, 10)){
                    found = true;
                    break;
                }
            }
            let show = true;
            if (found) show = false;
            if (this.state.dropdownLists.group && !item.groupList.includes(this.state.dropdownLists.group)) show = false;
            let fullname = `${item.firstName} ${item.lastName}`;
            if (this.state.dropdownLists.name.length > 1 && !fullname.toLowerCase().includes(this.state.dropdownLists.name.toLowerCase())) show = false;
            return show;
        });
    }

    render(){
        if(this.state.data === null){ return null; }

        let studentList = this.getFilteredStudentList();

        let body = 
            <div>
                <div>
                    <Form.Group as={Col}>
                        <Form.Label>{"Filtrer par groupe"}</Form.Label>
                        <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="group" value={this.state.dropdownLists.group} options={this.state.dropdownLists.groupList} onChange={(e) => this.onFilterChange(e.target.name, e.target.value)} />
                    </Form.Group>
                </div>
                <div className='mt-4 row'>
                    <div className='col-md-6'>
                        <div style={{display: 'flex', alignItems: "center", justifyContent: "space-between"}}>
                            <strong>Liste d'élèves</strong>
                            <CustomFormControl style={{width:'200px'}} onChange={(e) => this.onFilterChange(e.target.name, e.target.value)}  type="search" value={this.state.dropdownLists.name} name='name' placeholder="Rechercher..."/>
                        </div>
                        
                        <div className='mt-2 mb-2' style={{maxHeight: 500, overflowY: 'auto'}}>
                            <Table striped bordered hover>                                
                                <tbody>
                                    {studentList.map((item, index) => {
                                        let row =
                                            <tr key={index}>
                                                <td style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                                    <a href={item.userUrl} target="_blank"><span dangerouslySetInnerHTML={{__html: item.avatar}}></span>{`${item.firstName} ${item.lastName}`}</a>
                                                    <Button onClick={() => this.onAdd(item)} variant="link" title="Ajouter"><FontAwesomeIcon icon={faArrowRight}/></Button>
                                                </td>
                                            </tr>

                                            return row;
                                        }
                                    )}
                                    {studentList.length == 0 && <tr><td className='text-muted'>Pas de données</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                    <div className='col-md-6'>
                        <div>
                            <h6>Élèves assignés <Badge variant="warning" className="p-2 rounded">{`${this.state.data.assignments.length}`}</Badge></h6>
                            <div style={{maxHeight: 500, overflowY: 'scroll'}}>
                                <Table striped bordered hover>
                                    <tbody>
                                        {this.state.data.assignments.map((item, index) => {
                                                let row =
                                                    <tr key={index}>
                                                        <td>
                                                            <div className='d-flex'>
                                                                <div className='col-md-10'>
                                                                    <div>
                                                                        <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                                                        <strong>{`${item.user.firstName} ${item.user.lastName}`}</strong>
                                                                    </div>
                                                                    
                                                                </div>
                                                                <div className='col-md-1'>
                                                                    <Button variant="link" title="Supprimer" onClick={() => this.onDelete(item.id)}><FontAwesomeIcon icon={faTrashAlt}/></Button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>;

                                                return row;
                                            }
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className='col-6 p-3'>
                        <Button variant="primary" className='w-100' onClick={() => this.onAddSelected()}>{"Ajouter tous les utilisateurs "}</Button>
                    </div>
                </div>
            </div>;

        let main = <Modal title={'Attribuer un plan de travail'} body={body} style={{maxWidth:900, width:'auto'}} onClose={this.onClose} />;

        return (main);
    }

    onFilterChange(k, v){
        let list = this.state.dropdownLists;
        list[k] = v;
        this.setState({dropdownLists:list});
    }

    createNewAssignment(item){
        let result = {
            id: 0,
            templateId: this.state.data.template.id,
            user: {id: item.userId, firstName: item.firstName, lastName: item.lastName, avatar: item.avatar},
            nbHoursPerWeek: this.state.rhythme == '' ? 0 : this.state.rhythme,
            comment: '',
            startDate: new Date()
        };
        if (isNaN(result.nbHoursPerWeek)) result.nbHoursPerWeek = 0;

        return result;
    }

    onAdd(item){
        let newItems = [this.createNewAssignment(item)]
        this.setState({flags: {dataChanged: true}}, () => this.onSave(newItems))
    }

    onAddSelected(){
        if (!confirm('Confirmez-vous cette opération: ajouter tous les utilisateurs?')) return;
        let newItems = []
        let studentList = this.getFilteredStudentList();
        for (let item of studentList){
            newItems.push(this.createNewAssignment(item));
        }
        this.setState({flags: {dataChanged: true}}, () => this.onSave(newItems))
    }

    onDelete(assignmentId){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let data = that.state.data;
            JsNx.removeItem(data.assignments, 'id', assignmentId);
            that.setState({data: data, flags: {dataChanged: true}});
            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }

        if(window.confirm($glVars.i18n.tags.msgConfirmDeletion)){
            $glVars.webApi.deleteAssignment(assignmentId, callback);
        }
    }

    onDataChange(event, index){
        let tmp = this.state.data;
        let flags = this.state.flags;
        flags.dataChanged = (tmp.assignments[index][event.target.name] !== event.target.value);
        tmp.assignments[index][event.target.name] = event.target.value;
        this.setState({data: tmp, flags: flags});
    }

    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let index = 0;
            for (let item of data){
                if(parseInt(item.id,10) === 0){
                    item.id = result.data[index];
                    let tmp = that.state.data;
                    tmp.assignments.push(item);
                    that.setState({data: tmp});
                }
                index++;
            }
            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.dataChanged);
    }
}

export class ModalAssignmentMassActions extends Component{
    static defaultProps = {        
        data: null,
        onClose: null
    };

    constructor(props){
        super(props);

        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {data: props.data, flags: {dataChanged: false}, rhythme: 0, nbAdditionalHours: 0, additionalHoursReason: ''};
    }


    render(){
        if(this.state.data === null){ return null; }

        let body = 
            <div>
                <div className='mt-4 row'>
                    <div className='col-md-6'>
                        <div>
                            <h5>Élèves assignés <Badge variant="warning" className="p-2 rounded">{`${this.state.data.assignments.length}`}</Badge></h5>
                            <div style={{maxHeight: 500, overflowY: 'auto'}}>
                                <div style={{display:'flex',flexFlow:'wrap'}}>
                                        {this.state.data.assignments.map((item, index) => {
                                                let row =
                                                    <div key={index} className='m-1 p-2 d-flex align-items-center'>
                                                        <div>
                                                            <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                                        </div>
                                                        <div>
                                                            <strong>{`${item.user.firstName} ${item.user.lastName}`}</strong><br/>
                                                            <span className='text-muted'>Rythme: {item.nbHoursPerWeek}h/semaine</span><br/>
                                                            <span className='text-muted'>{item.nbAdditionalHours}h supplémentaires</span>
                                                        </div>
                                                    </div>;

                                                return row;
                                            }
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-6'>
                       <span className='h5 bold mb-3'>Actions en lot pour tous les élèves assignés</span>
                       <div className='p-3 mb-3 border rounded'>
                        <div className='h6 bold mb-3'>Assigner le rythme par semaine</div>
                            <Form.Group as={Row}>
                                <Form.Label column sm="5">{"Rythme (h/semaine)"}</Form.Label>
                                <Col sm="7">
                                    <InputNumber style={{display:'inline'}} onChange={(e) => this.setState({rhythme:e.target.value})} value={this.state.rhythme} name='rhythme' placeholder="Rythme (h/semaine)"/>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Col sm="5"></Col>
                                <Col sm="7">
                                    <Button variant="primary" className="rounded" onClick={() => this.onSetRythme()}>{"Assigner"}</Button>
                                </Col>
                            </Form.Group>
                        </div>
                       <div className='p-3 mb-3 border rounded'>
                            <div className='h6 bold mb-3'>Ajouter des heures supplémentaires</div>
                            <Form.Group as={Row}>
                                <Form.Label column sm="5">{"Heures supplémentaires"}</Form.Label>
                                <Col sm="7">
                                    <InputNumber style={{display:'inline'}} onChange={(e) => this.setState({nbAdditionalHours:e.target.value})} value={this.state.nbAdditionalHours} placeholder="Heures"/>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column sm="5">{"Raison"}</Form.Label>
                                <Col sm="7">
                                    <CustomFormControl style={{display:'inline'}} max="250" onChange={(e) => this.setState({additionalHoursReason:e.target.value})}  type="text" value={this.state.additionalHoursReason}/>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Col sm="5"></Col>
                                <Col sm="7">
                                    <Button variant="primary" className="rounded"  disabled={this.state.additionalHoursReason.length == 0} onClick={() => this.onAddAdditionalHours()}>{"Ajouter"}</Button>
                                </Col>
                            </Form.Group>
                        </div>
                    </div>
                    
                </div>
            </div>;

        let main = <Modal title={'Actions en lot'} body={body} style={{maxWidth: 1050, width:'auto'}} onClose={this.onClose} />;

        return (main);
    }


    onSetRythme(){
        if (!confirm('Confirmez-vous cette opération: assigner le rythme à tous les utilisateurs?')) return;
        let newItems = []
        for (let item of this.state.data.assignments){
            item.nbHoursPerWeek = this.state.rhythme;
            newItems.push(item);
        }
        this.setState({flags: {dataChanged: true}}, () => this.onSave(newItems))
    }

    onAddAdditionalHours(){
        if (!confirm('Confirmez-vous cette opération: ajouter des heures supplémentaires à tous les utilisateurs?')) return;
        let newItems = []
        for (let item of this.state.data.assignments){
            let add = {};
            add.id = item.id;
            add.nbAdditionalHours = parseFloat(this.state.nbAdditionalHours);
            add.additionalHoursReason = this.state.additionalHoursReason;
            add.templateId = this.state.data.template.id;
            newItems.push(add);
            item.nbAdditionalHours += add.nbAdditionalHours; //Update local cache
        }
        this.setState({flags: {dataChanged: true}}, () => this.onSaveAdditionalHours(newItems))
    }

    onSave(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let index = 0;
            for (let item of data){
                if(parseInt(item.id,10) === 0){
                    item.id = result.data[index];
                    let tmp = that.state.data;
                    tmp.assignments.push(item);
                    that.setState({data: tmp});
                }
                index++;
            }
            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
        }
    }

    onSaveAdditionalHours(data){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            let index = 0;
            for (let item of data){
                if(parseInt(item.id,10) === 0){
                    item.id = result.data[index];
                    let tmp = that.state.data;
                    tmp.assignments.push(item);
                    that.setState({data: tmp});
                }
                index++;
            }
            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.addAssignmentAdditionalHours(data, callback);
        }
    }

    onClose(){
        this.props.onClose(this.state.flags.dataChanged);
    }
}

export class ModalAssignmentForm extends Component{
    static defaultProps = {        
        data: null,
        onClose: null
    };

    constructor(props){
        super(props);

        this.onSave = this.onSave.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {data: JsNx.clone(props.data), flags: {dataChanged: false}};
    }

    render(){
        if(this.state.data === null){ return null; }

        let item = this.state.data;
        let body = 
            <Form>
                <Form.Group as={Row} >
                    <Form.Label column sm="2">{"Début"}</Form.Label>
                    <Col sm="10">
                        <DateInput className="rounded" value={item.startDate} name="startDate" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"Commentaire"}</Form.Label>
                    <Col sm="10">
                        <CustomFormControl as="textarea" rows={4} className='w-100' name="comment" value={item.comment} onChange={this.onDataChange}/>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"h/semaine"}</Form.Label>
                    <Col sm="10">
                        <InputNumber style={{width: '80px', display: 'inline'}} className="mr-3" value={item.nbHoursPerWeek} name="nbHoursPerWeek" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
            </Form>;

        let modalFooter = 
        <ButtonGroup>
                <Button variant='secondary' className='rounded' onClick={this.onClose}>Annuler</Button>
                <Button disabled={!this.state.flags.dataChanged} variant='success' className='ml-2 rounded' onClick={this.onSave}>Enregistrer</Button>
        </ButtonGroup>;


        let main = <Modal title={'Modifier élève'} body={body} footer={modalFooter} width="800px" onClose={this.onClose} />;

        return (main);
    }

    onDataChange(event, index){
        let data = this.state.data;
        let flags = this.state.flags;
        flags.dataChanged = (data[event.target.name] != event.target.value);
        data[event.target.name] = event.target.value;
        this.setState({data: data, flags: flags});
    }

    onSave(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            that.props.onClose(that.state.flags.dataChanged);
            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment([this.state.data], callback);
        }
    }

    onClose(){
        this.props.onClose();
    }
}


export class ModalAssignmentAdditionalHoursForm extends Component{
    static defaultProps = {        
        data: null,
        templateId: null,
        onClose: null
    };

    constructor(props){
        super(props);

        this.onSave = this.onSave.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {data: {id: props.data.id, templateId: props.templateId, nbAdditionalHours: 0, additionalHoursReason: ''}, flags: {dataChanged: false}};
    }

    render(){
        if(this.state.data === null){ return null; }

        let item = this.state.data;
        let body = 
            <Form>
                <Form.Group as={Row}>
                    <Form.Label column sm="5">{"Heures supplémentaires"}</Form.Label>
                    <Col sm="7">
                        <InputNumber style={{width: '80px', display: 'inline'}} className="mr-3" type="number" value={item.nbAdditionalHours} name="nbAdditionalHours" onChange={this.onDataChange} />
                        <Form.Text className="text-muted">Le nombre peut être négatif.</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="5">{"Raison"}</Form.Label>
                    <Col sm="7">
                        <CustomFormControl style={{display:'inline'}} onChange={this.onDataChange} max="250" name="additionalHoursReason" type="text" value={item.additionalHoursReason}/>
                    </Col>
                </Form.Group>
            </Form>;

        let modalFooter = 
        <ButtonGroup>
                <Button variant='secondary' className='rounded' onClick={this.onClose}>Annuler</Button>
                <Button disabled={!this.state.flags.dataChanged || item.additionalHoursReason.length == 0} variant='success' className='ml-2 rounded' onClick={this.onSave}>Enregistrer</Button>
        </ButtonGroup>;


        let main = <Modal title={'Ajout d\'heures supplémentaires'} body={body} footer={modalFooter} width="500px" onClose={this.onClose} />;

        return (main);
    }

    onDataChange(event, index){
        let data = this.state.data;
        let flags = this.state.flags;
        flags.dataChanged = (data[event.target.name] != event.target.value);
        data[event.target.name] = event.target.value;
        this.setState({data: data, flags: flags});
    }

    onSave(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            that.props.onClose(that.state.flags.dataChanged);
            $glVars.feedback.showInfo($glVars.i18n.tags.appName, $glVars.i18n.tags.msgSuccess, 3);
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.addAssignmentAdditionalHours([this.state.data], callback);
        }
    }

    onClose(){
        this.props.onClose();
    }
}

export class ModalAssignmentAdditionalHoursHistory extends Component{
    static defaultProps = {        
        data: null,
        onClose: null
    };

    constructor(props){
        super(props);

        this.onClose = this.onClose.bind(this);

        this.state = {data: props.data, history: null};
    }

    componentDidMount(){
        this.getData();
    }

    render(){
        if(this.state.history === null){ return null; }

        let body = 
            <div style={{maxHeight:'600px',overflowY:'auto'}}>
                    <DataGrid orderBy={true} style={{wordBreak:'break-all'}}>
                        <DataGrid.Header>
                            <DataGrid.Header.Row>
                                <DataGrid.Header.Cell style={{width: "170px"}}>Date</DataGrid.Header.Cell>
                                <DataGrid.Header.Cell style={{width: "100px"}}>Heures</DataGrid.Header.Cell>
                                <DataGrid.Header.Cell style={{width: "215px"}}>Responsable</DataGrid.Header.Cell>
                                <DataGrid.Header.Cell >Raison</DataGrid.Header.Cell>
                            </DataGrid.Header.Row>
                        </DataGrid.Header>
                        <DataGrid.Body>
                            {this.state.history.map((item, index) => {   
                                // all items (children) need to be inside a single array otherwise the orderby won't work                                 
                                    let items =  [];
                                    let date = UtilsDateTime.toTimeString(item.lastupdate)

                                    let cell = 
                                        <DataGrid.Body.Cell sortValue={date}  key={items.length} freezing={true}>
                                            {date}
                                        </DataGrid.Body.Cell>;

                                    items.push(cell);

                                    cell = 
                                        <DataGrid.Body.Cell sortValue={item.nb_additional_hours}  key={items.length} freezing={true}>
                                            {item.nb_additional_hours}h
                                        </DataGrid.Body.Cell>;

                                    items.push(cell);


                                    cell = 
                                        <DataGrid.Body.Cell sortValue={item.assignorname}  key={items.length} freezing={true}>
                                            {item.assignorname}
                                        </DataGrid.Body.Cell>;

                                    items.push(cell);

                                    cell = 
                                        <DataGrid.Body.Cell sortValue={item.comment}  key={items.length} freezing={true}>
                                            {item.comment}
                                        </DataGrid.Body.Cell>;

                                    items.push(cell);
                                        
                                    return (<DataGrid.Body.Row key={index}>{items}</DataGrid.Body.Row>);                                    
                                }
                            )}
                        </DataGrid.Body>
                    </DataGrid>
            </div>;


        let main = <Modal title={'Heures supplémentaires de '+this.state.data.user.firstName+' '+this.state.data.user.lastName} body={body} style={{maxWidth: 1000, width: 'auto'}} onClose={this.onClose} />;

        return (main);
    }

    getData(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.tags.appName, result.msg);
                return;
            }

            that.setState({history: result.data})
        }

        $glVars.webApi.getAssignmentAdditionalHours(this.state.data.id, callback);
    }

    onClose(){
        this.props.onClose();
    }
}