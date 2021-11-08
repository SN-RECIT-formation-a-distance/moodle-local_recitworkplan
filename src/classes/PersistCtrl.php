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

require_once "$CFG->dirroot/local/recitcommon/php/PersistCtrl.php";
require_once "$CFG->dirroot/local/recitcommon/php/Utils.php";
require_once "$CFG->dirroot/user/externallib.php";

use DateTime;
use recitcommon;
use recitcommon\Utils;
use stdClass;

/**
 * Singleton class
 */
class PersistCtrl extends recitcommon\MoodlePersistCtrl
{
    protected static $instance = null;
    
    /**
     * @param MySQL Resource
     * @return PersistCtrl
     */
    public static function getInstance($mysqlConn = null, $signedUser = null)
    {
        if(!isset(self::$instance)) {
            self::$instance = new self($mysqlConn, $signedUser);
        }
        return self::$instance;
    }
    
    protected function __construct($mysqlConn, $signedUser){
        parent::__construct($mysqlConn, $signedUser);
    }
    
    protected function getAdminRolesStmt($userId){
        $query = " select st3.instanceid as courseId, 
        group_concat(distinct st1.shortname) as roles
        from mdl_role as st1 
        inner join mdl_role_assignments as st2 on st1.id = st2.roleid 
        inner join mdl_context as st3 on st2.contextid = st3.id and contextlevel = 50
        where st2.userid = $userId 
        group by st3.instanceid";

        return $query;
    }

    public function getTemplateList($userId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.description as templatedesc,  
        if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, t2.cmid, t5.name as categoryName, tblRoles.roles
        from {recit_wp_tpl} as t1
        inner join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        inner join {course_modules} as t3 on t2.cmid = t3.id
        inner join {course} as t4 on t3.course = t4.id
        inner join {course_categories} as t5 on t4.category = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t4.id = tblRoles.courseId
        group by t1.id, t2.cmid
        order by templatename asc";

        $rst = $DB->get_records_sql($query);

        $result = array();
		foreach($rst as $item){
            if(!isset($result[$item->templateid])){
                $result[$item->templateid] = Template::create($item);
            }
            else{
                $result[$item->templateid]->addActivity($item);
            }
            
        } 

        foreach($result as $index => $item){
            if(!$item->verifyRoles()){
                unset($result[$index]);
            }
        }

        return array_values($result);
    }

    public function getTemplate($userId, $templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.description as templatedesc,  if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, 
        t2.id as tpl_act_id, t2.cmid, t2.nb_hours_completion, t4.id as courseid, t4.shortname as coursename, t5.id as categoryid, t5.name as categoryname, tblRoles.roles
        from {recit_wp_tpl} as t1
        inner join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        inner join {course_modules} as t3 on t2.cmid = t3.id
        inner join {course} as t4 on t3.course = t4.id
        inner join {course_categories} as t5 on t4.category = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t4.id = tblRoles.courseId
        where t1.id =:templateid
        order by t4.id asc, t1.name asc";

        $rst = $DB->get_records_sql($query, array('templateid' => $templateId));

        $lastCourseId = null;
        $modinfo = null;
        $result = null;
		foreach($rst as $item){
            if($lastCourseId != $item->courseid){
                $modinfo = get_fast_modinfo($item->courseid);
            }
            
            $item->cmname = $this->getCmNameFromCmId($item->cmid, $item->courseid, $modinfo);

            if($result == null){
                $result = Template::create($item);
            }
            else{
                $result->addActivity($item);
            }
        }  

        if(!$result->verifyRoles()){
            throw new \Exception("The logged in user has no permission to view this template.");
        }

        return $result;
    }

