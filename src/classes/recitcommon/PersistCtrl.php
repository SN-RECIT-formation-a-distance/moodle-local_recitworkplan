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

namespace recitworkplan;

require_once __DIR__ . '/MySQLiConn.php';

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

        $this->mysqlConn = new RecitMySQLConn($mysqlConn);
        $this->signedUser = $signedUser;
        $this->prefix = $CFG->prefix;
    }

	public function checkSession(){
        return (isset($this->signedUser) && $this->signedUser->id > 0);
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
}
