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
 * Unit tests.
 *
 * @package local_recitdashboard
 * @category test
 * @copyright 2019 RECIT
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(dirname(__FILE__) . '/../classes/PersistCtrl.php'); // Include the code to test.

/**
 * Test case for dashboard
 *
 */
class local_recitworkplan_ctrl_testcase extends advanced_testcase {

    protected function setUp(): void {
        global $DB;
        $this->resetAfterTest(true);

        // Create a test course.
        $this->course = $this->getDataGenerator()->create_course(array('enablecompletion' => 1));
        $this->context = context_course::instance($this->course->id);
        $this->section1 = $this->getDataGenerator()->create_course_section(array('course' => $this->course->id, 'section' => 1));
        $DB->set_field('course_sections', 'name', 'Section 0', array('id' => $this->section1->id));

        // Create a course.
        $user = $this->getDataGenerator()->create_and_enrol($this->course, 'student');
        $this->user = $user;
        $course = $this->course;
        $this->group = $this->getDataGenerator()->create_group(array('courseid' => $course->id));
        groups_add_member($this->group->id, $user->id);
        $editingteacher = $this->getDataGenerator()->create_and_enrol($this->course, 'editingteacher');
        $this->setUser($editingteacher);

        // Create quiz.
        $quizgenerator = $this->getDataGenerator()->get_plugin_generator('mod_quiz');

        $quiz1 = $quizgenerator->create_instance(array('course' => $course->id, 'questionsperpage' => 0,
            'grade' => 100.0, 'sumgrades' => 2, 'preferredbehaviour' => 'immediatefeedback'));
        $this->quiz = $quiz1;
        $quiz2 = $quizgenerator->create_instance(array('course' => $course->id, 'questionsperpage' => 0,
            'grade' => 100.0, 'sumgrades' => 2, 'preferredbehaviour' => 'immediatefeedback'));

        $quizobj1 = quiz::create($quiz1->id, $user->id);
        $quizobj2 = quiz::create($quiz2->id, $user->id);

        $quba1 = question_engine::make_questions_usage_by_activity('mod_quiz', $quizobj1->get_context());
        $quba1->set_preferred_behaviour($quizobj1->get_quiz()->preferredbehaviour);

        $quba2 = question_engine::make_questions_usage_by_activity('mod_quiz', $quizobj2->get_context());
        $quba2->set_preferred_behaviour($quizobj2->get_quiz()->preferredbehaviour);

        // Create questions and add them to both quizzes.
        $questiongenerator = $this->getDataGenerator()->get_plugin_generator('core_question');
        $cat = $questiongenerator->create_question_category();

        $question1 = $questiongenerator->create_question('truefalse', null, ['category' => $cat->id]);
        quiz_add_quiz_question($question1->id, $quiz1, 1, 2.5);
        quiz_add_quiz_question($question1->id, $quiz2, 1, 2.5);

        $question2 = $questiongenerator->create_question('truefalse', null, ['category' => $cat->id]);
        quiz_add_quiz_question($question2->id, $quiz1, 1, 1.5);
        quiz_add_quiz_question($question2->id, $quiz2, 1, 1.5);

        $question3 = $questiongenerator->create_question('truefalse', null, ['category' => $cat->id]);
        quiz_add_quiz_question($question3->id, $quiz1, 2, 1);
        quiz_add_quiz_question($question3->id, $quiz2, 2, 1);

        // Submit answers to create attempt for user.
        $attemptobj = $this->submitanswers($quizobj1, $quba1, $user, array(0, 0, 1));

        $this->ctrl = recitworkplan\PersistCtrl::getInstance($DB, $editingteacher);
        $this->teacherid = $editingteacher->id;
        $this->studentid = $user->id;
    }

