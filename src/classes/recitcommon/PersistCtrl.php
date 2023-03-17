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

namespace recitworkplan;

abstract class APersistCtrl
{
   /**
     * mysqli_native_moodle_database 
     */
    protected $mysqlConn;    
    protected $signedUser;
    protected $prefix = "";
   
    protected function __construct($mysqlConn, $signedUser){
        global $CFG;

        $this->mysqlConn = $mysqlConn;
        $this->signedUser = $signedUser;
        $this->prefix = $CFG->prefix;
    }

	public function checkSession(){
        return (isset($this->signedUser) && $this->signedUser->id > 0);
    }

    public function execSQL($sql, $params = array()){
        $result = $this->mysqlConn->execute($sql, $params);
        return $result;
    }

    public function getRecordsSQL($sql, $params = array()){
        $result = $this->mysqlConn->get_records_sql($sql, $params);
        
        foreach($result as $item){
            foreach((array)$item as $k => $v){
                if (strpos($k, '_') != false){
                    $key = preg_replace_callback("/_[a-z]?/", function($matches) {return strtoupper(ltrim($matches[0], "_"));}, $k);
                    $item->$key = $v;
                    unset($item->$k);
                }
            }
        }
        return array_values($result);
    }

    /**
     * Return SQL for performing group concatenation on given field/expression
     *
     * @param string $field
     * @param string $separator
     * @param string $sort
     * @return string
     */
    public function sql_group_concat(string $field, string $separator = ',', string $sort = ''): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            $fieldsort = $sort ? "ORDER BY {$sort}" : '';
            return "STRING_AGG(CAST({$field} AS VARCHAR), '{$separator}' {$fieldsort})";
        }else{
            $fieldsort = $sort ? "ORDER BY {$sort}" : '';
            return "GROUP_CONCAT({$field} {$fieldsort} SEPARATOR '{$separator}')";
        }
    }
    
    public function sql_find_in_set(string $tofind, string $field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "'$tofind' = ANY (string_to_array($field,','))";
        }else{
            return "FIND_IN_SET('$tofind', $field)";
        }
    }
    
    public function sql_uniqueid(): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "gen_random_uuid()";
        }else{
            return "uuid()";
        }
    }
    
    public function sql_from_unixtime($field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "to_char(to_timestamp($field), 'yyyy-mm-dd HH24:MI:SS')";
        }else{
            return "FROM_UNIXTIME($field)";
        }
    }
    
    public function sql_to_time($field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "to_timestamp($field)";
        }else{
            return "FROM_UNIXTIME($field)";
        }
    }
    
    public function sql_time_to_secs($field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "EXTRACT(EPOCH FROM $field)";
        }else{
            return "TIME_TO_SEC($field)";
        }
    }
    
    public function sql_datediff($field, $field2): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "EXTRACT(DAY FROM $field - $field2)";
        }else{
            return "DATEDIFF($field, $field2)";
        }
    }
    
    public function sql_caststring($field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "CAST($field AS TEXT)";
        }else{
            return "$field";
        }
    }
    
    public function sql_castutf8($field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "CAST($field AS TEXT)";
        }else{
            return "CONVERT($field USING utf8)";
        }
    }
    
    public function sql_tojson(): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "jsonb_build_object";
        }else{
            return "JSON_OBJECT";
        }
    }
    
    public function sql_sectotime($field): string {
        global $CFG;
        if ($CFG->dbtype == 'pgsql'){
            return "to_char( ($field ||' seconds')::interval, 'HH24:MM:SS' )";
        }else{
            return "SEC_TO_TIME($field)";
        }
    }
}

abstract class MoodlePersistCtrl extends APersistCtrl{
    public function getCmNameFromCmId($cmId, $courseId, $modData = false){
        if (!$modData) $modData = get_fast_modinfo($courseId);
        
        foreach ($modData->cms as $cm) {
            if ($cmId == $cm->id){
                return $cm->name;
            }
        }
    }

    public function getCmFromCmId($cmId, $courseId, $modData = false){
        if (!$modData) $modData = get_fast_modinfo($courseId);
        
        foreach ($modData->cms as $cm) {
            if ($cmId == $cm->id){
                return $cm;
            }
        }
    }
}
