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
require_once dirname(__FILE__).'/PersistCtrl.php';
require_once "$CFG->dirroot/local/recitcommon/php/ReportDiagTag.php";

use recitcommon;
use recitcommon\WebApiResult;
use Exception;
use stdClass;

class WebApi extends recitcommon\MoodleApi
{
    public function __construct($DB, $COURSE, $USER){
        parent::__construct($DB, $COURSE, $USER);
        $this->ctrl = PersistCtrl::getInstance($DB, $USER);
    }
    
    public function getAssignmentList($request){
        try{
            $this->canUserAccess('a');

            $summary = boolval($request['summary']);

            $result = $this->ctrl->getAssignmentList($this->signedUser->id);
            if($summary){
                $result = $result->getSummary();
            }
            
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function getAssignmentFormKit($request){
        try{
            $this->canUserAccess('a');

            $result = new stdClass();
            $result->prototype = new Assignment();
            $result->templateList = $this->ctrl->getTemplateList($this->signedUser->id);
            $result->studentList = $this->ctrl->getStudentList();

            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function getAssignment($request){
        try{
            $this->canUserAccess('a');

            $templateId = intval($request['templateId']);

            $result = $this->ctrl->getAssignment($this->signedUser->id, $templateId);

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
            $this->ctrl->saveAssignment($data);
            return new WebApiResult(true);
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

    public function getTemplateList($request){
        try{
            $this->canUserAccess('a');
            $result = $this->ctrl->getTemplateList($this->signedUser->id);
            $this->prepareJson($result);
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function getTemplateFormFormKit($request){
        try{
            $this->canUserAccess('a');

            $templateId = intval($request['templateId']);

            $result = new stdClass();
            $result->prototype = new TemplateActivity();
            $result->data = ($templateId > 0 ? $this->ctrl->getTemplate($templateId) : new Template());
            $result->activityList = $this->ctrl->getCatCourseSectionActivityList();

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

            $this->ctrl->saveTemplate($data);

            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

   /* public function getUsers($request){
        global $USER;
        try{
            $searchparams = array();
            if (isset($request['search'])) $searchparams[] = array('key' => 'fullname', 'value' => $request['search']);
            $users = \core_user_external::get_users($searchparams);
            $result = array();
            foreach ($users['users'] as $u){
                $result[] = array('value' => $u['id'], 'text' => $u['fullname']);
            }
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function getAvailableCourses($request){
        global $USER;
        try{
            $result = $this->ctrl->getCoursesFromTeacher($USER->id);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function getTrainingPlans($request){
        global $USER;
        try{
            $result = $this->ctrl->getTrainingPlansFromTeacher($USER->id);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function getTrainingPlan($request){
        try{
            $result = $this->ctrl->getTrainingPlan($request['planId']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function addOrUpdateTrainingPlan($request){
        global $USER;
        try{
            $request['plan']['userid'] = $USER->id;
            $result = $this->ctrl->addOrUpdateTrainingPlan($request['plan']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function addOrUpdateTrainingPlanActivity($request){
        try{
            $result = $this->ctrl->addOrUpdateTrainingPlanActivity($request['planActivity']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function addOrUpdateTrainingPlanAssignment($request){
        try{
            $result = $this->ctrl->addOrUpdateTrainingPlanAssignment($request['planAssignment']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function deleteTrainingPlan($request){
        try{
            $result = $this->ctrl->deleteTrainingPlan($request['plan']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function deleteTrainingPlanActivity($request){
        try{
            $result = $this->ctrl->deleteTrainingPlanActivity($request['planActivity']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }
    
    public function deleteTrainingPlanAssignment($request){
        try{
            $result = $this->ctrl->deleteTrainingPlanAssignment($request['planAssignment']);
            $this->prepareJson($result);
            
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }*/
}

///////////////////////////////////////////////////////////////////////////////////
$webapi = new WebApi($DB, $COURSE, $USER);
$webapi->getRequest($_REQUEST);
$webapi->processRequest();
$webapi->replyClient();