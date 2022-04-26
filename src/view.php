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

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

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
        $workplanId = 0;
        if (isset($_GET['id'])){
            $workplanId = $_GET['id'];
        }
        echo sprintf("<div id='recit_workplan' data-user-id='%ld' data-mode='%s' data-workplanid='%s'></div>", $studentId, $mode, $workplanId);
    }

    public function isTeacher(){
        global $DB;
        return $DB->record_exists_sql('select id from {role_assignments} where userid=:userid and roleid in (select roleid from {role_capabilities} where capability=:name1 or capability=:name2)', ['userid' => $this->user->id, 'name1' => RECITWORKPLAN_ASSIGN_CAPABILITY, 'name2' => RECITWORKPLAN_MANAGE_CAPABILITY]);
    }
}

require_login();

// Globals.
$PAGE->set_url("/local/recitworkplan/view.php"); 
$PAGE->requires->css(new moodle_url($CFG->wwwroot . '/local/recitworkplan/react_app/index.css?v='.mt_rand()), true);
$PAGE->requires->js(new moodle_url($CFG->wwwroot . '/local/recitworkplan/react_app/index.js?v='.mt_rand(0,1000)), true);

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