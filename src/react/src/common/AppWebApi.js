// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package   local_recitworkplan
 * @copyright 2019 RÉCIT 
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
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
    
    getWorkPlanList(limit, offset, state, forStudent, userId, orderBy, onSuccess, feedback){
        let data = {limit: limit, offset: offset, forStudent: forStudent, state: state, userId: userId, orderBy:orderBy, service: "getWorkPlanList"};
        this.post(this.gateway, data, onSuccess, null, feedback);
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
        this.post(this.gateway, data, onSuccess, null, true);
    }

    processWorkPlan(templateId, onSuccess){
        let data = {templateId: templateId, service: "processWorkPlan"};
        this.post(this.gateway, data, onSuccess, null, true);
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
        this.post(this.gateway, options, onSuccessTmp, null, true);
    }

    saveAssignment(data, calendar, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveAssignment');
            }
        };

        let options = {data: data, calendar: calendar, service: "saveAssignment"};
        this.post(this.gateway, options, onSuccessTmp, null, true);
    }

    deleteAssignment(assignmentId, onSuccess){
        let data = {assignmentId: assignmentId, service: "deleteAssignment"};
        this.post(this.gateway, data, onSuccess, null, true);
    }

    getAssignmentAdditionalHours(assignmentId, onSuccess){
        let data = {assignmentId: assignmentId, service: "getAssignmentAdditionalHours"};
        this.post(this.gateway, data, onSuccess);
    }

    addAssignmentAdditionalHours(data, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('addAssignmentAdditionalHours');
            }
        };

        let options = {data: data, service: "addAssignmentAdditionalHours"};

        this.post(this.gateway, options, onSuccessTmp, null, true);
    }

    getTemplateFormFormKit(templateId, onSuccess){
        let data = {templateId: templateId, service: "getTemplateFormFormKit"};
        this.post(this.gateway, data, onSuccess);
    }   

    getCatCourseSectionActivityList(enrolled, categoryId, courseId, onSuccess){
        let data = {enrolled: enrolled, categoryId: categoryId, courseId: courseId, service: "getCatCourseSectionActivityList"};
        this.post(this.gateway, data, onSuccess);
    }  

    cloneTemplate(templateId, options, onSuccess){
        let data = {templateId: templateId, options: options, service: "cloneTemplate"};
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
