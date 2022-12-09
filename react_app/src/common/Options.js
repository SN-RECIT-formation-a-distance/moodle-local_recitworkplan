import packageJson from "../../package.json";

export class Options
{
    static recitDashboardUrl = M.cfg.wwwroot + "/local/recitdashboard/view.php";
    static recitWorkPlanUrl = M.cfg.wwwroot + "/local/recitworkplan/view.php";
    static MAX_AFFECTATIONS = 35;


    static appVersion(){ return packageJson.version; }

    static appTitle(){
        return "RÉCIT Plan de travail | " + this.appVersion();
    }

    static getGateway(){
        return `${M.cfg.wwwroot}/local/recitworkplan/classes/WebApi.php`;
    }
    
}