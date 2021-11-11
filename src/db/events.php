<?php

$observers = array (
    array (
         'eventname'      => 'core\event\course_module_completion_updated',
         'callback'  => 'recitworkplan_course_module_completion_updated_event',
         'includefile' => 'local/recitworkplan/lib.php',
         'internal'    => false,
    )
);