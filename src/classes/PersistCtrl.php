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
require_once "$CFG->dirroot/calendar/lib.php";


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
    
    protected function getCatAdminRolesStmt($userId){
        $query = " select st4.instanceid as categoryId,
        group_concat(distinct st1.shortname) as categoryroles
        from {$this->prefix}role as st1 
        inner join {$this->prefix}role_assignments as st2 on st1.id = st2.roleid 
        inner join {$this->prefix}context as st4 on st2.contextid = st4.id and contextlevel = 40
        where st2.userid = $userId 
        group by st4.instanceid";

        return $query;
    }
    
    protected function getAdminRolesStmt($userId){
        $query = " select st3.instanceid as courseId, 
        group_concat(distinct st1.shortname) as roles
        from {$this->prefix}role as st1 
        inner join {$this->prefix}role_assignments as st2 on st1.id = st2.roleid 
        inner join {$this->prefix}context as st3 on st2.contextid = st3.id and contextlevel = 50
        where st2.userid = $userId 
        group by st3.instanceid";

        return $query;
    }

    public function getTemplateList($userId, $limit = 0, $offset = 0){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.description as templatedesc, t4.fullname as coursename,
        if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, t2.cmid, t5.name as categoryName, tblRoles.roles, tblCatRoles.categoryroles, count(*) OVER() AS total_count
        from {recit_wp_tpl} as t1
        inner join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        inner join {course_modules} as t3 on t2.cmid = t3.id
        inner join {course} as t4 on t3.course = t4.id
        inner join {course_categories} as t5 on t4.category = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t4.id = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t4.category = tblCatRoles.categoryId
        group by t1.id, t2.cmid
        order by t1.name asc";

        if ($limit > 0){
            $offsetsql = $offset * $limit;
            $query .= " LIMIT $limit OFFSET $offsetsql";
        }

        $rst = $DB->get_records_sql($query);

        $result = array();
        $total_count = 0;

		foreach($rst as $item){
            if(!isset($result[$item->templateid])){
                $result[$item->templateid] = Template::create($item);
            }
            else{
                $result[$item->templateid]->addActivity($item);
            }
            $total_count = $item->total_count;
        } 

        foreach($result as $index => $item){
            if(!$item->verifyRoles()){
                unset($result[$index]);
            }
        }

        $pagination = new Pagination();
        $pagination->items = array_values($result);
        $pagination->current_offset = $offset;
        $pagination->total_count = $total_count;

        return $pagination;
    }

    public function getTemplate($userId, $templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.description as templatedesc,  if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, t4.fullname as coursename, 
        t2.id as tpl_act_id, t2.cmid, t2.nb_hours_completion, t2.slot, t4.id as courseid, t4.shortname as coursename, t5.id as categoryid, t5.name as categoryname, tblRoles.roles, tblCatRoles.categoryroles
        from {recit_wp_tpl} as t1
        inner join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        inner join {course_modules} as t3 on t2.cmid = t3.id
        inner join {course} as t4 on t3.course = t4.id
        inner join {course_categories} as t5 on t4.category = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t4.id = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t4.category = tblCatRoles.categoryId
        where t1.id =:templateid
        order by t4.id asc, t1.name asc, t2.slot asc";

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

    public function cloneTemplate($templateId){
        try{
            $this->mysqlConn->beginTransaction();

            $query = "insert into {$this->prefix}recit_wp_tpl (creatorid, name, description, lastupdate) select creatorid, concat(name, ' (copie)'), description, now() from {$this->prefix}recit_wp_tpl where id = $templateId";
            $this->mysqlConn->execSQL($query);
            $newTemplateId = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl", "id");

            $query = "insert into {$this->prefix}recit_wp_tpl_act (templateid, cmid, nb_hours_completion) select $newTemplateId, cmid, nb_hours_completion from {$this->prefix}recit_wp_tpl_act where templateid = $templateId";
            $this->mysqlConn->execSQL($query);

            $this->mysqlConn->commitTransaction();
            return true;
        }
        catch(\Exception $ex){
            $this->mysqlConn->rollbackTransaction();
            throw $ex;
        }  
    }

    public function saveTplAct($data){
        try{	
            if($data->templateId == 0){
                $template = new Template();
                $data->templateId = $this->saveTemplate($template);
            }
            else{
                $fields = array("lastupdate");
                $values = array(time());
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl", $fields, $values, array("id"), array($data->templateId));
                $this->mysqlConn->execSQL($query);
            }

            $fields = array("slot", "templateid", "cmid", "nb_hours_completion");
            $values = array($data->slot, $data->templateId, $data->cmId, $data->nbHoursCompletion);

            if($data->id == 0){
                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wp_tpl_act", $fields, $values);
                $this->mysqlConn->execSQL($query);

                $data->id = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl_act", "id");
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl_act", $fields, $values, array("id"), array($data->id));
                $this->mysqlConn->execSQL($query);
            }

            $this->recalculateCalendarEvents($data->templateId);

            $result = new StdClass();
            $result->templateId = $data->templateId;
            $result->tplActId = $data->id;

            return $result;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function deleteTplAct($tplActId){
        try{
            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl_act where id = $tplActId");
            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }  
    }

    public function getStudentList($templateId){
        global $DB, $OUTPUT;

        $result = array();

        if($templateId == 0 ){
            return $result;
        }

        $query = "select t1.id, t1.firstname, t1.lastname, t1.picture
        from {user} as t1
        inner join {user_enrolments} as t2 on t1.id = t2.userid
        inner join {enrol} as t3 on t2.enrolid = t3.id
        where t3.courseid in (select st2.course from {recit_wp_tpl_act} as st1 
                             inner join {course_modules} as st2 on st1.cmid = st2.id 
                             where st1.templateid = $templateId)
        order by firstname, lastname asc";

        $rst = $DB->get_records_sql($query);

        
		foreach($rst as $item){
            $obj = new stdClass();
            $obj->userPix = $OUTPUT->user_picture($item, array('size'=>30));
            $obj->userUrl = (new \moodle_url('/user/profile.php', array('id' => $item->id)))->out();
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

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t1.completionstate as wpcompletionstate,
        t2.id as templateid, t2.creatorid, t2.name as templatename, 
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.id as tpl_act_id, t3.cmid, t3.nb_hours_completion, t4.id as userid, t4.firstname, t4.lastname, tblRoles.roles, tblCatRoles.categoryroles
        from {recit_wk_tpl_assign} as t1
        inner join {recit_wp_tpl} as t2 on t1.templateid = t2.id
        inner join {recit_wp_tpl_act} as t3 on t3.templateid = t2.id
        inner join {user} as t4 on t1.userid = t4.id
        inner join {course} as t6 on t5.course = t6.id
        inner join {course_modules} as t5 on t3.cmid = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t6.category = tblCatRoles.categoryId
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

    public function getAssignmentList($userId, $limit = 0, $offset = 0, $forStudent = false){
        $query = "select  t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t1.completionstate as wpcompletionstate, t2.id as templateid, t2.creatorid, t2.name as templatename, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, t4.id as userid, t4.firstname, t4.lastname, count(*) OVER() AS total_count,
        t6.completionstate, tblRoles.roles, tblCatRoles.categoryroles
        from {$this->prefix}recit_wk_tpl_assign as t1
        inner join {$this->prefix}recit_wp_tpl as t2 on t1.templateid = t2.id
        inner join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        inner join {$this->prefix}user as t4 on t1.userid = t4.id
        inner join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        inner join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_modules_completion as t6 on t5.id = t6.coursemoduleid and t6.userid = t4.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t7.category = tblCatRoles.categoryId";

        if ($forStudent){
            $query .= " where t1.userid=".$userId;
        }
        
        if ($limit > 0){
            $offsetsql = $offset * $limit;
            $query .= " LIMIT $limit OFFSET $offsetsql";
        }

        $rst = $this->mysqlConn->execSQLAndGetObjects($query);

        $result = new MyAssignments();
        $total_count = 0;
		foreach($rst as $item){
            $result->addAssignment($item);
            $total_count = $item->total_count;
        }  

        foreach($result->detailed as $index => $item){
            if(!$item->template->verifyRoles($forStudent)){
                unset($result->detailed[$index]);
                continue;
            }

            $item->setEndDate();
        } 

        $pagination = new Pagination();
        $pagination->items = $result;
        $pagination->current_offset = $offset;
        $pagination->total_count = $total_count;
        return $pagination;
    }

    public function saveAssignment($data){
        try{
            $startDate = $data->startDate;
            if (is_string($data->startDate)) $startDate = new DateTime($data->startDate);

            $fields = array("templateid", "userid", "nb_hours_per_week", "startdate", "lastupdate");
            $values = array($data->template->id, $data->userId, $data->nbHoursPerWeek, $startDate->getTimestamp(), time());

            if($data->id == 0){
                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wk_tpl_assign", $fields, $values);
                $this->mysqlConn->execSQL($query);
                $data->id = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wk_tpl_assign", "id");
                $this->addCalendarEvent($data->template->id, $data->userId);
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wk_tpl_assign", $fields, $values, array("id"), array($data->id));
                $this->mysqlConn->execSQL($query);
                $this->deleteCalendarEvent($data->id, $data->userId);
                $this->addCalendarEvent($data->template->id, $data->userId);
            }

            return $data->id;
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

    public function setAssignmentCompletionState($userId, $cmId){
        try{		
            $query = "select assignmentId, templateid,  (case when nbIncompleteAct = 0 then 1 when now() > enddate and nbIncompleteAct > 0 then 2 else 0 end) as completionstate, nbIncompleteAct, startdate, enddate, cmids FROM
            (select t1.id as assignmentId, t1.templateid, from_unixtime(any_value(t1.startdate)) as startdate, date_add(from_unixtime(any_value(t1.startdate)), interval (sum(t2.nb_hours_completion) / any_value(t1.nb_hours_per_week)) week) as enddate, sum(if(coalesce(t3.completionstate,0) = 0, 1, 0)) as nbIncompleteAct,
             group_concat(DISTINCT t2.cmid) as cmids
            from mdl_recit_wk_tpl_assign as t1 
            inner join mdl_recit_wp_tpl_act as t2 on t1.templateid = t2.templateid 
            left join mdl_course_modules_completion as t3 on t2.cmid = t3.coursemoduleid and t1.userid = t3.userid
            where t1.userid = $userId
            group by t1.userid, t1.id) as tab
            where find_in_set($cmId, cmids) > 0";
           
            $obj = $this->mysqlConn->execSQLAndGetObject($query);

            if(!empty($obj)){
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wk_tpl_assign", array('completionstate'), array($obj->completionstate), array("id"), array($obj->assignmentId));
                $this->mysqlConn->execSQL($query);
            }

            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    private function addCalendarEvent($templateId, $userId){
        global $DB;
        $tpl = $DB->get_record('recit_wp_tpl', array('id' => $templateId));

        $name = "Fin du plan ".$tpl->name;
        $desc = $name; 
        $assignments = $this->getAssignment($userId, $templateId);
        if (!isset($assignments[0])) return;
        $assignment = $assignments[0];
        $assignment->setEndDate();
        if (!$assignment->endDate) return;

        $event = new stdClass();
        $event->eventtype = 'planformation';
        $event->type = CALENDAR_EVENT_TYPE_STANDARD; // This is used for events we only want to display on the calendar, and are not needed on the block_myoverview.
        $event->name = $name;
        $event->description = $desc;
        $event->format = FORMAT_HTML;
        $event->courseid = 0;
        $event->groupid = 0;
        $event->userid = $userId;
        $event->modulename = '';
        $event->instance = $assignment->id;
        $event->timestart = $assignment->endDate->getTimestamp();
        $event->visible = TRUE;
        $event->timeduration = 0;

        \calendar_event::create($event);
    }

    private function deleteCalendarEvent($assignmentId = 0, $userId = 0){
        global $DB;
        $where = array('eventtype' => 'planformation');
        if ($assignmentId > 0){
            $where['instance'] = $assignmentId;
        }
        if ($userId > 0){
            $where['userid'] = $userId;
        }
        $DB->delete_records('event', $where);
    }

    private function recalculateCalendarEvents($tplId, $assignments = false){
        global $DB;
        if (!$assignments){
            $assignments = $DB->get_records('recit_wk_tpl_assign', array('templateid' => $tplId));
        }
        foreach($assignments as $assignment){
            $this->deleteCalendarEvent($assignment->id);
            $this->addCalendarEvent($assignment->templateid, $assignment->userid);
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

    public function verifyRoles($isStudent = false){
        foreach($this->activities as $act){
            if(!Utils::isAdminRole($act->roles) && !Utils::isAdminRole($act->categoryroles) && !$isStudent){
                return false;
            }
            if($act->roles[0] != 'sd' && $isStudent){
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
    public $cmUrl = "";
    public $courseId = 0;
    public $slot = 0;
    public $courseName = "";
    public $categoryId = 0;
    public $categoryName = "";
    public $nbHoursCompletion = 0;
    public $roles = "";
    public $categoryroles = "";
    /**
     * Whether or not the user has completed the activity. 
     * Available states: 0 = not completed if there's no row in this table, that also counts as 0 1 = completed 2 = completed, show passed 3 = completed, show failed
     */
    public $completionState = 0;

    public static function create($dbData){
        $result = new TemplateActivity();
        $result->id = (isset($dbData->tpl_act_id) ? $dbData->tpl_act_id : $result->id);
        $result->cmId = (isset($dbData->cmid) ? $dbData->cmid : $result->cmId);
        $result->cmName = (isset($dbData->cmname) ? $dbData->cmname : $result->cmName);
        $result->slot = (isset($dbData->slot) ? $dbData->slot : $result->slot);
        $result->courseId = (isset($dbData->courseid) ? $dbData->courseid : $result->courseId);
        $result->courseName = (isset($dbData->coursename) ? $dbData->coursename : $result->courseName);
        $result->categoryId = (isset($dbData->categoryid) ? $dbData->categoryid : $result->categoryId);
        $result->categoryName = (isset($dbData->categoryname) ? $dbData->categoryname : $result->categoryName);
        $result->nbHoursCompletion = (isset($dbData->nb_hours_completion) ? $dbData->nb_hours_completion : $result->nbHoursCompletion);

        $result->roles = explode(",", $dbData->roles);
        $result->roles = Utils::moodleRoles2RecitRoles($result->roles);

        $result->categoryroles = explode(",", $dbData->categoryroles);
        $result->categoryroles = Utils::moodleRoles2RecitRoles($result->categoryroles);

        $result->completionState = (isset($dbData->completionstate) ? $dbData->completionstate : $result->completionState);

        //Get cm name
        if ($result->cmId > 0 && empty($result->cmName)){
            list ($course, $cm) = get_course_and_cm_from_cmId($result->cmId);
            $result->cmName = $cm->name;
            $result->cmUrl = $cm->__get('url')->out();
            $result->courseUrl = (new \moodle_url('/course/view.php?id='.$course->id))->out();
        }

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
    public $endDate = null;
    public $nbHoursPerWeek = 0;
    /**
     * 0 = ongoing, 1 = finished, 2 = late
     */
    public $completionState = 0;
    
    public function __construct(){
        $this->template = new Template();      
        $this->startDate = new DateTime();      
    }

    public static function create($dbData){
        global $OUTPUT, $DB;
        $result = new Assignment();
        $result->id = $dbData->id;
        $result->template = Template::create($dbData);

        $user = $DB->get_record('user', array('id' => $dbData->userid));
        $result->userPix = $OUTPUT->user_picture($user, array('size'=>30));

        $result->userId = $dbData->userid;
        $result->userUrl = (new \moodle_url('/user/profile.php', array('id' => $result->userId)))->out();
        $result->firstName = $dbData->firstname;
        $result->lastName = $dbData->lastname;
        $result->startDate = $dbData->startdate;
        if (is_string($dbData->startdate)){
            $result->startDate = new DateTime($dbData->startdate);
        }
        $result->nbHoursPerWeek = $dbData->nbhoursperweek;
        $result->completionState = $dbData->wpcompletionstate;

        return $result;
    }

    public function setEndDate(){
        if($this->nbHoursPerWeek == 0){ return; }

        $nbHoursCompletion = 0;
        foreach($this->template->activities as $item){
            $nbHoursCompletion += $item->nbHoursCompletion;
        }

        $nbWeeks = ceil($nbHoursCompletion / $this->nbHoursPerWeek); //Round to highest number

        $this->endDate = clone $this->startDate;
        $this->endDate->modify("+$nbWeeks week");
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

class Pagination {
    public $total_count;
    public $current_offset;
    public $items;
}