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
 * @package   local_recitworkplan
 * @copyright RÉCIT 2019
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace recitworkplan;

require(__DIR__ . '/../../config.php');

defined('MOODLE_INTERNAL') || die();

use moodle_url;

class MainView{
    public $cfg = null;
    public $user = null;
    public $page = null;
    public $output = null;
    public $selectedCourseId = 0;

    public function __construct($cfg, $page, $user, $output, $selectedCourseId){
        $this->cfg = $cfg;
        $this->user = $user;
        $this->page = $page;
        $this->output = $output;
        $this->selectedCourseId = $selectedCourseId;
    }

    public function display(){    
        $studentId = $this->user->id;
        $mode = $this->isTeacher() ? 'a' : 's';
        echo sprintf("<div id='recit_workplan' data-user-id='%ld' data-mode='%s'></div>", $studentId, $mode);
    }

    public function isTeacher(){
        global $DB;
        return $DB->record_exists_sql('select id from {role_assignments} where userid=:userid and roleid in (select id from {role} where shortname=:name1 or shortname=:name2 or shortname=:name3 or shortname=:name4)', ['userid' => $this->user->id, 'name1' => 'editingteacher', 'name2' => 'teacher', 'name3' => 'coursecreator', 'name4' => 'manager']);
    }
}

require_login();

// Globals.
$PAGE->set_url("/local/recitworkplan/view.php"); 
$PAGE->requires->css(new moodle_url($CFG->wwwroot . '/local/recitworkplan/react_app/index.css?v='.mt_rand()), true);
if(isset($_COOKIE['lastid'])){
    $_COOKIE['lastid']++;
    setcookie('lastid',  $_COOKIE['lastid'],  time() + (86400 * 30));  
}
else{
    setcookie('lastid', 100,  time() + (86400 * 30));
}
$PAGE->requires->js(new moodle_url($CFG->wwwroot . '/local/recitworkplan/react_app/index.js?aaa='.$_COOKIE['lastid']), true);

// Set page context.
$PAGE->set_context(\context_system::instance());

// Set page layout.
$PAGE->set_pagelayout('standard');

$PAGE->set_title(get_string('pluginname', 'local_recitworkplan'));
$PAGE->set_heading(get_string('pluginname', 'local_recitworkplan'));

echo $OUTPUT->header();
$courseId = (isset($_GET['courseId']) ? $_GET['courseId'] : 0);
$recitDashboard = new MainView($CFG, $PAGE, $USER, $OUTPUT, $courseId);
$recitDashboard->display();

echo $OUTPUT->footer();