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

$string['pluginname'] = 'RÉCIT Work Plan';
$string['privacy:metadata'] = 'This plugin does store personal data.';
$string['recitworkplan:assignworkplans'] = 'Whether or not the user can create or manage work plans in their courses';
$string['recitworkplan:manageworkplans'] = 'Whether or not the user can create or manage all work plans in their categories and courses';
$string['recitworkplan:followworkplans'] = 'Whether or not the user can follow work plans';

$string['privacy:metadata:recit_wp_tpl:creatorid'] = 'Creator ID';
$string['privacy:metadata:recit_wp_tpl:collaboratorids'] = 'List comma separated collaborator IDs';
$string['privacy:metadata:recit_wp_tpl:name'] = 'Template name';
$string['privacy:metadata:recit_wp_tpl:description'] = 'Template description';
$string['privacy:metadata:recit_wp_tpl:communication_url'] = 'Template communication URL';
$string['privacy:metadata:recit_wp_tpl:options'] = 'Template options in JSON';
$string['privacy:metadata:recit_wp_tpl:state'] = 'State';
$string['privacy:metadata:recit_wp_tpl:lastupdate'] = 'Template last update timestamp';
$string['privacy:metadata:recit_wp_tpl'] = 'This table stores templates';

$string['privacy:metadata:recit_wp_tpl_assign:templateid'] = 'Template ID';
$string['privacy:metadata:recit_wp_tpl_assign:userid'] = 'The user ID who was assigned';
$string['privacy:metadata:recit_wp_tpl_assign:nb_hours_per_week'] = 'Number of hours per week';
$string['privacy:metadata:recit_wp_tpl_assign:startdate'] = 'Assignment start date';
$string['privacy:metadata:recit_wp_tpl_assign:completionstate'] = 'Completion state';
$string['privacy:metadata:recit_wp_tpl_assign:assignorid'] = 'The user who created the assignment';
$string['privacy:metadata:recit_wp_tpl_assign:comment'] = 'Assignment comment';
$string['privacy:metadata:recit_wp_tpl_assign:lastupdate'] = 'Last update timestamp';
$string['privacy:metadata:recit_wp_tpl_assign'] = 'This table stores assignments by student';

$string['privacy:metadata:recit_wp_additional_hours:nb_additional_hours'] = 'Number of hours added';
$string['privacy:metadata:recit_wp_additional_hours'] = 'This table stores additional hours added by teacher';

$string['cloned'] = 'Cloned';
$string['servicenotfound'] = 'Service WebApi not found.';
$string['invalidsesskey'] = 'Your connection has expired. Please reconnect.';