    public function test_saveTemplate() {
        $ret = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 1, 'options' => []));

        $this->assertTrue(is_object($ret));
    }

    public function test_cloneTemplate() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 1, 'options' => []));
        $tpl = $this->ctrl->cloneTemplate($tpl->id);

        $this->assertTrue(is_numeric($tpl));
    }

    public function test_getTemplateList() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 1, 'options' => []));
        $tpllist = $this->ctrl->getTemplateList($this->teacherid);

        $this->assertTrue($tpllist->items[0]->template->id == $tpl->id);
    }

    public function test_getTemplate() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 1, 'options' => []));
        $tpllist = $this->ctrl->getTemplate($this->teacherid, $tpl->id);

        $this->assertTrue($tpllist->id == $tpl->id);
    }

    public function test_getPlanList() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 0, 'options' => []));
        $this->ctrl->saveTplAct((object)array('id' => 0, 'templateId' => $tpl->id, 'slot' => 1, 'cmId' => $this->quiz->cmid, 'nbHoursCompletion' => 1));
        $this->ctrl->saveAssignment((object)array('id' => 0, 'templateId' => $tpl->id, 'user' => $this->user, 'nbHoursPerWeek' => 1, 'startDate' => new DateTime(), 'comment' => 'test'));
        $tpllist = $this->ctrl->getWorkPlanList($this->teacherid);

        $this->assertTrue($tpllist->items[0]->template->id == $tpl->id);
    }

    public function test_getPlan() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 0, 'options' => []));
        $this->ctrl->saveTplAct((object)array('id' => 0, 'templateId' => $tpl->id, 'slot' => 1, 'cmId' => $this->quiz->cmid, 'nbHoursCompletion' => 1));
        $this->ctrl->saveAssignment((object)array('id' => 0, 'templateId' => $tpl->id, 'user' => $this->user, 'nbHoursPerWeek' => 1, 'startDate' => new DateTime(), 'comment' => 'test'));
        $tpllist = $this->ctrl->getWorkPlan($this->teacherid, $tpl->id);

        $this->assertTrue($tpllist->template->id == $tpl->id);
    }

    public function test_processWorkPlan() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 0, 'options' => []));
        $this->ctrl->saveTplAct((object)array('id' => 0, 'templateId' => $tpl->id, 'slot' => 1, 'cmId' => $this->quiz->cmid, 'nbHoursCompletion' => 1));
        $this->ctrl->saveAssignment((object)array('id' => 0, 'templateId' => $tpl->id, 'user' => $this->user, 'nbHoursPerWeek' => 1, 'startDate' => new DateTime(), 'comment' => 'test'));
        $this->ctrl->processWorkPlan($tpl->id);
        $tpllist = $this->ctrl->getWorkPlan($this->teacherid, $tpl->id);

        $this->assertTrue($tpllist->template->id == $tpl->id);
    }

    public function test_deleteWorkPlan() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 0, 'options' => []));
        $this->ctrl->saveTplAct((object)array('id' => 0, 'templateId' => $tpl->id, 'slot' => 1, 'cmId' => $this->quiz->cmid, 'nbHoursCompletion' => 1));
        $this->ctrl->saveAssignment((object)array('id' => 0, 'templateId' => $tpl->id, 'user' => $this->user, 'nbHoursPerWeek' => 1, 'startDate' => new DateTime(), 'comment' => 'test'));
        $this->ctrl->deleteWorkPlan($tpl->id);
        $tpllist = $this->ctrl->getWorkPlan($this->teacherid, $tpl->id);
        $this->assertTrue(!isset($tpllist->template->id));
    }

    public function test_getAssignmentAdditionalHours() {
        $tpl = $this->ctrl->saveTemplate((object)array('id' => 0, 'name' => 'test', 'description' => 'test', 'communicationUrl' => 'google.ca', 'state' => 0, 'options' => []));
        $this->ctrl->saveTplAct((object)array('id' => 0, 'templateId' => $tpl->id, 'slot' => 1, 'cmId' => $this->quiz->cmid, 'nbHoursCompletion' => 1));
        $a = $this->ctrl->saveAssignment((object)array('id' => 0, 'templateId' => $tpl->id, 'user' => $this->user, 'nbHoursPerWeek' => 1, 'startDate' => new DateTime(), 'comment' => 'test'));
        $hours = $this->ctrl->getAssignmentAdditionalHours($a);
        $this->assertTrue(empty($hours));
    }

    /**
     * Create an attempt by submitting answers for a user.
     *
     * @param quiz $quizobj The quiz object for this attempt.
     * @param question_usage_by_activity $quba1 The question usage object for this attempt.
     * @param stdClass $user The user record object who submitted this attempt.
     * @param array $answers The answers submitted by the user.
     *
     * @return quiz_attempt The attempt object created.
     */
    private function submitanswers($quizobj, $quba1, $user, $answers) {
        $timenow = time();
        $attempt = quiz_create_attempt($quizobj, 1, false, $timenow, false, $user->id);
        quiz_start_new_attempt($quizobj, $quba1, $attempt, 1, $timenow);
        quiz_attempt_save_started($quizobj, $quba1, $attempt);

        // Process some responses from the student 1.
        $attemptobj = quiz_attempt::create($attempt->id);
        $tosubmit = array();
        foreach ($answers as $ianswer => $answer) {
            if (is_numeric($answer)) {
                $tosubmit[$ianswer + 1] = array('answer' => $answer);
            } else {
                $tosubmit[$ianswer + 1] = array('answer' => $answer, 'answerformat' => FORMAT_PLAIN);
            }
        }
        $attemptobj->process_submitted_actions($timenow, false, $tosubmit);
        $attemptobj->process_finish($timenow, false);
        return $attemptobj;
    }
}
