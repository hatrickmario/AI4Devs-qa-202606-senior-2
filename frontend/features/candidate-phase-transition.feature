# Scope note: this complements positions.feature, which covers the initial
# load of the position detail board (/positions/:id). This file covers the
# board's core interaction: moving a candidate's card from one phase column
# to another via drag and drop, and the resulting change to that candidate's
# phase.
#
# As in positions.feature, the exact phases available are whatever that
# specific position's interview process defines - scenarios must not assume
# fixed phase names. The destination is always "the next phase in that
# process" (advancing the candidate forward), which is both the realistic
# recruiter action and a deterministic, unambiguous target for automation.

Feature: Candidate phase transition on the position board
  As a recruiter
  I want to drag a candidate's card from their current phase column to the next one
  So that I can advance that candidate through the hiring process directly from the board

  Background:
    Given a published job position exists with a configured interview process that has at least two phases
    And that position has a candidate currently placed in a phase that is not the last one in that process
    And I have opened the detail page for that position

  @candidates @drag-and-drop @happy-path @smoke
  Scenario: Moving a candidate to the next phase updates the board end-to-end
    When I drag that candidate's card from their current phase column and drop it onto the column for the next phase
    Then the candidate's card is displayed under the column for the next phase
    And the candidate's phase is saved as the next phase

  @candidates @drag-and-drop
  Scenario: A candidate's card can be dragged from one phase column to another
    When I drag that candidate's card from their current phase column and drop it onto the column for the next phase
    Then the drag-and-drop action completes without error
    And the candidate's card is no longer displayed under their previous phase column

  @candidates @drag-and-drop @ui
  Scenario: The candidate's card visually appears in the destination phase column after the move
    When I drag that candidate's card from their current phase column and drop it onto the column for the next phase
    Then the candidate's card is displayed under the column for the next phase
    And the candidate's card is displayed in that column together with any other candidates already there

  @candidates @drag-and-drop @persistence @backend
  Scenario: The candidate's phase is updated correctly and the change is saved
    When I drag that candidate's card from their current phase column and drop it onto the column for the next phase
    Then the system requests the backend to update that specific candidate's phase
    And the update request identifies the candidate that was moved
    And the update request specifies the next phase as the candidate's new phase
    And the backend confirms the update completed successfully
    And the candidate's phase remains the next phase after the position detail page is reloaded
