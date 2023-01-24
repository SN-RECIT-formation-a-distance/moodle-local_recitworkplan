import packageJson from "../../package.json";

export class Options
{
    static recitDashboardUrl = M.cfg.wwwroot + "/local/recitdashboard/view.php";
    static recitWorkPlanUrl = M.cfg.wwwroot + "/local/recitworkplan/view.php";
    static MAX_AFFECTATIONS = 35;


    static appName(){ return packageJson.description; }
    static appVersion(){ return packageJson.version; }
    
    static appTitle(){
        return this.appName() + " | v" + this.appVersion();
    }

    static getGateway(){
        return `${M.cfg.wwwroot}/local/recitworkplan/classes/WebApi.php`;
    }
    
}