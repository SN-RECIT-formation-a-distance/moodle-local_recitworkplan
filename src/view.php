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
 * @package   local_recitplanformation
 * @copyright RÉCIT 2019
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace recitplanformation;

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
        $selectedCourseId = ($this->selectedCourseId > 1 ? $this->selectedCourseId : 0);
        echo sprintf("<div id='recit_planformation' data-user-id='%ld' data-course-id='%ld'></div>", $studentId, $selectedCourseId);
    }
}

require_login();

// Globals.
$PAGE->set_url("/local/recitplanformation/view.php");
$PAGE->requires->css(new moodle_url($CFG->wwwroot . '/local/recitplanformation/react_app/index.css'), true);
$PAGE->requires->js(new moodle_url($CFG->wwwroot . '/local/recitplanformation/react_app/index.js?v=76'), true);

// Set page context.
$PAGE->set_context(\context_system::instance());

// Set page layout.
$PAGE->set_pagelayout('base');

$PAGE->set_title(get_string('pluginname', 'local_recitplanformation'));
$PAGE->set_heading(get_string('pluginname', 'local_recitplanformation'));

echo $OUTPUT->header();
$courseId = (isset($_GET['courseId']) ? $_GET['courseId'] : 0);
$recitDashboard = new MainView($CFG, $PAGE, $USER, $OUTPUT, $courseId);
$recitDashboard->display();

echo $OUTPUT->footer();