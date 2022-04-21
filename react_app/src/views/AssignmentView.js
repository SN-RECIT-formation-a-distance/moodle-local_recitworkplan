import React, { Component } from 'react';
import { ButtonGroup,  Button, Form, Col, Row, Table, Badge} from 'react-bootstrap';
import { faTrashAlt, faArrowRight} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {ComboBoxPlus, FeedbackCtrl, Modal} from '../libs/components/Components';
import {$glVars} from '../common/common';
import { JsNx } from '../libs/utils/Utils';
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

        this.state = {data: props.data, dropdownLists: {studentList: [], groupList: [], group: null, name: ''}, flags: {dataChanged: false}, rhythme: ''};
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
                        <Form.Label>{"Filtrez par groupe"}</Form.Label>
                        <ComboBoxPlus placeholder={"Sélectionnez votre option"} name="group" value={this.state.dropdownLists.group} options={this.state.dropdownLists.groupList} onChange={(e) => this.onFilterChange(e.target.name, e.target.value)} />
                    </Form.Group>
                </div>
                <div className='mt-4 row'>
                    <div className='col-md-6'>
                        <div style={{display: 'flex', alignItems: "center", justifyContent: "space-between"}}>
                            <strong>Liste d'élèves</strong>
                            <Form.Control className='rounded' style={{width:'200px'}} onChange={(e) => this.onFilterChange(e.target.name, e.target.value)}  type="search" value={this.state.dropdownLists.name} name='name' placeholder="Rechercher..."/>
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
                                                            <div className='d-flex align-items-center' style={{justifyContent: 'space-between'}}>
                                                                <div className='w-100'>
                                                                    <div>
                                                                        <span dangerouslySetInnerHTML={{__html: item.user.avatar}}></span>
                                                                        <strong>{`${item.user.firstName} ${item.user.lastName}`}</strong>
                                                                    </div>
                                                                    
                                                                </div>
                                                                <div>
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
                    <div className='col-12'>
                        <Form.Control className='rounded' style={{width:'180px',display:'inline'}} onChange={(e) => this.setState({rhythme:e.target.value})}  type="number" value={this.state.rhythme} name='rhythme' placeholder="Rythme (h/semaine)"/>
                        <Button variant="link" onClick={() => this.onAddSelected()}>{"Ajouter tous les utilisateurs "}<FontAwesomeIcon icon={faArrowRight}/></Button>
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

        return result;
    }

    onAdd(item){
        let newItems = [this.createNewAssignment(item)]
        this.setState({flags: {dataChanged: true}}, () => this.onSave(newItems))
    }

    onAddSelected(){
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
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment(data, callback);
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
                        <DateInput value={item.startDate} name="startDate" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"Commentaire"}</Form.Label>
                    <Col sm="10">
                        <Form.Control as="textarea" rows={4} className='w-100' name="comment" value={item.comment} onChange={this.onDataChange}/>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm="2">{"h/semaine"}</Form.Label>
                    <Col sm="10">
                        <Form.Control style={{width: '50px', display: 'inline'}} className="mr-3" type="text" value={item.nbHoursPerWeek} name="nbHoursPerWeek" onChange={this.onDataChange} />
                    </Col>
                </Form.Group>
            </Form>;

        let modalFooter = 
        <ButtonGroup>
                <Button variant='secondary' onClick={this.onClose}>Annuler</Button>
                <Button disabled={!this.state.flags.dataChanged} variant='success' className='ml-2' onClick={this.onSave}>Enregistrer</Button>
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
        }

        if(this.state.flags.dataChanged){
            $glVars.webApi.saveAssignment([this.state.data], callback);
        }
    }

    onClose(){
        this.props.onClose();
    }
}