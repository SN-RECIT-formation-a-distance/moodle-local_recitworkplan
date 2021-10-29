import packageJson from "../../package.json";

export class Options
{
    static appVersion(){ return packageJson.version; }

    static appTitle(){
        return "RÉCIT plan de formation | " + this.appVersion();
    }

    static getGateway(){
        return `${M.cfg.wwwroot}/local/recitplanformation/classes/WebApi.php`;
    }
    
}