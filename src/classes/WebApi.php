<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
 
/**
 *
 * @copyright  2019 RÉCIT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace recitworkplan;

require_once(dirname(__FILE__).'../../../../config.php');
require_once "$CFG->dirroot/local/recitcommon/php/WebApi.php";
require_once "$CFG->dirroot/local/recitcommon/php/Utils.php";
require_once dirname(__FILE__).'/PersistCtrl.php';
require_once "$CFG->dirroot/local/recitcommon/php/ReportDiagTag.php";

use recitcommon;
use recitcommon\WebApiResult;
use recitcommon\Utils;
use Exception;
use stdClass;

class WebApi extends recitcommon\MoodleApi
{
    public function __construct($DB, $COURSE, $USER){
        parent::__construct($DB, $COURSE, $USER);
        $this->ctrl = PersistCtrl::getInstance($DB, $USER);
    }
    /**
     * $level [a = admin | s = student]
     */
    public function canUserAccess($level, $cmId = 0, $userId = 0, $courseId = 0){
        $userRoles = array();
        $userId = $this->signedUser->id;
        $courseId = $this->course->id;
        $userRoles = $this->ctrl->getUserRoles($userId, $courseId);


        // if the user is admin then it has access to all
        if(Utils::isAdminRole($userRoles)){
            return true;
        }
         // if the level is admin then the user must have a admin role to have access
        else if(($level == 'a') && Utils::isAdminRole($userRoles)){
            return true;
        }
        // if the user is student then it has access only if it is accessing its own stuff
        else if(($level == 's') && ($userId == $this->signedUser->id)){
            return true;
        }
        else{
            throw new Exception("L’accès a ce ressource est restreint.");
        }
    }
    
    public function getWorkPlanList($request){
        try{
            $state = $request['state'];
            $limit = intval($request['limit']);
            $offset = intval($request['offset']);

            $this->canUserAccess('a');

            if($state == 'template'){
                $result = $this->ctrl->getTemplateList($this->signedUser->id, $limit, $offset);
            }
            else{
                $result = $this->ctrl->getWorkPlanList($this->signedUser->id, $limit, $offset, $state);
            }
            
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function getWorkPlanFormKit($request){
        try{
            $this->canUserAccess('a'); 

            $templateId = intval($request['templateId']);

            $result = new stdClass();
            $result->data = ($templateId > 0 ? $this->ctrl->getWorkPlan($this->signedUser->id, $templateId) : new WorkPlan());

            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function deleteWorkPlan($request){
        try{
            $this->canUserAccess('a');
            $templateId = intval($request['templateId']);
            $this->ctrl->deleteWorkPlan($templateId);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function getStudentList($request){
        try{
            $this->canUserAccess('a');

            $templateId = intval($request['templateId']);

            $result = $this->ctrl->getStudentList($templateId);

            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function saveAssignment($request){
        try{
            $this->canUserAccess('a');
            $data = json_decode(json_encode($request['data']), FALSE);
            $result = array();
            foreach ($data as $item){
                $result[] = $this->ctrl->saveAssignment($item);
            }
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function deleteAssignment($request){
        try{
            $this->canUserAccess('a');
            $assignmentId = intval($request['assignmentId']);
            $this->ctrl->deleteAssignment($assignmentId);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
/*
    public function getTemplateList($request){
        try{
            $this->canUserAccess('a');
            $limit = intval($request['limit']);
            $offset = intval($request['offset']);
            $result = $this->ctrl->getTemplateList($this->signedUser->id, $limit, $offset);
            $this->prepareJson($result);
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
*/
    public function getTemplateFormFormKit($request){
        try{
            $this->canUserAccess('a');

            $templateId = intval($request['templateId']);

            $result = new stdClass();
            $result->data = ($templateId > 0 ? $this->ctrl->getTemplate($this->signedUser->id, $templateId) : new Template());
            $result->catCourseList = $this->ctrl->getCatCourseSectionActivityList();

            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function saveTemplate($request){
        try{
            $this->canUserAccess('a');

            $data = json_decode(json_encode($request['data']), FALSE);

            $result = $this->ctrl->saveTemplate($data);

            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    /*public function deleteTemplate($request){
        try{
            $this->canUserAccess('a');
            $templateId = intval($request['templateId']);
            $this->ctrl->deleteTemplate($templateId);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }*/

    public function cloneTemplate($request){
        try{
            $this->canUserAccess('a');
            $templateId = intval($request['templateId']);
            $state = isset($request['state']) ? $request['state'] : null;
            $result = $this->ctrl->cloneTemplate($templateId, $state);
            return new WebApiResult(true, array('id' => $result));
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function saveTplAct($request){
        try{
            $this->canUserAccess('a');

            $data = json_decode(json_encode($request['data']), FALSE);

            $result = $this->ctrl->saveTplAct($data);

            $this->ctrl->recalculateCalendarEvents($result->templateId);

            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function deleteTplAct($request){
        try{
            $this->canUserAccess('a');
            $tplActId = intval($request['tplActId']);
            $this->ctrl->deleteTplAct($tplActId);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    } 
}

///////////////////////////////////////////////////////////////////////////////////

$PAGE->set_context(\context_system::instance());
$webapi = new WebApi($DB, $COURSE, $USER);
$webapi->getRequest($_REQUEST);
$webapi->processRequest();
$webapi->replyClient();