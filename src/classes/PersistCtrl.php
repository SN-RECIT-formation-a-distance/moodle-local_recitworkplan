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
        $query = "select id as templateid, creatorid, name as templatename, description as templatedesc, from_unixtime(lastupdate) as lastupdate from {recit_wp_tpl} order by name asc";

        $rst = $DB->get_records_sql($query);

        $result = array();
		foreach($rst as $item){
            $result[] = WorkPlanTemplate::create($item);
        } 

        return $result;
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

    public function getWorkPlan($templateId){
        global $DB;
        $query = "select t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.nb_hours_completion as nbhourscompletion, t4.id as userid, t4.firstname, t4.lastname
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id
        where t2.id =:templateid";

        $rst = $DB->get_records_sql($query, array('templateid' => $templateId));

        $result = array();
		foreach($rst as $item){
            $result[] = WorkPlanAssignment::create($item);
        } 

        return $result;
    }

    public function getWorkPlanList($userId){
        global $DB;
        $query = "select t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.nb_hours_completion as nbhourscompletion, t4.id as userid, t4.firstname, t4.lastname
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id";

        $rst = $DB->get_records_sql($query);

        $result = new MyWorkPlans();
		foreach($rst as $item){
            $result->addWorkPlan($item);
        }  

        return $result;
    }

    public function saveWorkPlanAssign(array $data){
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

    /*public function getWorkPlanList($userId){
        global $DB;
        $query = "select t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, t2.lastupdate, t3.cmid, t4.instance, t3.nb_hours_completion as nbhourscompletion, t5.id as courseid, t5.shortname as coursename, 
        t6.id as moduleid, t6.name as modulename, t7.id as categoryid, t7.name as categoryname, t8.id as userid, t8.firstname, t8.lastname
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {course_modules} as t4 on t3.cmid = t4.id
        inner join {course} as t5 on t4.course = t5.id
        inner join {modules} as t6 on t4.module = t6.id
        inner join {course_categories} as t7 on t5.category = t7.id
        inner join {user} as t8 on t1.userid = t8.id
        order by courseid";

        $rst = $DB->get_records_sql($query);

        $lastCourseId = null;
        $modinfo = null;
        $result = new MyWorkPlans();
		foreach($rst as $item){
            if($lastCourseId != $item->courseid){
                $modinfo = get_fast_modinfo($item->courseid);
            }
            
            $item->cmname = $this->getCmNameFromCmId($item->cmid, $item->courseid, $modinfo);

            $result->addWorkPlan($item);
        }  

        return $result;
    }*/

   /* public function getCoursesFromTeacher($userId){
        global $USER, $DB;

        $courses = enrol_get_all_users_courses($userId, true);
        $ret = array();
        foreach($courses as $course) {
            if (!$course->visible) {
                continue;
            }
            \context_helper::preload_from_record($course);
            $context = \context_course::instance($course->id);
            if (has_capability('moodle/course:viewhiddencourses', $context, $userId)) {
                $ar = array('id' => $course->id, 'name' => $course->fullname, 'cms' => array());
                $modinfo = get_fast_modinfo($course->id);
                foreach ($modinfo->cms as $cm){
                    $ar['cms'][] = array('id' => $cm->id, 'name' => $cm->modname);
                }
                $ret[] = $ar;
            }
        }
        return $ret;
    }

    public function getTrainingPlansFromTeacher($userid){
        global $DB;
        $data = $DB->get_records('recittp',array('userid' => $userid));
        return array_values($data);
    }

    public function getTrainingPlan($planid){
        global $DB;
        $plan = $DB->get_record('recittp',array('id' => $planid));
        $tp = new TrainingPlan($plan);
        $tp->loadData();
        return $tp;
    }

    public function addOrUpdateTrainingPlan($plan){
        $tp = new TrainingPlan((object)$plan);
        $tp->update();
    }

    public function addOrUpdateTrainingPlanActivity($act){
        $tp = new TrainingPlanActivity((object)$act);
        $tp->update();
    }

    public function addOrUpdateTrainingPlanAssignment($assignment){
        $tp = new TrainingPlanAssignment((object)$assignment);
        $tp->update();
    }

    public function deleteTrainingPlan($plan){
        $tp = new TrainingPlan((object)$plan);
        $tp->delete();
    }

    public function deleteTrainingPlanActivity($act){
        $tp = new TrainingPlanActivity((object)$act);
        $tp->delete();
    }

    public function deleteTrainingPlanAssignment($assignment){
        $tp = new TrainingPlanAssignment((object)$assignment);
        $tp->delete();
    }*/
}

class WorkPlanTemplate{
    public $id = 0;
    public $name = "";
    public $description = "";
    public $creatorId = 0;
    public $lastUpdate = null;
    //@array of WorkPlanTemplateActivity
    public $activities = array();

    public static function create($dbData){
        $result = new WorkPlanTemplate();
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
                $this->activities[] = WorkPlanTemplateActivity::create($dbData);
            }
        }
    }
}

class WorkPlanTemplateActivity{
    public $cmId = 0;
    public $cmName = "";
    public $courseId = 0;
    public $courseName = "";
    public $categoryId = 0;
    public $categoryName = "";
    public $nbHoursCompletion = 0;

