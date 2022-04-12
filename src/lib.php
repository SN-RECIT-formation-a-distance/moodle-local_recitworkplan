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

defined('MOODLE_INTERNAL') || die();

if (isset($CFG)){
    require_once(dirname(__FILE__)."/classes/PersistCtrl.php"); //Must be loaded here because $CFG is undefined when called via db/events.php
}

define('RECITWORKPLAN_ASSIGN_CAPABILITY', 'local/recitworkplan:assignworkplans');
define('RECITWORKPLAN_FOLLOW_CAPABILITY', 'local/recitworkplan:followworkplans');
define('RECITWORKPLAN_MANAGE_CAPABILITY', 'local/recitworkplan:manageworkplans');

function recitworkplan_course_module_completion_updated_event(\core\event\course_module_completion_updated $event){
    global $USER, $DB;

    //$eventdata = $event->get_record_snapshot('course_modules_completion', $event->objectid);

    \recitworkplan\PersistCtrl::getInstance($DB, $USER)->setAssignmentCompletionState($event->relateduserid, $event->contextinstanceid);
}