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

            $templateId = intval($request['templateId']);
            $complete = boolval($request['complete']);

            $result = new stdClass();
            $result->prototype = null;
            $result->templateList = null;
            $result->data = $this->ctrl->getAssignment($this->signedUser->id, $templateId);
            $result->studentList =  $this->ctrl->getStudentList($templateId);

            if($complete){
                $result->templateList = $this->ctrl->getTemplateList($this->signedUser->id);
                $result->prototype = new Assignment();
            }
            
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
            $result = $this->ctrl->saveAssignment($data);
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

    public function deleteTemplate($request){
        try{
            $this->canUserAccess('a');
            $templateId = intval($request['templateId']);
            $this->ctrl->deleteTemplate($templateId);
            return new WebApiResult(true);
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
$webapi = new WebApi($DB, $COURSE, $USER);
$webapi->getRequest($_REQUEST);
$webapi->processRequest();
$webapi->replyClient();