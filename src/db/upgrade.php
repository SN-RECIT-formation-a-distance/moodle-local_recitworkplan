<?php


defined('MOODLE_INTERNAL') || die;

function xmldb_local_recitworkplan_upgrade($oldversion) {
    global $CFG, $DB;
    $dbman = $DB->get_manager();

    $newversion = 2022020908;
    if ($oldversion < $newversion) {
        $table = new xmldb_table('recit_wp_tpl');
        $field = new xmldb_field('collaboratorid', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, false, null);
        $dbman->change_field_type($table, $field);
        $dbman->rename_field($table, $field, 'collaboratorids');


        upgrade_plugin_savepoint(true, $newversion, 'local', 'recitworkplan');
    }

    return true;
}
