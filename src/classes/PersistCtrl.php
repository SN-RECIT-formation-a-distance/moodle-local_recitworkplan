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
    
    public function getTemplateList(){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.description as templatedesc,  if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, 
        GROUP_CONCAT(distinct t5.name separator ', ') as categories 
        from {recit_wp_tpl} as t1
        inner join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        inner join {course_modules} as t3 on t2.cmid = t3.id
        inner join {course} as t4 on t3.course = t4.id
        inner join {course_categories} as t5 on t4.category = t5.id
        group by t1.id
        order by t1.name asc";

        $rst = $DB->get_records_sql($query);

        $result = array();
		foreach($rst as $item){
            $result[] = Template::create($item);
        } 

        return $result;
    }

    public function getTemplate($templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.description as templatedesc,  if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, 
        t2.id as tpl_act_id, t2.cmid, t2.nb_hours_completion, t4.id as courseid, t4.shortname as coursename, t5.id as categoryid, t5.name as categoryname
        from {recit_wp_tpl} as t1
        inner join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        inner join {course_modules} as t3 on t2.cmid = t3.id
        inner join {course} as t4 on t3.course = t4.id
        inner join {course_categories} as t5 on t4.category = t5.id
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

            if(empty($result)){
                $result = Template::create($item);
            }
            else{
                $result->addActivity($item);
            }
        }  

        return $result;
    }

    public function saveTemplate($data){
        try{	
            $this->mysqlConn->beginTransaction();

            $fields = array("name", "description", "lastupdate");
            $values = array($data->name, $data->description,  time());

            if($data->id == 0){
                $fields[] = "creatorid";
                $values[] = $this->signedUser->id;

                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wp_tpl", $fields, $values);
                $this->mysqlConn->execSQL($query);
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl", $fields, $values, array("id"), array($data->id));
                $this->mysqlConn->execSQL($query);
            }

            $keepIds = array();
            foreach($data->activities as $activity){
                $fields = array("templateid", "cmid", "nb_hours_completion");
                $values = array($data->id, $activity->cmId, $activity->nbHoursCompletion);

                if($activity->id == 0){
                    $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wp_tpl_act", $fields, $values);
                    $this->mysqlConn->execSQL($query);
                    $activity->id = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl_act", "id");
                }
                else{
                    $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl_act", $fields, $values, array("id"), array($activity->id));
                    $this->mysqlConn->execSQL($query);
                }

                $keepIds[] = $activity->id;
            }

            $keepIds = implode(",", $keepIds);
            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl_act where id not in ($keepIds)");
            
            $this->mysqlConn->commitTransaction();

            return true;
        }
        catch(\Exception $ex){
            $this->mysqlConn->rollbackTransaction();
            throw $ex;
        }
    }

    public function getStudentList(){
        global $DB;
        $query = "select id, firstname, lastname from {user} order by firstname, lastname asc";

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

    public function getAssignment($templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.nb_hours_completion as nbhourscompletion, t4.id as userid, t4.firstname, t4.lastname
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id
        where t2.id =:templateid";

        $rst = $DB->get_records_sql($query, array('templateid' => $templateId));

        $result = array();
		foreach($rst as $item){
            $result[] = Assignment::create($item);
        } 

        return $result;
    }

    public function getAssignmentList($userId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.nb_hours_completion as nbhourscompletion, t4.id as userid, t4.firstname, t4.lastname
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id";

        $rst = $DB->get_records_sql($query);

        $result = new MyAssignments();
		foreach($rst as $item){
            $result->addAssignment($item);
        }  

        return $result;
    }

    public function saveAssignment(array $data){
        try{		
            foreach($data as $item){
                $fields = array("templateid", "userid", "nb_hours_per_week", "startdate", "lastupdate");
                $values = array($item->template->id, $item->userId, $item->nbHoursPerWeek, strtotime($item->startDate), time());

                if($item->id == 0){
                    $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wk_tpl_assign", $fields, $values);
                    $this->mysqlConn->execSQL($query);
                }
                else{
                    $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wk_tpl_assign", $fields, $values, array("id"), array($item->id));
                    $this->mysqlConn->execSQL($query);
                }
            }
            
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
        $result->categories = (isset($dbData->categories) ? $dbData->categories : $result->categories);
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

    public static function create($dbData){
        $result = new TemplateActivity();
        $result->id = (isset($dbData->tpl_act_id) ? $dbData->tpl_act_id : $result->id);
        $result->cmId = (isset($dbData->cmid) ? $dbData->cmid : $result->cmId);
        $result->cmName = (isset($dbData->cmname) ? $dbData->cmname : $result->cmName);
        $result->courseId = (isset($dbData->courseid) ? $dbData->courseid : $result->courseId);
        $result->courseName = (isset($dbData->coursename) ? $dbData->coursename : $result->courseName);
        $result->categoryId = (isset($dbData->categoryid) ? $dbData->categoryid : $result->categoryId);
        $result->categoryName = (isset($dbData->categoryname) ? $dbData->categoryname : $result->categoryName);
        $result->nbHoursCompletion = $dbData->nb_hours_completion;

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