    public static function create($dbData){
        $result = new WorkPlanTemplateActivity();
        $result->cmId = (isset($dbData->cmid) ? $dbData->cmid : $result->cmId);
        $result->cmName = (isset($dbData->cmname) ? $dbData->cmname : $result->cmName);
        $result->courseId = (isset($dbData->courseid) ? $dbData->courseid : $result->courseId);
        $result->courseName = (isset($dbData->coursename) ? $dbData->coursename : $result->courseName);
        $result->categoryId = (isset($dbData->categoryid) ? $dbData->categoryid : $result->categoryId);
        $result->categoryName = (isset($dbData->categoryname) ? $dbData->categoryname : $result->categoryName);
        $result->nbHoursCompletion = $dbData->nbhourscompletion;

        return $result;
    }
}

class WorkPlanAssignment{
    public $id = 0;
    //@WorkPlanTemplate
    public $template = null;
    public $userId = 0;
    public $firstName = "";
    public $lastName = "";
    public $startDate = null;
    public $nbHoursPerWeek = 0;
    
    public function __construct(){
        $this->template = new WorkPlanTemplate();      
        $this->startDate = new DateTime();      
    }

    public static function create($dbData){
        $result = new WorkPlanAssignment();
        $result->id = $dbData->id;
        $result->template = WorkPlanTemplate::create($dbData);

        $result->userId = $dbData->userid;
        $result->firstName = $dbData->firstname;
        $result->lastName = $dbData->lastname;
        $result->startDate = $dbData->startdate;
        $result->nbHoursPerWeek = $dbData->nbhoursperweek;

        return $result;
    }
}

class MyWorkPlans{
    public $detailed = array();
 
    public function addWorkPlan($dbData){   
       foreach($this->detailed as $item){
           if($item->id == $dbData->id){
                $item->template->addActivity($dbData);
                return;
           }
       }

       $this->detailed[] = WorkPlanAssignment::create($dbData);
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
/*
class TrainingPlan {
    public $id;
    public $userid;
    public $name;
    public $description;
    public $activities = array();
    public $assignments = array();


    public function __construct($data)
    {
        if (isset($data->id) && is_numeric($data->id)) $this->id = $data->id;
        $this->userid = $data->userid;
        $this->name = $data->name;
        $this->description = $data->description;
    }

    public function update(){
        global $DB;
        $tp = new self($this);
        unset($tp->activities);
        unset($tp->assignments);
        if ($this->id == null){
            $DB->insert_record('recittp', $tp);
        }else{
            $DB->update_record('recittp', $tp);
        }
    }

    public function delete(){
        global $DB;
        $tp = new self($this);
        unset($tp->activities);
        unset($tp->assignments);
        $DB->delete_records('recittp_activities', array('tid' => $tp->id));
        $DB->delete_records('recittp_assignments', array('tid' => $tp->id));
        $DB->delete_records('recittp', array('id' => $tp->id));
    }

    public function loadData(){
        global $DB;
        if (!$this->id) return;
        $this->activities = array_values($DB->get_records('recittp_activities', array('tid' => $this->id)));
        $this->assignments = array_values($DB->get_records('recittp_assignments', array('tid' => $this->id)));

        //Load activity name
        foreach ($this->activities as &$a){
            $course = $DB->get_record('course',array('id' => $a->course));
            $a->coursename = $course->fullname;
            $modinfo = get_fast_modinfo($a->course);
            foreach ($modinfo->cms as $cm){
                if ($cm->id == $a->cmid){
                    $a->cmname = $cm->modname;
                    $a->cmurl = $cm->__get('url');
                }
            }
        }
        //Load user name
        foreach ($this->assignments as &$a){
            $user = $DB->get_record('user',array('id' => $a->userid));
            $a->name = $user->firstname.' '.$user->lastname;
        }
    }
}

class TrainingPlanActivity {
    public $id;
    public $course;
    public $cmid;
    public $time_to_complete;
    public $tid;


    public function __construct($data)
    {
        if (isset($data->id) && is_numeric($data->id)) $this->id = $data->id;
        $this->course = $data->course;
        $this->cmid = $data->cmid;
        $this->time_to_complete = $data->time_to_complete;
        $this->tid = $data->tid;
    }

    public function update(){
        global $DB;
        if ($this->id == null){
            $DB->insert_record('recittp_activities', $this);
        }else{
            $DB->update_record('recittp_activities', $this);
        }
    }

    public function delete(){
        global $DB;
        $DB->delete_records('recittp_activities', array('id' => $this->id));
    }
}

class TrainingPlanAssignment {
    public $id;
    public $tid;
    public $gid;
    public $userid;
    public $worktimeweek;
    public $timestart;


    public function __construct($data)
    {
        if (isset($data->id) && is_numeric($data->id)) $this->id = $data->id;
        $this->tid = $data->tid;
        if (isset($data->gid) && is_numeric($data->gid)) $this->gid = $data->gid;
        if (isset($data->userid) && is_numeric($data->userid)) $this->userid = $data->userid;
        $this->worktimeweek = $data->worktimeweek;
        $this->timestart = $data->timestart;
    }

    public function update(){
        global $DB;
        if ($this->id == null){
            $DB->insert_record('recittp_assignments', $this);
        }else{
            $DB->update_record('recittp_assignments', $this);
        }
    }

    public function delete(){
        global $DB;
        $DB->delete_records('recittp_assignments', array('id' => $this->id));
    }
}*/