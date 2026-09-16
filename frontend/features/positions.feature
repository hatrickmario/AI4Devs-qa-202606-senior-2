# Scope note: "positions page" refers to the position detail screen
# (route /positions/:id), which renders a single job position as a
# hiring pipeline board: one column per phase of that position's
# interview process, with candidate cards placed under their current phase.
#
# Each position defines its own interview process independently, so the
# number, names and order of phases (columns) are NOT fixed across the
# application — they must be validated against whatever process is
# configured for the specific position under test, not against a
# hardcoded list of phase names.

Feature: Position detail page - hiring pipeline board
  As a recruiter
  I want to open a job position and see its hiring pipeline board
  So that I can see, at a glance, which phase every candidate is currently in

  Background:
    Given a published job position exists with a configured interview process
    And that position has candidates assigned to different phases of its process

  @positions @happy-path @smoke
  Scenario: The position detail page loads successfully
    When I open the detail page for that position
    Then the page loads without errors
    And the position title is displayed
    And a column is displayed for every phase of that position's interview process
    And every candidate assigned to that position is displayed as a card

  @positions @title
  Scenario: The position title is displayed correctly
    When I open the detail page for that position
    Then the title shown on the page matches the title of that position

  @positions @phases
  Scenario: The phase columns match the position's configured interview process
    When I open the detail page for that position
    Then the number of columns displayed equals the number of phases configured for that position
    And the columns are displayed in the same order as the phases configured for that position
    And each column's name matches the name of its corresponding configured phase
    And no column is displayed for a phase that does not belong to that position's interview process

  @positions @candidates
  Scenario: Candidate cards are displayed in the column matching their current phase
    When I open the detail page for that position
    Then each candidate card is displayed under the column corresponding to that candidate's current phase
    And no candidate card is displayed under a column that does not match their current phase
    And a column with no candidates currently in that phase is displayed empty