    public function saveTemplate($data){
        try{	
            $result = $data->id;
            $fields = array("name", "description", "lastupdate");
            $values = array($data->name, $data->description,  time());

            if($data->id == 0){
                $fields[] = "creatorid";
                $values[] = $this->signedUser->id;

                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wp_tpl", $fields, $values);
                $this->mysqlConn->execSQL($query);

                $result = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl", "id");
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl", $fields, $values, array("id"), array($data->id));
                $this->mysqlConn->execSQL($query);
            }

            return $result;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function deleteTemplate($templateId){
        try{
            $query = "delete t1, t2, t3
                     from {$this->prefix}recit_wp_tpl as t1
                    left join {$this->prefix}recit_wp_tpl_act as t2 on t1.id = t2.templateid 
                    left join {$this->prefix}recit_wk_tpl_assign as t3 on t1.id = t3.templateid
                    where t1.id = $templateId";

            $this->mysqlConn->execSQL($query);
            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }  
    }

    public function saveActTpl($data){
        try{	
            $result = $data->id;

            if($data->templateId == 0){
                throw new \Exception("aaa");
            }
            else{
                $fields = array("lastupdate");
                $values = array(time());
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl", $fields, $values, array("id"), array($data->templateId));
                $this->mysqlConn->execSQL($query);
            }

            $fields = array("templateid", "cmid", "nb_hours_completion");
            $values = array($data->templateId, $data->cmId, $data->nbHoursCompletion);

            if($data->id == 0){
                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wp_tpl_act", $fields, $values);
                $result = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl_act", "id");
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl_act", $fields, $values, array("id"), array($data->id));
                
            }

            $this->mysqlConn->execSQL($query);

            return $result;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function deleteActTpl($tplActId){
        try{
            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl_act where id = $tplActId");
            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }  
    }

    public function getStudentList($templateId){
        global $DB;
        $query = "select t1.id, t1.firstname, t1.lastname
        from {user} as t1
        inner join {user_enrolments} as t2 on t1.id = t2.userid
        inner join {enrol} as t3 on t2.enrolid = t3.id
        where t3.courseid in (select st2.course from {recit_wp_tpl_act} as st1 
                             inner join {course_modules} as st2 on st1.cmid = st2.id 
                             where st1.templateid = $templateId)
        order by firstname, lastname asc";

        $rst = $DB->get_records_sql($query);

        $result = array();
		foreach($rst as $item){
            $obj = new stdClass();
            $obj->userId = $item->id;
            $obj->firstName = $item->firstname;
            $obj->lastName = $item->lastname;
            $result[] = $obj;
        } 

        return $result;
    }

    public function getAssignment($userId, $templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.id as tpl_act_id, t3.cmid, t3.nb_hours_completion, t4.id as userid, t4.firstname, t4.lastname, tblRoles.roles
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id
        inner join {course_modules} as t5 on t3.cmid = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId
        where t2.id =:templateid";

        $rst = $DB->get_records_sql($query, array('templateid' => $templateId));

        $result = array();
		foreach($rst as $item){
            if(!isset($result[$item->userid])){
                $result[$item->userid] = Assignment::create($item);
            }
            else{
                $result[$item->userid]->template->addActivity($item);
            }
        } 

        foreach($result as $index => $item){
            if(!$item->template->verifyRoles()){
                unset($result[$index]);
            }
        } 

        return array_values($result);
    }

    public function getAssignmentList($userId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nbhourscompletion, t4.id as userid, t4.firstname, t4.lastname, tblRoles.roles
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id
        inner join {course_modules} as t5 on t3.cmid = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId";

        $rst = $DB->get_records_sql($query, array('userid' => $userId));

        $result = new MyAssignments();
		foreach($rst as $item){
            $result->addAssignment($item);
        }  

        foreach($result->detailed as $index => $item){
            if(!$item->template->verifyRoles()){
                unset($result->detailed[$index]);
            }
        } 

        return $result;
    }

    public function saveAssignment($data){
        try{		
            $fields = array("templateid", "userid", "nb_hours_per_week", "startdate", "lastupdate");
            $values = array($data->template->id, $data->userId, $data->nbHoursPerWeek, strtotime($data->startDate), time());

            if($data->id == 0){
                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wk_tpl_assign", $fields, $values);
                $this->mysqlConn->execSQL($query);
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wk_tpl_assign", $fields, $values, array("id"), array($data->id));
                $this->mysqlConn->execSQL($query);
            }

            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function deleteAssignment($assignmentId){
        try{
            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wk_tpl_assign where id = $assignmentId");
            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }  
    }
}

class Template{
    public $id = 0;
    public $name = "";
    public $description = "";
    public $creatorId = 0;
    public $lastUpdate = null;
    //@array of TemplateActivity
    public $categories = "";
    public $activities = array();

    public static function create($dbData){
        $result = new Template();
        $result->id = $dbData->templateid;
        $result->name = $dbData->templatename;
        $result->description = $dbData->templatedesc;
        $result->creatorId = $dbData->creatorid;
        $result->lastUpdate = $dbData->lastupdate;
        $result->addActivity($dbData);

        return $result;
    }

    public function addActivity($dbData){
        if($this->id == $dbData->templateid){
            if(isset($dbData->cmid) && $dbData->cmid > 0){
                $this->activities[] = TemplateActivity::create($dbData);
            }
        }
    }

    public function verifyRoles(){
        foreach($this->activities as $act){
            if(!Utils::isAdminRole($act->roles)){
                return false;
            }
        }

        return true;
    }
}

class TemplateActivity{
    public $id = 0;
    public $cmId = 0;
    public $cmName = "";
    public $courseId = 0;
    public $courseName = "";
    public $categoryId = 0;
    public $categoryName = "";
    public $nbHoursCompletion = 0;
    public $roles = "";

    public static function create($dbData){
        $result = new TemplateActivity();
        $result->id = (isset($dbData->tpl_act_id) ? $dbData->tpl_act_id : $result->id);
        $result->cmId = (isset($dbData->cmid) ? $dbData->cmid : $result->cmId);
        $result->cmName = (isset($dbData->cmname) ? $dbData->cmname : $result->cmName);
        $result->courseId = (isset($dbData->courseid) ? $dbData->courseid : $result->courseId);
        $result->courseName = (isset($dbData->coursename) ? $dbData->coursename : $result->courseName);
        $result->categoryId = (isset($dbData->categoryid) ? $dbData->categoryid : $result->categoryId);
        $result->categoryName = (isset($dbData->categoryname) ? $dbData->categoryname : $result->categoryName);
        $result->nbHoursCompletion = (isset($dbData->nb_hours_completion) ? $dbData->nb_hours_completion : $result->nbHoursCompletion);
        
        $result->roles = explode(",", $dbData->roles);
        $result->roles = Utils::moodleRoles2RecitRoles($result->roles);

        return $result;
    }
}

class Assignment{
    public $id = 0;
    //@Template
    public $template = null;
    public $userId = 0;
    public $firstName = "";
    public $lastName = "";
    public $startDate = null;
    public $nbHoursPerWeek = 0;
    
    public function __construct(){
        $this->template = new Template();      
        $this->startDate = new DateTime();      
    }

    public static function create($dbData){
        $result = new Assignment();
        $result->id = $dbData->id;
        $result->template = Template::create($dbData);

        $result->userId = $dbData->userid;
        $result->firstName = $dbData->firstname;
        $result->lastName = $dbData->lastname;
        $result->startDate = $dbData->startdate;
        $result->nbHoursPerWeek = $dbData->nbhoursperweek;

        return $result;
    }
}

class MyAssignments{
    public $detailed = array();
 
    public function addAssignment($dbData){   
       foreach($this->detailed as $item){
           if($item->id == $dbData->id){
                $item->template->addActivity($dbData);
                return;
           }
       }

       $this->detailed[] = Assignment::create($dbData);
    }

    public function getSummary(){
        $result = array();

        foreach($this->detailed as $item){
            if(!isset($result[$item->template->id])){
                $result[$item->template->id] = new \stdClass();
                $result[$item->template->id]->id = $item->id;
                $result[$item->template->id]->name = $item->template->name;
                $result[$item->template->id]->nbStudents = 0;
            }

            $result[$item->template->id]->nbStudents++;
        }

        return array_values($result);
    }
}
