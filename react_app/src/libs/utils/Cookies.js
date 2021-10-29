
export class Cookies
{   
    /**
    * @static
    * @param {type} id
    * @param {type} value
    * @param {type} minutesExpire
    * @returns {void}
    */
    static set(id, value, minutesExpire) {
        let d = new Date();
        d.setTime(d.getTime() + (minutesExpire*60*1000));
        let expires = "expires="+d.toUTCString();
        document.cookie = id + "=" + value + "; " + expires;
    };

    static get = function (id, defaultValue) {
        let result = defaultValue;
        let name = id + "=";
        let ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') 
                c = c.substring(1);

            if (c.indexOf(name) === 0) 
                result = c.substring(name.length, c.length);
        }

        switch(typeof defaultValue){            
            case 'boolean':
                result = result === 'true';
                break;
            case 'number':
                result = parseFloat(result);
                break;
            case 'object':
                result = (defaultValue instanceof Date ? new Date(result) : result);
                break;
            default:
                result = result.toString();
        }

        return result;
    };
};