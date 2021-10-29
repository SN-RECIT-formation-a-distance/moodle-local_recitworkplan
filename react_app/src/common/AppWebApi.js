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
    
    isEditingMode(onSuccess){
        let data = {service: "isEditingMode"};
        this.post(this.gateway, data, onSuccess);
    }

    getAvailableCourses(onSuccess){
        let data = {service: "getAvailableCourses"};
        this.post(this.gateway, data, onSuccess);
    }

    getStudents(search, onSuccess){
        let data = {service: "getUsers", search: search};
        this.post(this.gateway, data, onSuccess);
    }

    getTrainingPlans(onSuccess){
        let data = {service: "getTrainingPlans"};
        this.post(this.gateway, data, onSuccess);
    }

    getTrainingPlan(planId, onSuccess){
        let data = {planId: planId, service: "getTrainingPlan"};
        this.post(this.gateway, data, onSuccess);
    }

    addOrUpdateTrainingPlan(plan, onSuccess){
        let data = {plan: plan, service: "addOrUpdateTrainingPlan"};
        this.post(this.gateway, data, onSuccess);
    }

    addOrUpdateTrainingPlanActivity(planActivity, onSuccess){
        let data = {planActivity: planActivity, service: "addOrUpdateTrainingPlanActivity"};
        this.post(this.gateway, data, onSuccess);
    }

    addOrUpdateTrainingPlanAssignment(planAssignment, onSuccess){
        let data = {planAssignment: planAssignment, service: "addOrUpdateTrainingPlanAssignment"};
        this.post(this.gateway, data, onSuccess);
    }

    deleteTrainingPlan(plan, onSuccess){
        let data = {plan: plan, service: "deleteTrainingPlan"};
        this.post(this.gateway, data, onSuccess);
    }

    deleteTrainingPlanActivity(planActivity, onSuccess){
        let data = {planActivity: planActivity, service: "deleteTrainingPlanActivity"};
        this.post(this.gateway, data, onSuccess);
    }

    deleteTrainingPlanAssignment(planAssignment, onSuccess){
        let data = {planAssignment: planAssignment, service: "deleteTrainingPlanAssignment"};
        this.post(this.gateway, data, onSuccess);
    }

};
