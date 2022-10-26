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

    static getCompletionState(item){
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
    }

    static getAssignmentProgress(activities, assignment){
        let hrCompleted = 0;
        let hrTotal = 0;
        for (let it of activities){
            hrTotal = hrTotal + it.nbHoursCompletion;
            let userActivity = JsNx.getItem(assignment.user.activities, 'cmId', it.cmId, []);
            if (userActivity.completionState > 0){
                hrCompleted = hrCompleted + it.nbHoursCompletion;
            }
        }

        let value = Math.round(hrCompleted / hrTotal * 100,1);
        value = (isNaN(value) ? 0 : value);

        let result = {
            value: value,
            text: `${value}% (Le nombre d'heures des activités complétées / le nombre total d'heures prévues du plan de travail)`
        };

        return result;
    }

    static getActivityStats(workPlan, activity){
        let nbAwaitingGrade = 0;
        let nbFails = 0;
        for (let assignment of workPlan.assignments){
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
        return {nbAwaitingGrade:nbAwaitingGrade, nbFails:nbFails};
    }

    static isArchived(assignment){
        if(assignment){
            return (assignment.completionState === 1);
        }
            
        return false;
    }
}