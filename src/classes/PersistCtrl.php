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

    public function getUserRoles($userId, $courseId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select @uniqueId := @uniqueId + 1 as uniqueId, st1.shortname from {role_assignments} as t1
        inner join {role} as st1 on st1.id = t1.roleid where t1.userid=$userId
        ";

        $rst = $DB->get_records_sql($query);
        $rst = array_values($rst);

        $result = array();
        if (isset($rst[0])){
            foreach ($rst as $data){
                $result[] = $data->shortname;
            }
        }
        $result = Utils::moodleRoles2RecitRoles($result);

        return $result;
    }

    public function getTemplateList($userId, $limit = 0, $offset = 0){
        
        $query = "select  t2.id as templateid, t2.creatorid, t2.name as templatename, t2.state as templatestate, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, 
        count(*) OVER() AS total_count,
        tblRoles.roles, tblCatRoles.categoryroles, t8.name as categoryname, t3.id as tpl_act_id
        from  {$this->prefix}recit_wp_tpl as t2 
        left join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        left join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        left join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_categories as t8 on t7.category = t8.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t7.category = tblCatRoles.categoryId
        where t2.state = 1";

        if ($limit > 0){
            $offsetsql = $offset * $limit;
            $query .= " LIMIT $limit OFFSET $offsetsql";
        }

        $rst = $this->mysqlConn->execSQLAndGetObjects($query);

        $workPlanList = array();
        $total_count = 0;
		foreach($rst as $item){
            if(!isset($workPlanList[$item->templateid])){
                $workPlanList[$item->templateid] = new WorkPlan();
            }
            $workPlanList[$item->templateid]->addTemplateActivity($item);
            $total_count = $item->total_count;
        }  

        foreach($workPlanList as $item){
            $item->verifyRoles(false);
        }

        $pagination = new Pagination();
        $pagination->items = array_values($workPlanList);
        $pagination->current_offset = $offset;
        $pagination->total_count = $total_count;

        return $pagination;
    }

    public function getTemplate($userId, $templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.state as templatestate, t1.description as templatedesc,  if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, t4.fullname as coursename, 
        t2.id as tpl_act_id, t2.cmid, t2.nb_hours_completion, t2.slot, t4.id as courseid, t4.shortname as coursename, t5.id as categoryid, t5.name as categoryname, tblRoles.roles, tblCatRoles.categoryroles
        from {recit_wp_tpl} as t1
        left join {recit_wp_tpl_act} as t2 on t1.id = t2.templateid
        left join {course_modules} as t3 on t2.cmid = t3.id
        left join {course} as t4 on t3.course = t4.id
        left join {course_categories} as t5 on t4.category = t5.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t4.id = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t4.category = tblCatRoles.categoryId
        where t1.id =:templateid
        order by t4.id, t2.slot asc";

        $rst = $DB->get_records_sql($query, array('templateid' => $templateId));

        $modinfo = null;
        $result = null;
		foreach($rst as $item){
            if($result == null){
                $result = Template::create($item);
            }
            
            if($item->cmid == 0){ continue;}

            if($modinfo == null || $modinfo->__get('courseid') != $item->courseid){
                $modinfo = get_fast_modinfo($item->courseid);
            }
            
            $item->cmname = $this->getCmNameFromCmId($item->cmid, $item->courseid, $modinfo);
            
            $result->addActivity($item);
        }  

        if(!$result->verifyRoles()){
            throw new \Exception("The logged in user has no permission to view this template.");
        }

        return $result;
    }

    public function saveTemplate($data){
        try{	
            $result = $data->id;
            $fields = array("name", "description", "lastupdate", "state");
            $values = array($data->name, $data->description, time(), $data->state);

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

   /*public function deleteTemplate($templateId){
        try{
            $query = "delete t1, t2, t3
                     from {$this->prefix}recit_wp_tpl as t1
                    left join {$this->prefix}recit_wp_tpl_act as t2 on t1.id = t2.templateid 
                    left join {$this->prefix}recit_wp_tpl_assign as t3 on t1.id = t3.templateid
                    where t1.id = $templateId";

            $this->mysqlConn->execSQL($query);
            return true;
        } 
        catch(\Exception $ex){
            throw $ex;
        }  
    }*/

    public function cloneTemplate($templateId, $state = null){
        try{
            $this->mysqlConn->beginTransaction();

            if (!is_numeric($state)){
                $query = "insert into {$this->prefix}recit_wp_tpl (creatorid, name, description, lastupdate, state) select creatorid, concat(name, ' (copie)'), description, now(), state from {$this->prefix}recit_wp_tpl where id = $templateId";
            }else{
                $query = "insert into {$this->prefix}recit_wp_tpl (creatorid, name, description, lastupdate, state) select {$this->signedUser->id}, concat(name, ' (copie)'), description, now(), $state from {$this->prefix}recit_wp_tpl where id = $templateId";
            }
            $this->mysqlConn->execSQL($query);
            $newTemplateId = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl", "id");

            $query = "insert into {$this->prefix}recit_wp_tpl_act (templateid, cmid, nb_hours_completion, slot) select $newTemplateId, cmid, nb_hours_completion, slot from {$this->prefix}recit_wp_tpl_act where templateid = $templateId";
            $this->mysqlConn->execSQL($query);

            $this->mysqlConn->commitTransaction();
            return $newTemplateId;
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

        $query = "select t1.id, t1.firstname, t1.lastname, t1.picture, group_concat(t10.name) as grouplist
        from {user} as t1
        inner join {user_enrolments} as t2 on t1.id = t2.userid
        inner join {enrol} as t3 on t2.enrolid = t3.id
        left join (select g.name,gm.userid,g.courseid from {groups_members} as gm
        inner join {groups} as g on gm.groupid = g.id) as t10 on t10.courseid = t3.courseid and t10.userid = t2.userid
        left join (select st3.instanceid as courseId, 
        group_concat(distinct st1.shortname) as roles, st2.userid
        from {role} as st1 
        inner join {role_assignments} as st2 on st1.id = st2.roleid 
        inner join {context} as st3 on st2.contextid = st3.id and contextlevel = 50
        group by st2.userid, st3.instanceid) as tblRoles on t3.courseid = tblRoles.courseId and t1.id = tblRoles.userid
        where t3.courseid in (select st2.course from {recit_wp_tpl_act} as st1 
                             inner join {course_modules} as st2 on st1.cmid = st2.id 
                             where st1.templateid = $templateId) and tblRoles.roles = 'student'
        group by t1.id
        order by firstname, lastname asc";

        $rst = $DB->get_records_sql($query);

        
		foreach($rst as $item){
            $obj = new stdClass();
            $obj->avatar = $OUTPUT->user_picture($item, array('size'=>30));
            $obj->userUrl = (new \moodle_url('/user/profile.php', array('id' => $item->id)))->out();
            $obj->userId = $item->id;
            $obj->groupList = explode(',',$item->grouplist);
            $obj->firstName = $item->firstname;
            $obj->lastName = $item->lastname;
            $result[] = $obj;
        } 

        return $result;
    }

    protected function createTmpWorkPlanTable($query){
        $this->mysqlConn->execSQL("create temporary table workplans $query");
    }

    protected function dropTmpWorkPlanTable(){
        $this->mysqlConn->execSQL("drop temporary table workplans");
    }

    protected function getWorkPlanStats($templateId){
        $query = "select templateid, count(distinct cmid) as nbActivities, count(DISTINCT userid) as nbStudents, 
        (case wpcompletionstate when 1 then count(distinct userid,wpcompletionstate) else 0 end) as workPlanCompletion,
        coalesce(group_concat(if(activitycompletionstate = 1, concat('cmid',cmid), null)),0) activitycompleted, 
        coalesce(group_concat(if(activitycompletionstate = 1, concat('userid',userid), null)),0) assignmentcompleted,
        (case wpcompletionstate when 2 then count(distinct userid,wpcompletionstate) else 0 end) as nbLateStudents
            from workplans where templateid = $templateId group by templateid";

        $result = $this->mysqlConn->execSQLAndGetObject($query);

        $result->activitycompleted = array_count_values(explode(",", $result->activitycompleted));
        $result->assignmentcompleted = array_count_values(explode(",", $result->assignmentcompleted));

        return $result;
    }

    public function getWorkPlan($userId, $templateId){
        $query = "select  t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t1.completionstate as wpcompletionstate, t2.id as templateid, t2.creatorid, t2.name as templatename, t2.state as templatestate, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, count(*) OVER() AS total_count,
        t6.completionstate as activitycompletionstate, tblRoles.roles, tblCatRoles.categoryroles, t1.assignorid, t8.name as categoryname, t3.id as tpl_act_id, t1.comment as comment,
        users.userid, users.firstname, users.lastname, users.lastaccess, users.grouplist
        from {$this->prefix}recit_wp_tpl as t2
        left join {$this->prefix}recit_wp_tpl_assign as t1 on t1.templateid = t2.id
        left join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        left join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        left join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_categories as t8 on t7.category = t8.id
        left join (select t4.id as userid, t4.firstname, t4.lastname, from_unixtime(t4.lastaccess) as lastaccess, group_concat(t10.name) as grouplist, t10.courseid
            from {$this->prefix}user as t4
            left join {$this->prefix}groups_members as t9 on t4.id = t9.userid 
            left join {$this->prefix}groups as t10 on t9.groupid = t10.id 
            group by t4.id, t10.courseid) as users on users.userid = t1.userid and (users.courseid = t5.course or users.courseid is null)
        left join {$this->prefix}course_modules_completion as t6 on t5.id = t6.coursemoduleid and t6.userid = users.userid 
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t7.category = tblCatRoles.categoryId
        where  t2.id = $templateId
        order by t7.id asc, users.firstname asc, users.lastname asc, t3.slot ";

        $this->createTmpWorkPlanTable($query);

        $rst = $this->mysqlConn->execSQLAndGetObjects("select * from workplans");

        $result = new WorkPlan();
        $modinfo = null;
		foreach($rst as $item){
            if($item->courseid > 0){
                if($modinfo == null || $modinfo->__get('courseid') != $item->courseid){
                    $modinfo = get_fast_modinfo($item->courseid);
                }
                
                $item->cmname = $this->getCmNameFromCmId($item->cmid, $item->courseid, $modinfo);
            }
            

            $result->addTemplateActivity($item);
            $result->addAssignment($item);
        }  

        /*usort($result->template->activities, function ($a, $b) {
            return strcmp($a->slot, $b->slot);
        });*/

        $result->verifyRoles(false);
        $result->setAssignmentsEndDate();       
        $result->stats = $this->getWorkPlanStats($templateId);

        $this->dropTmpWorkPlanTable();

        return $result; 
    }

    public function getWorkPlanList($userId, $limit = 0, $offset = 0, $state = 'ongoing', $forStudent = false){
        $where = "";
        if ($state == 'ongoing'){
            $where = "(t1.completionstate in (0,2) and t2.state = 0) or (t1.completionstate is null and t2.state = 0)";
        }
        if ($state == 'archive'){
            $where = "(t1.completionstate = 1 and t2.state = 0)";
        }
        $wheretmp = "";
        if ($forStudent){
            $wheretmp .= "where userid = $userId";
        }else{
            $wheretmp .= "where creatorid = $userId";
        }

        $query = "select t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t1.completionstate as wpcompletionstate, t2.id as templateid, t2.creatorid, t2.name as templatename, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, t4.id as userid, t4.firstname, t4.lastname, count(*) OVER() AS total_count,
        t6.completionstate as activitycompletionstate, tblRoles.roles, tblCatRoles.categoryroles, t1.assignorid, t8.name as categoryname, t3.id as tpl_act_id, t2.state as templatestate, t1.comment as comment
        from {$this->prefix}recit_wp_tpl as t2
        left join {$this->prefix}recit_wp_tpl_assign as t1 on t1.templateid = t2.id
        left join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        left join {$this->prefix}user as t4 on t1.userid = t4.id
        left join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        left join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_categories as t8 on t7.category = t8.id
        left join {$this->prefix}course_modules_completion as t6 on t5.id = t6.coursemoduleid and t6.userid = t4.id
        left join (".$this->getAdminRolesStmt($userId).") as tblRoles on t5.course = tblRoles.courseId
        left join (".$this->getCatAdminRolesStmt($userId).") as tblCatRoles on t7.category = tblCatRoles.categoryId 
        where $where";

        if ($limit > 0){
            $offsetsql = $offset * $limit;
            $query .= " LIMIT $limit OFFSET $offsetsql";
        }

        $this->createTmpWorkPlanTable($query);
        
        $rst = $this->mysqlConn->execSQLAndGetObjects("select * from workplans $wheretmp");

        $workPlanList = array();
        $total_count = 0;
		foreach($rst as $item){
            if(!isset($workPlanList[$item->templateid])){
                $workPlanList[$item->templateid] = new WorkPlan();
            }
            $workPlanList[$item->templateid]->addTemplateActivity($item);
            $workPlanList[$item->templateid]->addAssignment($item);
            $total_count = $item->total_count;
        }  

        foreach($workPlanList as $item){
            $item->verifyRoles($forStudent);
            $item->setAssignmentsEndDate();       
            $item->stats = $this->getWorkPlanStats($item->template->id);
        }

        $pagination = new Pagination();
        $pagination->items = array_values($workPlanList);
        $pagination->current_offset = $offset;
        $pagination->total_count = $total_count;

        $this->dropTmpWorkPlanTable();

        return $pagination;
    }

    public function deleteWorkPlan($templateId){
        try{
            $this->mysqlConn->beginTransaction();
            
            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl_assign where templateid = $templateId");

            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl_act where templateid = $templateId");

            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl where id = $templateId");

            $this->mysqlConn->commitTransaction();
            return true;
        }
        catch(\Exception $ex){
            $this->mysqlConn->rollbackTransaction();
            throw $ex;
        }  
    }

    public function saveAssignment($data){
        try{
            $startDate = $data->startDate;
            if (is_string($data->startDate)) $startDate = new DateTime($data->startDate);

            $fields = array("templateid", "userid", "assignorid", "nb_hours_per_week", "startdate", "lastupdate", "comment");
            $values = array($data->templateId, $data->user->id, $this->signedUser->id, $data->nbHoursPerWeek, $startDate->getTimestamp(), time(), $data->comment);

            if (isset($data->completionState)){
                $fields[] = "completionstate";
                $values[] = $data->completionState;
            }

            if($data->id == 0){
                $query = $this->mysqlConn->prepareStmt("insert", "{$this->prefix}recit_wp_tpl_assign", $fields, $values);
                $this->mysqlConn->execSQL($query);
                $data->id = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl_assign", "id");
                $this->addCalendarEvent($data->templateId, $data->user->id);
            }
            else{
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl_assign", $fields, $values, array("id"), array($data->id));
                $this->mysqlConn->execSQL($query);
                $this->deleteCalendarEvent($data->id, $data->user->id);
                $this->addCalendarEvent($data->templateId, $data->user->id);
            }

            return $data->id;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function deleteAssignment($assignmentId){
        try{
            $this->mysqlConn->execSQL("delete from {$this->prefix}recit_wp_tpl_assign where id = $assignmentId");
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
            from mdl_recit_wp_tpl_assign as t1 
            inner join mdl_recit_wp_tpl_act as t2 on t1.templateid = t2.templateid 
            left join mdl_course_modules_completion as t3 on t2.cmid = t3.coursemoduleid and t1.userid = t3.userid
            where t1.userid = $userId
            group by t1.userid, t1.id) as tab
            where find_in_set($cmId, cmids) > 0";
           
            $obj = $this->mysqlConn->execSQLAndGetObject($query);

            if(!empty($obj)){
                $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl_assign", array('completionstate'), array($obj->completionstate), array("id"), array($obj->assignmentId));
                $this->mysqlConn->execSQL($query);
            }

            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }
    

    private function addCalendarEvent($templateId, $userId){
        global $CFG;
        $workPlan = $this->getWorkPlan($userId, $templateId);
        if ($workPlan == null){ return; }

        $name = "Fin du plan ".$workPlan->template->name;
        $desc = "<a href='".$CFG->wwwroot."/local/recitworkplan/view.php'>".$name."</a>"; 
        $workPlan->setAssignmentsEndDate();
        if (!isset($workPlan->assignments[0]->endDate)){ return; } 

        $event = new stdClass();
        $event->eventtype = 'planformation';
        $event->type = CALENDAR_EVENT_TYPE_ACTION; // This is used for events we only want to display on the calendar, and are not needed on the block_myoverview.
        $event->name = $name;
        $event->description = $desc;
        $event->format = FORMAT_HTML;
        $event->courseid = 0;
        $event->groupid = 0;
        $event->userid = $userId;
        $event->modulename = '';
        $event->instance = $workPlan->assignments[0]->id;
        $event->timestart = $workPlan->assignments[0]->endDate->getTimestamp();
        $event->timeend = $workPlan->assignments[0]->endDate->getTimestamp();
        $event->visible = TRUE;
        $event->timeduration = 0;

        \calendar_event::create($event, false);
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
    
    public function recalculateCalendarEvents($tplId, $assignments = false){
        global $DB;
        if (!$assignments){
            $assignments = $DB->get_records('recit_wp_tpl_assign', array('templateid' => $tplId));
        }
        foreach($assignments as $assignment){
            //$this->deleteCalendarEvent($assignment->id);
            //$this->addCalendarEvent($assignment->templateid, $assignment->userid);
        }
    }
}

class Template{
    public $id = 0;
    public $name = "";
    public $description = "";
    public $creatorId = 0;
    public $state = 0;
    public $lastUpdate = null;
    //@array of TemplateActivity
    public $activities = array();

    public $followUps = array();
 
    public static function create($dbData){
        $result = new Template();
        $result->id = $dbData->templateid;
        $result->name = $dbData->templatename;
        $result->description = $dbData->templatedesc; 
        $result->creatorId = $dbData->creatorid;
        $result->lastUpdate = $dbData->lastupdate;
        $result->state = $dbData->templatestate;

        return $result;
    }

    public function addActivity($dbData){
        if(!isset($dbData->cmid) || !isset($dbData->tpl_act_id) || $dbData->cmid <= 0){ return; }

        foreach($this->activities as $item){
            if($item->id == $dbData->tpl_act_id){
                return;
            }
        }

        $this->activities[] = TemplateActivity::create($dbData);
    }

    public function verifyRoles($isStudent = false){
        foreach($this->activities as $act){
            if(!Utils::isAdminRole($act->roles) && !Utils::isAdminRole($act->categoryroles) && !$isStudent){
                return false;
            }
            if(isset($act->roles[0]) && $act->roles[0] != 'sd' && $isStudent){
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

        //Get cm url
        if ($result->cmId > 0){
            try {
                list ($course, $cm) = get_course_and_cm_from_cmId($result->cmId, '', $result->courseId);
                $url = $cm->__get('url');
                // if user has permission
                if($url){
                    $result->cmUrl = $cm->__get('url')->out();
                    $result->cmName = $cm->name;
                }
            }catch(\Exception $e){
                //cm does not exist
            }
        }

        return $result;
    }
}

class Assignment{
    public $id = 0;
    public $user = null;
    public $assignor = null;
    public $startDate = null;
    public $endDate = null;
    public $nbHoursPerWeek = 0;
    public $templateId = 0;
    public $comment = "";
    /**
     * 0 = ongoing, 1 = archived, 2 = late
     */
    public $completionState = 0;

    public function __construct(){
        $this->startDate = new DateTime();    
    }

    public static function create($dbData){
        global $OUTPUT, $DB;

        if(!isset($dbData->id) || $dbData->id == null || $dbData->id == 0){
            return null;
        }

        $result = new Assignment();
        $result->id = $dbData->id;
        $result->templateId = $dbData->templateid;
      
        if((isset($dbData->userid)) && ($dbData->userid != 0)){
            $user = $DB->get_record('user', array('id' => $dbData->userid));
            $result->user = new stdClass();
            $result->user->id = $dbData->userid;
            $result->user->firstName = $dbData->firstname;
            $result->user->lastName = $dbData->lastname;
            $result->user->groupList = (isset($dbData->grouplist) ? $dbData->grouplist : ''); 
            $result->user->lastAccess = (isset($dbData->lastaccess) ? $dbData->lastaccess : ''); 
            $result->user->avatar = $OUTPUT->user_picture($user, array('size'=> 50));
            $result->user->activities = array();
        }
        
        if((isset($dbData->assignorid)) && ($dbData->assignorid != 0)){
            $assignor = $DB->get_record('user', array('id' => $dbData->assignorid));        
            $result->assignor = new stdClass();
            $result->assignor->id = $dbData->assignorid;
            $result->assignor->firstName = $assignor->firstname;
            $result->assignor->lastName = $assignor->lastname;
            $result->assignor->url = (new \moodle_url('/user/profile.php', array('id' => $assignor->id)))->out();
            $result->assignor->avatar = $OUTPUT->user_picture($assignor, array('size'=> 50));
        }

        // $result->userUrl = (new \moodle_url('/user/profile.php', array('id' => $result->userId)))->out();

        $result->startDate = $dbData->startdate;
        if (is_string($dbData->startdate)){
            $result->startDate = new DateTime($dbData->startdate);
        }

        $result->nbHoursPerWeek = $dbData->nbhoursperweek;
        $result->comment = $dbData->comment;
        $result->completionState = $dbData->wpcompletionstate;

        return $result;
    }

    public function addUserActivity($dbData){
        /**
         * Whether or not the user has completed the activity. 
         * Available states: 0 = not completed if there's no row in this table, that also counts as 0 1 = completed 2 = completed, show passed 3 = completed, show failed
         */
        $item = new stdClass();
        $item->completionState = (isset($dbData->activitycompletionstate) ? $dbData->activitycompletionstate : 0);
        $item->cmId = (isset($dbData->cmid) ? $dbData->cmid : 0);
        $this->user->activities[] = $item;
    }

    public function setEndDate($template){
        if($this->nbHoursPerWeek == 0){ return; }
        if(empty($template)){ return;}

        $nbHoursCompletion = 0;
        foreach($template->activities as $item){
            $nbHoursCompletion += $item->nbHoursCompletion;
        }

        $nbWeeks = ceil($nbHoursCompletion / $this->nbHoursPerWeek); //Round to highest number

        $this->endDate = clone $this->startDate;
        $this->endDate->modify("+$nbWeeks week");
    }
}

class WorkPlan{
    //@Template
    public $template = null;
    public $assignments = array();
    public $stats = null;
 
    public function __construct(){
        $this->template = new Template();
    }

    public function addAssignment($dbData){   
        foreach($this->assignments as $item){
            if($item->id == $dbData->id){
                $item->addUserActivity($dbData);
                return;
            }
        }

        $obj = Assignment::create($dbData);
        if($obj != null){
            $obj->addUserActivity($dbData);
            $this->assignments[] = $obj;
        }
    }

    public function addTemplateActivity($dbData){   
        if($this->template->id == 0){
            $this->template = Template::create($dbData);
        }

        $this->template->addActivity($dbData);
    }

    public function verifyRoles($isStudent = false){
        if(empty($template)){ return;}

        foreach($this->assignments as $index => $item){
            if(!$this->template->verifyRoles($isStudent)){
                unset($this->assignments[$index]);
                continue;
            }
        }

        if (count($this->assignments) > 0){
            $this->assignments = array_values($this->assignments);
        }
    }

    public function setAssignmentsEndDate(){        
        foreach($this->assignments as $item){
            if($item != null){
                $item->setEndDate($this->template);
            }
        }
    }
}

class Pagination {
    public $total_count;
    public $current_offset;
    public $items;
}