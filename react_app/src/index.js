import React, { Component } from 'react';
import ReactDOM from "react-dom";
/**************************************************************************************
 *  il ne faut pas charger le bootstrap de base car il est déjà chargé dans le thème
 * //import 'bootstrap/dist/css/bootstrap.min.css';  
 **************************************************************************************/ 
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {VisualFeedback, Loading} from "./libs/components/Components";
import Utils from "./libs/utils/Utils";
import './common/i18n';
import {AdminView} from "./views/WorkPlanView";
import {$glVars} from "./common/common";
import "./css/style.scss";
import { StudentView } from './views/StudentView';
import { AdminBlockView, StudentBlockView } from './views/BlockView';

export * from "./common/i18n";
 
class App extends Component {
    static defaultProps = {
        signedUser: null,
        mode: 'a',
        workPlanId: 0
    };

    constructor(props) {
        super(props);

        this.onFeedback = this.onFeedback.bind(this);

        $glVars.signedUser = this.props.signedUser;
        $glVars.urlParams = Utils.getUrlVars();

        //(UtilsMoodle.checkRoles($glVars.signedUser.roles, UtilsMoodle.rolesL2) ? 't' : 's');

        this.state = {mode: this.props.mode};
    }

    componentDidMount(){
        $glVars.feedback.addObserver("App", this.onFeedback); 
    }

    componentWillUnmount(){
        $glVars.feedback.removeObserver("App");        
    }

    render() {
        let view = null;
        if (this.state.mode  === 'a'){
            view = <AdminView workPlanId={this.props.workPlanId}/>;
        }else if (this.state.mode  === 's'){
            view =<StudentView/>;
        }else if (this.state.mode  === 'sb'){
            view =<StudentBlockView/>;
        }else if (this.state.mode  === 'ab'){
            view =<AdminBlockView/>;
        }
        let main =
            <div>
                {view}
                {$glVars.feedback.msg.map((item, index) => {  
                    return (<VisualFeedback key={index} id={index} msg={item.msg} type={item.type} title={item.title} timeout={item.timeout}/>);                                    
                })}
                <Loading webApi={$glVars.webApi}><FontAwesomeIcon icon={faSpinner} spin/></Loading>
            </div>

        return (main);
    }

    onFeedback(){
        this.forceUpdate();
    }
}

document.addEventListener('DOMContentLoaded', function(){ 
    let domContainer = document.getElementById('recit_workplan');
    if (domContainer){
        let signedUser = {userId: domContainer.getAttribute('data-user-id')};
        ReactDOM.render(<App signedUser={signedUser} mode={domContainer.getAttribute('data-mode')} workPlanId={domContainer.getAttribute('data-workplanid')}/>, domContainer);
    }
}, false);
