import {I18n, JsNx} from "../libs/utils/Utils";
import {FeedbackCtrl} from "../libs/components/Feedback";
import {AppWebApi} from "./AppWebApi";

export * from "./Options";

export const $glVars = {
    signedUser: {userId: 0, roles: []},
    feedback: new FeedbackCtrl(),
    i18n: new I18n(),
    webApi: new AppWebApi(),
    urlParams: {},
    context: {},
}

export class WorkPlanUtils {
    
    static getActivityCompletion(activities){
        let count = 0;
        for(let item of activities){
            if(item.completionState >= 1 || item.passed >= 0){
                count++;
            }
        }

        return `${count}/${activities.length}`;
    }

   /* static getCompletionState(item){
        let result = "";

        switch(item.completionState){
            case 0:
                result = "En cours"; break;
            case 1:
                result = "Terminé"; break;
            case 2:
                result = "En retard"; break;
        }

        return result;
    }*/

    static getWorkPlanProgress(workPlan, studentId){
        let progress = {text: '', value: 0, color: 'bg-primary'};
                            
        if(!workPlan){
            return progress;
        }

        if(!studentId && workPlan.stats && workPlan.stats.nbStudents > 0){
            progress.text = `${workPlan.stats.workPlanCompletion/workPlan.stats.nbStudents * 100}%`;
            progress.value = workPlan.stats.workPlanCompletion/workPlan.stats.nbStudents * 100;
        }else if (studentId && workPlan.stats){
            progress.text = `0%`;
            if(workPlan.stats.workplanprogress[studentId]){
                progress.value = workPlan.stats.workplanprogress[studentId];
                progress.text = `${workPlan.stats.workplanprogress[studentId]}%`;
            }
        }
        return progress;
    }

    static getTotalNrHours(activities){
        let hrTotal = 0;
        for (let it of activities){
            hrTotal = hrTotal + parseFloat(it.nbHoursCompletion);
        }
        return hrTotal.toFixed(2);
    }

    static getNbHoursCompletion(activities, assignment){
        let hrCompleted = 0;
        for (let it of activities){
            let userActivity = JsNx.getItem(assignment.user.activities, 'cmId', it.cmId, {completionState: 0});
            if (userActivity.completionState > 0){
                hrCompleted = hrCompleted + it.nbHoursCompletion;
            }
        }

        return hrCompleted;
    }

    static getActivityStats(workPlan, activity){
        let nbAwaitingGrade = 0;
        let nbFails = 0;
        for (let assignment of workPlan.assignments){
            if (assignment.user?.activities){
                for (let act of assignment.user.activities){
                    if (!activity || act.cmId == activity.cmId){
                        if (act.followup == 1){
                            nbAwaitingGrade++;
                        }
                        if (act.passed == 0){
                            nbFails++;
                        }
                    }
                }
            }
        }
        return {nbAwaitingGrade:nbAwaitingGrade, nbFails:nbFails};
    }

    static isArchived(assignment){
        if(assignment){
            return (assignment.completionState === 1);
        }
            
        return false;
    }
}