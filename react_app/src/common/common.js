import {I18n} from "../libs/utils/Utils";
import {FeedbackCtrl} from "../libs/components/Feedback";
import {AppWebApi} from "./AppWebApi";

export * from "./Options";

export const $glVars = {
    signedUser: {userId: 0, roles: []},
    feedback: new FeedbackCtrl(),
    i18n: new I18n(),
    webApi: new AppWebApi(),
    urlParams: {}
}