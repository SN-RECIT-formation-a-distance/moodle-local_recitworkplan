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

$string['privacy:metadata'] = 'Ce plugin conserve des données personelles.';
$string['pluginname'] = 'RÉCIT Plan de travail';
$string['recitworkplan:assignworkplans'] = "L'utilisateur peut créer ou modifier ses plans";
$string['recitworkplan:manageworkplans'] = "L'utilisateur peut créer ou modifier tous les plans de cette catégorie de cours";
$string['recitworkplan:followworkplans'] = "L'utilisateur peut suivre un plan de travail";

$string['privacy:metadata:recit_wp_tpl:creatorid'] = 'ID du créateur du gabarit';
$string['privacy:metadata:recit_wp_tpl:collaboratorids'] = 'Liste de collaborateur séparé en virgule';
$string['privacy:metadata:recit_wp_tpl:name'] = 'Nom du gabarit';
$string['privacy:metadata:recit_wp_tpl:description'] = 'Description du gabarit';
$string['privacy:metadata:recit_wp_tpl:communication_url'] = 'URL de communication';
$string['privacy:metadata:recit_wp_tpl:options'] = 'Options du gabarit en JSON';
$string['privacy:metadata:recit_wp_tpl:state'] = 'Status du gabarit';
$string['privacy:metadata:recit_wp_tpl:lastupdate'] = 'Dérniere mise à jour';
$string['privacy:metadata:recit_wp_tpl'] = 'Cette table stocke les gabarits';

$string['privacy:metadata:recit_wp_tpl_assign:templateid'] = 'ID du gabarit';
$string['privacy:metadata:recit_wp_tpl_assign:userid'] = 'ID de l\'élève';
$string['privacy:metadata:recit_wp_tpl_assign:nb_hours_per_week'] = 'Nombre d\'heures par semaine';
$string['privacy:metadata:recit_wp_tpl_assign:startdate'] = 'Date de départ du plan';
$string['privacy:metadata:recit_wp_tpl_assign:completionstate'] = 'Status du plan';
$string['privacy:metadata:recit_wp_tpl_assign:assignorid'] = 'Personne qui a créé ce plan';
$string['privacy:metadata:recit_wp_tpl_assign:comment'] = 'Commentaire';
$string['privacy:metadata:recit_wp_tpl_assign:lastupdate'] = 'Dérniere mise à jour';
$string['privacy:metadata:recit_wp_tpl_assign'] = 'Cette table stocke les assignations des élèves aux plans';

$string['privacy:metadata:recit_wp_additional_hours:nb_additional_hours'] = 'Nombre d\'heures ajoutés';
$string['privacy:metadata:recit_wp_additional_hours'] = 'Cette table stocke les heures supplémentaires';