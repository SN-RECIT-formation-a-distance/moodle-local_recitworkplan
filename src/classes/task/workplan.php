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
 * @package   local_recitworkplan
 * @copyright 2019 RÉCIT 
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_recitworkplan\task;
require_once dirname(__FILE__).'/../PersistCtrl.php';

/**
 * An example of a scheduled task.
 */
class workplan extends \core\task\scheduled_task {

    /**
     * Return the task's name as shown in admin screens.
     *
     * @return string
     */
    public function get_name() {
        return get_string('pluginname', 'local_recitworkplan');
    }

    /**
     * Execute the task.
     */
    public function execute() {
        global $DB, $USER;
        $ctrl = \recitworkplan\PersistCtrl::getInstance($DB, $USER);
        $assignments = $DB->get_records_sql('SELECT DISTINCT templateid FROM {recit_wp_tpl_assign} WHERE completionstate = 0');
        foreach($assignments as $a){
            $ctrl->processWorkPlan($a->templateid);
        }
    }
}