<?php
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