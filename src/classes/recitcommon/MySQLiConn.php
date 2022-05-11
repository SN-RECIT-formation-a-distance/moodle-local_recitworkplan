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
 * MySQL Connection. It is a communication interface between a client and the MySQL database.
 *
 * @copyright  2019 RECIT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace recitworkplan;

class RecitMySQLConn
{
	protected $moodleDB;
	protected $mysqli;
	
	public function __construct(\mysqli_native_moodle_database $DB){
		$this->moodleDB = $DB;
		$this->refMoodleDB = new \ReflectionObject($this->moodleDB);
		$refProp1 = $this->refMoodleDB->getProperty('mysqli');
		$refProp1->setAccessible(TRUE);
		$this->mysqli = $refProp1->getValue($this->moodleDB);
	}

	public function getMySQLi(){
		return $this->mysqli;
	}
	
	public function execSQL($query){
		try{
			$result = $this->mysqli->query($query);
			
			if($result === FALSE){
				$msg  = $this->getLastError();
				$msg .= '<b>Query:</b>' . $query . '<br/><br/>';
				throw new \Exception($msg);
			}
			
			return $result;
		}
		catch(\Exception $e){
			throw $e;
		}
	}

	public function getLastInsertId($table, $pk){
		$query = "SELECT $pk as lastId from $table order by lastId desc limit 1";
		$obj = $this->execSQLAndGetObject($query);
		return $obj->lastId;
	}

	public function beginTransaction(){
		$this->mysqli->autocommit(false);
		//$this->begin_transaction();
	}

	public function commitTransaction(){
		$result = $this->mysqli->commit();
		$this->mysqli->autocommit(true);
		return $result;
	}

	public function rollbackTransaction(){
		$this->mysqli->rollback();
		$this->mysqli->autocommit(true);
	}

	public function getLastError(){
		return sprintf("MySQL Error: %s", $this->mysqli->error);
	}

	public function execSQLAndGetObject($query, $class = 'stdClass'){
		$rst = $this->execSQL($query);
		return $this->getObject($rst, $class);
	}
	
	public function execSQLAndGetObjects($query, $class = 'stdClass'){
		$rst = $this->execSQL($query);
		return $this->getObjects($rst, $class);
	}

	public function getObjects(\mysqli_result $rst, $class = 'stdClass', $index1 = null, $index2 = null){
		$result = array();
		$fields = $rst->fetch_fields();
		while($obj = $rst->fetch_object($class)){
			foreach($fields as $field) {
				foreach($obj as $name => $value){
					if($field->name == $name){
						$obj->$name = $this->convertMySQLToPHPDataTypes($field->type, $value);
						break;
					}
				}
			}
			
			if($index1 == NULL){
				$result[] = $obj;
			}
			else if($index2 == null){
				$result[$obj->$index1][] = $obj;
			}
			else{
				$result[$obj->$index1][$obj->$index2][] = $obj;
			}
		}
		
		$rst->free_result();
		
		return $result;
	}

	public function getObject(\mysqli_result $rst, $class = 'stdClass'){
		$result = $this->getObjects($rst, $class);

		if(count($result) > 0){
			return $result[0];
		}
		else{
			return null;
		}
	}

	protected function convertMySQLToPHPDataTypes($type, $value){
		$result = null;
		switch($type){
			case 1:
			case 2:
			case 3:
			case 8:
			case 9:
				$result = intval($value);
				break;
			case 4:
			case 5:
		case 246:
				$result = floatval($value);
				break;
			case 7:
			case 10:
				$result = ($value == null ? null : new \DateTime($value, new \DateTimeZone(date_default_timezone_get())));
				break;
			case 12:
				$result = ($value == null ? null : \DateTime::createFromFormat('Y-m-d H:i:s', $value, new \DateTimeZone(date_default_timezone_get())));
				break;
			default:
				$result = $value;
				break;
		}
		return $result;
	}

	public function prepareStmt($type, $table, array $fields, array $values, array $keyFields = null, array $keyValues = null){
		$result = "";

		$values = $this->prepareValue($values);
		$keyValues = $this->prepareValue($keyValues);

		switch($type){
			case "insert": 
				$result = "insert into %s (%s) values (%s)"; 
				$result = sprintf($result, $table, implode(", ", $fields), implode(", ", $values));
				break;
			case "update": 
				$tmp1 = array();
				$tmp2 = array();
				
				foreach($fields as $index => $field){
					$tmp1[] = $field . "=" . $values[$index];
				}

				if($keyFields == null){
					throw new \Exception("KeyValues is null");
				}
				
				foreach($keyFields as $index => $field){
					$tmp2[] = $field . "=" . $keyValues[$index];
				}
				$result = "update %s set %s where %s"; 
				$result = sprintf($result, $table, implode(", ", $tmp1), implode(", ", $tmp2));
				break;
			case 'insertorupdate':
				$result = "insert into %s (%s) values (%s) ON DUPLICATE KEY UPDATE %s"; 
			
				$tmp1 = array();

				foreach($fields as $index => $field){
					$tmp1[] = $field . "=" . $values[$index];
				}

				$result = sprintf($result, $table, implode(", ", $fields), implode(", ", $values), implode(", ", $tmp1));
				break;
		}
	
		return $result;
	}

	public function prepareValue($values){
		if($values == null){
			return null;
		}

		$nbItems = count($values);
		for($i = 0; $i < $nbItems; $i++){
			if(is_numeric($values[$i])){
				$values[$i] = $values[$i];
			}
			else if($values[$i] instanceof \DateTime){
				$values[$i] = "'" . $values[$i]->format("Y-m-d H:i:s") . "'";
			}
			else if(is_null($values[$i])){
				$values[$i] = "null";
			}
			else{
				$values[$i] = "'" . $this->mysqli->real_escape_string($values[$i]) . "'";
			}
		}

		return $values;
	}
}
