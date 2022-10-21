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
    
    $newversion = 2022020909;
    if ($oldversion < $newversion) {
        $table = new xmldb_table('recit_wp_tpl');
        $field = new xmldb_field('options', XMLDB_TYPE_TEXT, null, null, null, false, null);
        $dbman->add_field($table, $field);


        upgrade_plugin_savepoint(true, $newversion, 'local', 'recitworkplan');
    }
    
    $newversion = 2022020911;
    if ($oldversion < $newversion) {
        // Define table recit_wp_additional_hours to be created.
        $table = new xmldb_table('recit_wp_additional_hours');

        // Adding fields to table recit_wp_additional_hours.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('assignmentid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('nb_additional_hours', XMLDB_TYPE_FLOAT, null, null, null, null, '0');
        $table->add_field('assignorid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('comment', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
        $table->add_field('lastupdate', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table recit_wp_additional_hours.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fkassignid', XMLDB_KEY_FOREIGN, ['assignmentid'], 'recit_wp_tpl_assign', ['id']);
        $table->add_key('fkuserid', XMLDB_KEY_FOREIGN, ['assignorid'], 'user', ['id']);

        // Conditionally launch create table for recit_wp_additional_hours.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }


        upgrade_plugin_savepoint(true, $newversion, 'local', 'recitworkplan');
    }

    return true;
}
