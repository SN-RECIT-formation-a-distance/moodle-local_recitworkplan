import packageJson from "../../package.json";

export class Options
{
    static appVersion(){ return packageJson.version; }

    static appTitle(){
        return "RÉCIT Plan de travail | " + this.appVersion();
    }

    static getGateway(){
        return `${M.cfg.wwwroot}/local/recitworkplan/classes/WebApi.php`;
    }
    
}