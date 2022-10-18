import {WebApi, JsNx} from '../libs/utils/Utils';
import { Options } from './Options';

export class AppWebApi extends WebApi
{    
    constructor(){
        super(Options.getGateway());
                
        this.http.useCORS = true;
        this.sid = 0;
        this.observers = [];
        this.http.timeout = 30000; // 30 secs
    }

    addObserver(id, update, observables){
        this.observers.push({id:id, update:update, observables: observables});
    }

    removeObserver(id){
        JsNx.removeItem(this.observers, "id", id);
    }

    notifyObservers(observable){
        for(let o of this.observers){
            if(o.observables.includes(observable)){
                o.update();
            }
        }
    }
    
    getWorkPlanList(limit, offset, state, forStudent, userId, onSuccess){
        let data = {limit: limit, offset: offset, forStudent: forStudent, state: state, userId: userId, service: "getWorkPlanList"};
        this.post(this.gateway, data, onSuccess);
    }

    getWorkPlan(templateId, studentId, onSuccess){
        let data = {templateId: templateId, studentId: studentId || 0, service: "getWorkPlan"};
        this.post(this.gateway, data, onSuccess);
    }

    getWorkPlanFormKit(templateId, forStudent, onSuccess){
        let data = {templateId: templateId, forStudent: forStudent, service: "getWorkPlanFormKit"};
        this.post(this.gateway, data, onSuccess);
    }

    deleteWorkPlan(templateId, onSuccess){
        let data = {templateId: templateId, service: "deleteWorkPlan"};
        this.post(this.gateway, data, onSuccess);
    }

    getStudentList(templateId, onSuccess){
        let data = {templateId: templateId, service: "getStudentList"};
        this.post(this.gateway, data, onSuccess);
    } 

    getTeacherList(templateId, onSuccess){
        let data = {templateId: templateId, service: "getTeacherList"};
        this.post(this.gateway, data, onSuccess);
    } 

    saveTemplate(data, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveTemplate');
            }
        };

        let options = {data: data, service: "saveTemplate"};
        this.post(this.gateway, options, onSuccessTmp);
    }

    saveAssignment(data, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveAssignment');
            }
        };

        let options = {data: data, service: "saveAssignment"};
        this.post(this.gateway, options, onSuccessTmp);
    }

    deleteAssignment(assignmentId, onSuccess){
        let data = {assignmentId: assignmentId, service: "deleteAssignment"};
        this.post(this.gateway, data, onSuccess);
    }

    getTemplateFormFormKit(templateId, onSuccess){
        let data = {templateId: templateId, service: "getTemplateFormFormKit"};
        this.post(this.gateway, data, onSuccess);
    }   

    getCatCourseSectionActivityList(enrolled, categoryId, courseId, onSuccess){
        let data = {enrolled: enrolled, categoryId: categoryId, courseId: courseId, service: "getCatCourseSectionActivityList"};
        this.post(this.gateway, data, onSuccess);
    }  

    cloneTemplate(templateId, state, onSuccess){
        let data = {templateId: templateId, state: state, service: "cloneTemplate"};
        this.post(this.gateway, data, onSuccess);
    }

    saveTplAct(data, onSuccess){
        let options = {data: data, service: "saveTplAct"};
        this.post(this.gateway, options, onSuccess);
    }

    saveTplActOrder(data, onSuccess){
        let options = {data: data, service: "saveTplActOrder"};
        this.post(this.gateway, options, onSuccess);
    }

    deleteTplAct(templateId, tplActId, onSuccess){
        let data = {templateId: templateId, tplActId: tplActId, service: "deleteTplAct"};
        this.post(this.gateway, data, onSuccess);
    }
};
