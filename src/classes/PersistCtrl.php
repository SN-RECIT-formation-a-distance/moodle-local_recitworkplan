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
require_once __DIR__ . '/../lib.php';

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
    
    protected function getAdminRolesStmt($userId, $capabilities){
        $cap = "";
        foreach ($capabilities as $c){
            $cap .= "'".$c."',";
        }
        $cap = substr($cap, 0, -1);
        $query = "SELECT t1.id, t1.capability, t2.shortname, t3.contextid, t3.userid, t4.contextlevel, t4.instanceid
        FROM `{$this->prefix}role_capabilities` as t1 
        inner join {$this->prefix}role as t2 on t1.roleid = t2.id
        inner join {$this->prefix}role_assignments as t3 on t1.roleid = t3.roleid
        inner join {$this->prefix}context as t4 on t3.contextid = t4.id
        WHERE t1.capability in (".$cap.") and t3.userid=$userId";
        

        return $query;
    }

    public function getCatCourseSectionActivityList($enrolled = false, $categoryId = 0, $courseId = 0){
        global $DB;

        $enrolledStmt = "";
        $extraFields = "";
        $extraJoin = "";
        $whereStmt = " 1 ";
        $extraOrder = "";
        $params = array();

        if($enrolled){
            $enrolledStmt = ",(select st2.id from {enrol} as st1 inner join {user_enrolments} as st2 on st1.id = st2.enrolid where st1.courseid = t2.id and st2.userid =:userid1) as enrolled";
            $whereStmt .= " and (enrolled is not null) ";
            $params['userid1'] = $this->signedUser->id;
        }

        if($categoryId > 0){
            $whereStmt .= " and (categoryid =:categoryid) ";
            $params['categoryid'] = $categoryId;
        }

        if($courseId > 0){
            $extraFields = ", t3.id as sectionid, if(length(coalesce(t3.name, '')) = 0, concat('Section ', t3.section), t3.name) as sectionname, t4.id as cmid, 'unknown' as cmname, t4.deletioninprogress as deletioninprogress ";
            $extraJoin = " inner join {course_sections} as t3 on t2.id = t3.course inner join {course_modules} as t4 on t3.id = t4.section ";
            $whereStmt .= " and (courseid =:courseid) and (deletioninprogress = 0) ";
            $extraOrder = ", sectionname asc";
            $params['courseid'] = $courseId;
        }
        $params['userid2'] = $this->signedUser->id;
        $params['userid3'] = $this->signedUser->id;
        $params['cap1'] = RECITWORKPLAN_ASSIGN_CAPABILITY;
        $params['cap2'] = RECITWORKPLAN_MANAGE_CAPABILITY;
        $params['cap3'] = RECITWORKPLAN_MANAGE_CAPABILITY;

        $DB->execute("set @uniqueId = 0");

        $query = "select * from
        (select @uniqueId := @uniqueId + 1 as uniqueId, t1.id as categoryid, t1.name as categoryname, t2.id as courseid, t2.shortname as coursename,
        (select group_concat(distinct st3.capability) from {role_capabilities} as st3 inner join {role_assignments} as st4 on st3.roleid = st4.roleid where st4.contextid in (select id from {context} where instanceid = t2.id and contextlevel = 50) and st4.userid =:userid2 and (st3.capability=:cap1 or st3.capability=:cap2)) as roles,
        (select group_concat(distinct st3.capability) from {role_capabilities} as st3 inner join {role_assignments} as st4 on st3.roleid = st4.roleid where st4.contextid in (select id from {context} where instanceid = t2.category and contextlevel = 40) and st4.userid =:userid3 and st3.capability=:cap3) as categoryroles
        $extraFields
        $enrolledStmt
        from {course_categories} as t1
        inner join {course} as t2 on t1.id = t2.category and t2.visible = 1
        $extraJoin) as tab
        where $whereStmt
        order by categoryname asc, coursename asc $extraOrder";
        
        $rst = $DB->get_records_sql($query, $params);

        $lastCourseId = null;
        $modinfo = null;
        $result = array();
		foreach($rst as $item){                        
            unset($item->uniqueid);
            $item->categoryId = $item->categoryid; unset($item->categoryid);
            $item->categoryName = $item->categoryname; unset($item->categoryname);
            $item->courseId = $item->courseid; unset($item->courseid);
            $item->courseName = $item->coursename; unset($item->coursename);
           
            if(isset($item->roles)){
                $item->roles = explode(",", $item->roles);
            }

            if(isset($item->categoryroles)){
                $item->categoryroles = explode(",", $item->categoryroles);
            }

            if(isset($item->cmid)){
                if($lastCourseId != $item->courseId){
                    $modinfo = get_fast_modinfo($item->courseId);
                }
                $item->cmname = $this->getCmNameFromCmId($item->cmid, $item->courseId, $modinfo);

                $item->sectionId = $item->sectionid; unset($item->sectionid);
                $item->sectionName = $item->sectionname; unset($item->sectionname);
                $item->cmId = $item->cmid; unset($item->cmid);
                $item->cmName = $item->cmname; unset($item->cmname);
            }

            $result[] = $item;
        }  

        return $result;
    }

    public function getTemplateList($userId, $limit = 0, $offset = 0){
        
        $query = "select  t2.id as templateid, t2.creatorid, t2.name as templatename, t2.state as templatestate, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, t2.communication_url as communication_url, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, 
        count(*) OVER() AS total_count, t8.name as categoryname, t3.id as tpl_act_id
        from  {$this->prefix}recit_wp_tpl as t2 
        left join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        left join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        left join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_categories as t8 on t7.category = t8.id
        inner join (".$this->getAdminRolesStmt($userId, array(RECITWORKPLAN_ASSIGN_CAPABILITY, RECITWORKPLAN_MANAGE_CAPABILITY)).") as tblRoles on (t7.category = tblRoles.instanceid and tblRoles.contextlevel = 40) or (t5.course = tblRoles.instanceid and tblRoles.contextlevel = 50)
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

        $pagination = new Pagination();
        $pagination->items = array_values($workPlanList);
        $pagination->current_offset = $offset;
        $pagination->total_count = $total_count;

        return $pagination;
    }

    public function getTemplate($userId, $templateId){
        global $DB;

        $DB->execute("set @uniqueId = 0");

        $query = "select  @uniqueId := @uniqueId + 1 as uniqueId, t1.id as templateid, t1.creatorid, t1.name as templatename, t1.state as templatestate, t1.communication_url as communication_url, t1.description as templatedesc, if(t1.lastupdate > 0, from_unixtime(t1.lastupdate), null) as lastupdate, t4.fullname as coursename, 
        t2.id as tpl_act_id, t2.cmid, t2.nb_hours_completion, t2.slot, t4.id as courseid, t4.shortname as coursename, t5.id as categoryid, t5.name as categoryname
        from {$this->prefix}recit_wp_tpl as t1
        left join {$this->prefix}recit_wp_tpl_act as t2 on t1.id = t2.templateid
        left join {$this->prefix}course_modules as t3 on t2.cmid = t3.id
        left join {$this->prefix}course as t4 on t3.course = t4.id
        left join {$this->prefix}course_categories as t5 on t4.category = t5.id
        left join (".$this->getAdminRolesStmt($userId, array(RECITWORKPLAN_ASSIGN_CAPABILITY, RECITWORKPLAN_MANAGE_CAPABILITY)).") as tblRoles on (t4.category = tblRoles.instanceid and tblRoles.contextlevel = 40) or (t4.id = tblRoles.instanceid and tblRoles.contextlevel = 50)
        where t1.id =$templateId
        order by t4.id, t2.slot asc";//--left join for templates with no activities, otherwise it'd return null

        $rst = $this->mysqlConn->execSQLAndGetObjects($query);

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

        return $result;
    }

    public function saveTemplate($data){
        try{	
            $result = $data;
            $fields = array("name", "description", "communication_url", "lastupdate", "state");
            $values = array($data->name, $data->description, $data->communication_url, time(), $data->state);

            if($data->id == 0){
                $fields[] = "creatorid";
                $values[] = $this->signedUser->id;

                $query = $this->mysqlConn->prepareStmt("insertorupdate", "{$this->prefix}recit_wp_tpl", $fields, $values);
                $this->mysqlConn->execSQL($query);

                $result->id = $this->mysqlConn->getLastInsertId("{$this->prefix}recit_wp_tpl", "id");
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
                $query = "insert into {$this->prefix}recit_wp_tpl (creatorid, name, description, communication_url, lastupdate, state) select creatorid, concat(name, ' (copie)'), description, communication_url,  " . time() . ", state from {$this->prefix}recit_wp_tpl where id = $templateId";
            }else{
                $query = "insert into {$this->prefix}recit_wp_tpl (creatorid, name, description, communication_url, lastupdate, state) select {$this->signedUser->id}, concat(name, ' (copie)'), description, communication_url, " . time() . ", $state from {$this->prefix}recit_wp_tpl where id = $templateId";
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
        inner join (SELECT t1.id, t1.capability, t2.shortname, t3.contextid, t3.userid, t4.contextlevel, t4.instanceid
        FROM `{$this->prefix}role_capabilities` as t1 
        inner join {$this->prefix}role as t2 on t1.roleid = t2.id
        inner join {$this->prefix}role_assignments as t3 on t1.roleid = t3.roleid
        inner join {$this->prefix}context as t4 on t3.contextid = t4.id
        WHERE t1.capability = ?) as tblRoles on t3.courseid = tblRoles.instanceid and t1.id = tblRoles.userid
        where t3.courseid in (select st2.course from {recit_wp_tpl_act} as st1 
                             inner join {course_modules} as st2 on st1.cmid = st2.id 
                             where st1.templateid = $templateId)
        group by t1.id
        order by firstname, lastname asc";

        $rst = $DB->get_records_sql($query, [RECITWORKPLAN_FOLLOW_CAPABILITY]);

        
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
        $query = "select count(distinct cmid) as nbActivities, count(DISTINCT userid) as nbStudents
            from workplans where templateid = $templateId group by templateid";

        $result = $this->mysqlConn->execSQLAndGetObject($query);
        $stats = new stdClass();
        $stats->templateid = $templateId;
        $stats->activitycompleted = array();
        $stats->assignmentcompleted = array();

        if (!$result){
            $stats->nbActivities = 0;
            $stats->nbStudents = 0;
        }else{
            $stats->nbActivities = $result->nbActivities;
            $stats->nbStudents = $result->nbStudents;
        }

        $query = "SELECT COUNT(DISTINCT userid) as count FROM workplans WHERE wpcompletionstate = 3 AND templateid=$templateId";

        $rst = $this->mysqlConn->execSQLAndGetObject($query);
        if ($rst){
            $stats->workPlanCompletion = $rst->count;
        }else{
            $stats->workPlanCompletion = 0;
        }

        $query = "SELECT COUNT(DISTINCT userid) as count FROM workplans WHERE wpcompletionstate = 2 AND templateid=$templateId";

        $rst = $this->mysqlConn->execSQLAndGetObject($query);
        $stats->nbLateStudents = $rst->count;

        $query = "select count(userid) as count, cmid from workplans where activitycompletionstate in (1,2,3) and templateid = $templateId group by cmid";

        $rst = $this->mysqlConn->execSQLAndGetObjects($query);
        foreach($rst as $r){
            $stats->activitycompleted[$r->cmid] = $r->count;
        }
        
        $query = "select userid, count(cmid) as count from workplans where activitycompletionstate in (1,2,3) and templateid = $templateId group by userid";

        $rst = $this->mysqlConn->execSQLAndGetObjects($query);
        foreach($rst as $r){
            $stats->assignmentcompleted[$r->userid] = $r->count;
        }

        return $stats;
    }

    public function getWorkFollowUpStmt($templateId){
        global $CFG;
        /* Followup
            1 = à corriger
            2 = rétroaction
            */
        $stmt = "(SELECT t3.id as cmId, t1.name as cmName, FROM_UNIXTIME(min(tuser.timemodified)) as timeModified, count(*) as nbItems, tuser.userid,
        1 as followup
        FROM {$this->prefix}assign as t1
        inner join {$this->prefix}assign_submission as tuser on t1.id = tuser.assignment
        inner join {$this->prefix}course_modules as t3 on t1.id = t3.instance and t3.module = (select id from {$this->prefix}modules where name = 'assign') and t1.course = t3.course
        left join {$this->prefix}assign_grades as t4 on t4.assignment = tuser.assignment and t4.userid = tuser.userid
        where t3.id in (select cmid from {$this->prefix}recit_wp_tpl_act where templateid = $templateId) and tuser.status = 'submitted' and (coalesce(t4.grade,0) <= 0 or tuser.timemodified > coalesce(t4.timemodified,0))
        group by t3.id, t1.id, tuser.userid, tuser.timemodified)
        union
        (SELECT t3.id as cmId, t1.name as cmName, FROM_UNIXTIME(t1.timemodified) as timeModified, count(*) as nbItems, tuser.userid,
        2 as followup
        FROM {$this->prefix}recitcahiercanada as t1
        inner join {$this->prefix}recitcc_cm_notes as t2 on t1.id = t2.ccid
        left join {$this->prefix}recitcc_user_notes as tuser on t2.id = tuser.cccmid
        inner join {$this->prefix}course_modules as t3 on t1.id = t3.instance and t3.module = (select id from {$this->prefix}modules where name = 'recitcahiercanada') and t1.course = t3.course
        where if(tuser.id > 0 and length(tuser.note) > 0 and (length(REGEXP_REPLACE(trim(coalesce(tuser.feedback, '')), '<[^>]*>+', '')) = 0), 1, 0) = 1 
        and t3.id in (select cmid from {$this->prefix}recit_wp_tpl_act where templateid = $templateId) and t2.notifyteacher = 1
        group by t3.id, t1.id, tuser.userid, t1.timemodified)
        union
        (select cmId, cmName, timeModified, count(*) as nbItems, userid, followup from 
        (SELECT  t1.id as cmId, t2.name as cmName, max(t3.timemodified) as timeModified, t3.userid, t3.attempt as quizAttempt, t4.questionusageid, group_concat(tuser.state order by tuser.sequencenumber) as states,
        1 as followup
        FROM 
        {$this->prefix}course_modules as t1 
        inner join {$this->prefix}quiz as t2 on t2.id = t1.instance and t1.module = (select id from {$this->prefix}modules where name = 'quiz') and t2.course = t1.course
        inner join {$this->prefix}quiz_attempts as t3 on t3.quiz = t2.id 
        inner join {$this->prefix}question_attempts as t4 on  t4.questionusageid = t3.uniqueid
        inner join {$this->prefix}question_attempt_steps as tuser on t4.id = tuser.questionattemptid
        where t1.id in (select cmid from {$this->prefix}recit_wp_tpl_act where templateid = $templateId)
        group by t1.id, t2.id, t3.id, t4.id, tuser.userid, t3.timemodified) as tab
        where right(states, 12) = 'needsgrading'
        group by cmId, timeModified, userid)";
        
        return $stmt;
    }

    public function getWorkPlan($userId, $templateId){
        $query = "select t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t1.completionstate as wpcompletionstate, t2.id as templateid, t2.creatorid, t2.name as templatename, t2.state as templatestate, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, count(*) OVER() AS total_count,
        t6.completionstate as activitycompletionstate, t1.assignorid, assignor.picture as assignorpicture, assignor.imagealt as assignorimagealt, assignor.email as assignoremail, assignor.firstname as assignorfirstname, assignor.lastname as assignorlastname, t8.name as categoryname, t3.id as tpl_act_id, t1.comment as comment, t2.communication_url as communication_url, fup.followup, t3.slot,
        t1.userid, users.firstname, users.lastname, users.picture, users.imagealt, users.email, FROM_UNIXTIME(users.lastaccess) as lastaccess, g.grouplist
        from {$this->prefix}recit_wp_tpl as t2
        left join {$this->prefix}recit_wp_tpl_assign as t1 on t1.templateid = t2.id
        left join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        left join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        left join (".$this->getWorkFollowUpStmt($templateId).") as fup on t3.cmid = fup.cmId and t1.userid = fup.userid
        left join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_categories as t8 on t7.category = t8.id
        left join {$this->prefix}user as users on users.id = t1.userid
        left join {$this->prefix}user as assignor on t1.assignorid = assignor.id
        left join (select t9.userid as userid, group_concat(t10.name) as grouplist, t10.courseid
            from {$this->prefix}groups_members t9
            left join {$this->prefix}groups as t10 on t9.groupid = t10.id
            group by t9.userid, t10.courseid) as g on g.userid = t1.userid and g.courseid = t5.course
        left join {$this->prefix}course_modules_completion as t6 on t5.id = t6.coursemoduleid and t6.userid = users.id 
        inner join (".$this->getAdminRolesStmt($userId, array(RECITWORKPLAN_ASSIGN_CAPABILITY, RECITWORKPLAN_MANAGE_CAPABILITY)).") as tblRoles on (t7.category = tblRoles.instanceid and tblRoles.contextlevel = 40) or (t5.course = tblRoles.instanceid and tblRoles.contextlevel = 50)
        where t2.id = $templateId
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

        $result->setAssignmentsEndDate();       
        $result->stats = $this->getWorkPlanStats($templateId);

        $this->dropTmpWorkPlanTable();

        return $result; 
    }

    public function getWorkPlanList($userId, $limit = 0, $offset = 0, $state = 'ongoing', $forStudent = false){
        $where = "";
        if ($state == 'ongoing'){
            $where = "(t1.completionstate in (0,2,3) and t2.state = 0) or (t1.completionstate is null and t2.state = 0)";
        }
        if ($state == 'archive'){
            $where = "(t1.completionstate = 1 and t2.state = 0)";
        }
        
        $capabilities = array();
        $wheretmp = "";
        $innerJoinSmt = "";
        if ($forStudent){
            $wheretmp .= "where userid = $userId";
            $capabilities[] = RECITWORKPLAN_FOLLOW_CAPABILITY;
            $innerJoinSmt = "inner join (".$this->getAdminRolesStmt($userId, $capabilities).") as tblRoles on (t5.course = tblRoles.instanceid and tblRoles.contextlevel = 50)";
        }else if (in_array($state, array('ongoing','archive'))){
            $wheretmp .= "where creatorid = $userId";
            $capabilities[] = RECITWORKPLAN_ASSIGN_CAPABILITY;
            $capabilities[] = RECITWORKPLAN_MANAGE_CAPABILITY;
            $innerJoinSmt = "inner join (".$this->getAdminRolesStmt($userId, $capabilities).") as tblRoles on (t5.course = tblRoles.instanceid and tblRoles.contextlevel = 50)";
        }else if (in_array($state, array('manager'))){
            $capabilities[] = RECITWORKPLAN_MANAGE_CAPABILITY;
            $innerJoinSmt = "inner join (".$this->getAdminRolesStmt($userId, $capabilities).") as tblRoles on ((t7.category = tblRoles.instanceid and tblRoles.contextlevel = 40) or (t5.course = tblRoles.instanceid and tblRoles.contextlevel = 50))";
            $where = "(t1.completionstate in (0,2,3))";
        }
        
        $query = "select t1.id, t1.nb_hours_per_week as nbhoursperweek, from_unixtime(t1.startdate) as startdate, t1.completionstate as wpcompletionstate, t2.id as templateid, t2.creatorid as creatorid, t2.name as templatename, t7.fullname as coursename, t7.id as courseid,
        t2.description as templatedesc, t2.communication_url as communication_url, from_unixtime(t2.lastupdate) as lastupdate, t3.cmid, t3.nb_hours_completion as nb_hours_completion, t4.id as userid, t4.picture, t4.imagealt, t4.email, t4.firstname, t4.lastname, count(*) OVER() AS total_count,
        t6.completionstate as activitycompletionstate, t1.assignorid, assignor.picture as assignorpicture, assignor.imagealt as assignorimagealt, assignor.email as assignoremail, assignor.firstname as assignorfirstname, assignor.lastname as assignorlastname, t8.name as categoryname, t3.id as tpl_act_id, t2.state as templatestate, t1.comment as comment
        from {$this->prefix}recit_wp_tpl as t2
        left join {$this->prefix}recit_wp_tpl_assign as t1 on t1.templateid = t2.id
        left join {$this->prefix}recit_wp_tpl_act as t3 on t3.templateid = t2.id
        left join {$this->prefix}user as t4 on t1.userid = t4.id
        left join {$this->prefix}user as assignor on t1.assignorid = assignor.id
        left join {$this->prefix}course_modules as t5 on t3.cmid = t5.id
        left join {$this->prefix}course as t7 on t7.id = t5.course
        left join {$this->prefix}course_categories as t8 on t7.category = t8.id
        left join {$this->prefix}course_modules_completion as t6 on t5.id = t6.coursemoduleid and t6.userid = t4.id
        $innerJoinSmt
        where $where order by t3.slot";

        if ($limit > 0){
            $offsetsql = $offset * $limit;
            //$query .= " LIMIT $limit OFFSET $offsetsql";
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

        foreach($workPlanList as $templateId => $item){
            $item->setAssignmentsEndDate();       
            $item->stats = $this->getWorkPlanStats($templateId);
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

    public function setAssignmentCompletionState($userId, $cmId, $tplId = 0){
        try{		
            if($tplId > 0){
                $whereStmt1 = "t1.templateid = $tplId";
                $whereStmt2 = "1";
            }
            else{
                $whereStmt1 = "t1.userid = $userId";
                $whereStmt2 = "find_in_set($cmId, cmids) > 0";
            }

            $query = "select assignmentId, templateid,  
            (case 
                when nbIncompleteAct = 0 then 3 
                when nb_hours_per_week > 0 and now() > enddate and nbIncompleteAct > 0 then 2 
                else 0 end) as completionstate, 
            nbIncompleteAct, startdate, enddate, cmids 
            FROM
            (select t1.id as assignmentId, t1.templateid, from_unixtime(min(t1.startdate)) as startdate, 
            date_add(from_unixtime(min(t1.startdate)), interval greatest(1, sum(t2.nb_hours_completion) / min(t1.nb_hours_per_week)) week) as enddate, 
            sum(if(coalesce(t3.completionstate,0) = 0, 1, 0)) as nbIncompleteAct,
            group_concat(DISTINCT t2.cmid) as cmids, t1.nb_hours_per_week
            from mdl_recit_wp_tpl_assign as t1 
            inner join mdl_recit_wp_tpl_act as t2 on t1.templateid = t2.templateid 
            left join mdl_course_modules_completion as t3 on t2.cmid = t3.coursemoduleid and t1.userid = t3.userid
            where $whereStmt1
            group by t1.userid, t1.id) as tab
            where $whereStmt2";
           
            $rst = $this->mysqlConn->execSQLAndGetObjects($query);

            if(!empty($rst)){
                foreach($rst as $obj){
                    $query = $this->mysqlConn->prepareStmt("update", "{$this->prefix}recit_wp_tpl_assign", array('completionstate'), array($obj->completionstate), array("id"), array($obj->assignmentId));
                    $this->mysqlConn->execSQL($query);
                }
            }

            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function addCalendarEvent($templateId, $userId){
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

    public function deleteCalendarEvent($assignmentId = 0, $userId = 0){
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

        $DB->execute("DELETE FROM {event} WHERE instance IN (SELECT id FROM {recit_wp_tpl_assign} WHERE templateid = ?) AND userid IN (SELECT userid FROM {recit_wp_tpl_assign} WHERE templateid = ?)", [$tplId, $tplId]);

        foreach($assignments as $assignment){
            $this->addCalendarEvent($assignment->templateid, $assignment->userid);
        }
    }

    public function processWorkPlan($tplId){
        $this->recalculateCalendarEvents($tplId);
        $this->setAssignmentCompletionState(0, 0, $tplId);
    }
}

class Template{
    public $id = 0;
    public $name = "";
    public $description = "";
    public $communication_url = "";
    public $creatorId = 0;
    public $state = 0;
    public $lastUpdate = null;
    //@array of TemplateActivity
    public $activities = array();

    public $followUps = array();
 
    public static function create($dbData){
        global $DB, $OUTPUT;
        $result = new Template();
        $result->id = $dbData->templateid;
        $result->name = $dbData->templatename;
        $result->description = $dbData->templatedesc; 
        $result->communication_url = $dbData->communication_url;
        $result->lastUpdate = $dbData->lastupdate;
        $result->state = $dbData->templatestate;
        
        if((isset($dbData->creatorid)) && ($dbData->creatorid != 0)){
            $creator = $DB->get_record('user', array('id' => $dbData->creatorid));
            $result->creator = new stdClass();
            $result->creator->id = $dbData->creatorid;
            $result->creator->firstName = $creator->firstname;
            $result->creator->lastName = $creator->lastname;
            $result->creator->url = (new \moodle_url('/user/profile.php', array('id' => $creator->id)))->out();
            $result->creator->avatar = $OUTPUT->user_picture($creator, array('size'=> 50));
        }

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
            $user = new stdClass();
            $user->id = $dbData->userid;
            $user->firstname = $dbData->firstname;
            $user->lastname = $dbData->lastname;
            $user->picture = $dbData->picture;
            $user->imagealt = $dbData->imagealt;
            $user->email = $dbData->email;
            
            $result->user = new stdClass();
            $result->user->id = $dbData->userid;
            $result->user->firstName = $dbData->firstname;
            $result->user->lastName = $dbData->lastname;
            $result->user->groupList = (isset($dbData->grouplist) ? $dbData->grouplist : ''); 
            $result->user->lastAccess = (isset($dbData->lastaccess) ? $dbData->lastaccess : ''); 
            $result->user->avatar = $OUTPUT->user_picture($user, array('size'=> 50));
            // $result->user->url = (new \moodle_url('/user/profile.php', array('id' => $result->user->id)))->out();
            $result->user->activities = array();
        }
        
        if((isset($dbData->assignorid)) && ($dbData->assignorid != 0)){
            $user = new stdClass();
            $user->id = $dbData->assignorid;
            $user->firstname = $dbData->assignorfirstname;
            $user->lastname = $dbData->assignorlastname;
            $user->picture = $dbData->assignorpicture;
            $user->imagealt = $dbData->assignorimagealt;
            $user->email = $dbData->assignoremail;
            $result->assignor = new stdClass();
            $result->assignor->id = $dbData->assignorid;
            $result->assignor->firstName = $user->firstname;
            $result->assignor->lastName = $user->lastname;
            $result->assignor->url = (new \moodle_url('/user/profile.php', array('id' => $user->id)))->out();
            $result->assignor->avatar = $OUTPUT->user_picture($user, array('size'=> 50));
        }


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
         * Available states: 0 = not completed if there's no row in this table, that also counts as 0 = not completed, 1 = completed (passed or failed), 2 = completed (passed graded), 3 = completed (failed graded)
         */
        $item = new stdClass();
        $item->completionState = (isset($dbData->activitycompletionstate) ? $dbData->activitycompletionstate : 0);
        $item->followup = (isset($dbData->followup) ? $dbData->followup : 0);
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