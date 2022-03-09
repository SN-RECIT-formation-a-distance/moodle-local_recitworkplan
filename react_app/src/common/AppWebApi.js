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
    
    getWorkPlanList(limit, offset, completionState, onSuccess){
        let data = {limit: limit, offset: offset, completionState: completionState, service: "getWorkPlanList"};
        this.post(this.gateway, data, onSuccess);
    }

    getWorkPlanFormKit(templateId, onSuccess){
        let data = {templateId: templateId, service: "getWorkPlanFormKit"};
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

    /*saveObjectData(id, name, value, object, datatype, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveObjectData');
            }
        };

        let options = {id: id, name: name, value: value, object: object, datatype: datatype, service: "saveObjectData"};
        this.post(this.gateway, options, onSuccessTmp);
    }*/

   /* getAssignment(templateId, onSuccess){
        let data = {templateId: templateId, service: "getAssignment"};
        this.post(this.gateway, data, onSuccess);
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

    getTemplateList(limit, offset, onSuccess){
        let data = {service: "getTemplateList", limit: limit, offset: offset};
        this.post(this.gateway, data, onSuccess);
    }
*/
    getTemplateFormFormKit(templateId, onSuccess){
        let data = {templateId: templateId, service: "getTemplateFormFormKit"};
        this.post(this.gateway, data, onSuccess);
    }   

    getCatCourseSectionActivityList(enrolled, categoryId, courseId, onSuccess){
        let data = {enrolled: enrolled, categoryId: categoryId, courseId: courseId, service: "getCatCourseSectionActivityList"};
        this.post(this.gateway, data, onSuccess);
    }  

    /*saveTemplate(data, onSuccess){
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

    deleteTemplate(templateId, onSuccess){
        let data = {templateId: templateId, service: "deleteTemplate"};
        this.post(this.gateway, data, onSuccess);
    }

    cloneTemplate(templateId, onSuccess){
        let data = {templateId: templateId, service: "cloneTemplate"};
        this.post(this.gateway, data, onSuccess);
    }
*/
    saveTplAct(data, onSuccess){
        let options = {data: data, service: "saveTplAct"};
        this.post(this.gateway, options, onSuccess);
    }

    deleteTplAct(tplActId, onSuccess){
        let data = {tplActId: tplActId, service: "deleteTplAct"};
        this.post(this.gateway, data, onSuccess);
    }
};
