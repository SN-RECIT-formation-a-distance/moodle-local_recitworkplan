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

namespace recitplanformation;

require_once "$CFG->dirroot/local/recitcommon/php/PersistCtrl.php";
require_once "$CFG->dirroot/local/recitcommon/php/Utils.php";
require_once "$CFG->dirroot/user/externallib.php";

use recitcommon;
use recitcommon\Utils;
use stdClass;
use DateTime;
use Exception;

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
    
    public function getCoursesFromTeacher($userId){
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
    }
}

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
}