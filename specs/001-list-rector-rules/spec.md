# Feature Specification: List Available Rector Rules

**Feature Branch**: `001-list-rector-rules`  
**Created**: 2025-10-23  
**Status**: Draft  
**Input**: User description: "I want user to list rules availables in rector (php)"

## Clarifications

### Session 2025-10-23

- Q: How should the system obtain Rector rule metadata? → A: Fetch from Rector's online documentation/API at runtime (using https://getrector.com/find-rule or the repository)
- Q: How should the system handle large result sets (hundreds of rules)? → A: Return all results at once (client handles display/scrolling)
- Q: Should the system cache fetched Rector rule data? → A: Cache in-memory for the server session lifetime (refreshed on server restart)
- Q: What should happen when the online Rector data source is unavailable? → A: Return cached data if available, otherwise return error
- Q: What should the system do when a rule has missing or incomplete metadata? → A: Skip/filter out rules with incomplete metadata to ensure data quality

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse All Available Rector Rules (Priority: P1)

A PHP developer wants to discover what refactoring rules Rector offers to improve their codebase. They need to see a complete list of available rules with basic information to understand what each rule does.

**Why this priority**: This is the core functionality - without the ability to list rules, users cannot discover or select rules for their projects. This delivers immediate value by making Rector's capabilities visible.

**Independent Test**: Can be fully tested by requesting a list of all rules and verifying that a comprehensive collection of Rector rules is returned with identifiable names and descriptions.

**Acceptance Scenarios**:

1. **Given** the MCP server is running, **When** a user requests to list all available Rector rules, **Then** the system returns a comprehensive list of all rules from Rector's rule sets
2. **Given** the list is displayed, **When** a user views a rule entry, **Then** each rule shows its name, description, and which rule set it belongs to
3. **Given** a user views the complete list, **When** they scan through the results, **Then** rules are organized in a readable format that makes it easy to identify relevant refactoring rules

---

### User Story 2 - Filter Rules by Category or Rule Set (Priority: P2)

A developer wants to find rules specific to their needs (e.g., PHP 8.x upgrades, code quality improvements, or framework-specific rules) without browsing through hundreds of unrelated rules.

**Why this priority**: As Rector has many rules across different categories, filtering is essential for usability. This significantly improves the user experience but depends on having the basic listing functionality first.

**Independent Test**: Can be tested by requesting rules for a specific category (e.g., "PHP 8.0" or "Code Quality") and verifying that only relevant rules from that category are returned.

**Acceptance Scenarios**:

1. **Given** the user wants rules for a specific purpose, **When** they filter by rule set name (e.g., "PHP80"), **Then** only rules from that rule set are displayed
2. **Given** the user is exploring categories, **When** they request available categories or rule sets, **Then** the system shows all available categories they can filter by
3. **Given** the user applies a filter, **When** the filtered list is displayed, **Then** it maintains the same detailed information as the unfiltered list

---

### User Story 3 - Search Rules by Keyword (Priority: P3)

A developer knows roughly what they're looking for (e.g., "array functions" or "type declarations") and wants to quickly find relevant rules without browsing through categories.

**Why this priority**: Search functionality enhances discoverability but is not essential for the MVP. Users can still find rules through browsing and filtering.

**Independent Test**: Can be tested by searching for a specific term (e.g., "array") and verifying that all rules with matching names or descriptions are returned.

**Acceptance Scenarios**:

1. **Given** the user has a specific refactoring need, **When** they search by keyword (e.g., "array"), **Then** all rules with matching terms in their name or description are displayed
2. **Given** a search returns no results, **When** the user views the response, **Then** a clear message indicates no matching rules were found
3. **Given** a search is successful, **When** results are displayed, **Then** matching terms are highlighted or clearly indicated to show why each rule matched

---

### Edge Cases

- What happens when the online Rector data source (https://getrector.com/find-rule or repository) is unavailable or unreachable?
- What happens when Rector's rule definitions change or are updated (new version) after the server has cached data?
- How does the system handle rules that have dependencies on other rules?
- What if individual rules have missing required metadata (name, description, or rule set)?
- How should deprecated or experimental rules be indicated?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a way to retrieve and display all available Rector rules
- **FR-002**: System MUST include rule metadata for each rule: rule name, description, and rule set/category
- **FR-003**: System MUST organize rules by their rule sets (e.g., PHP versions, frameworks, code quality sets)
- **FR-004**: System MUST support filtering rules by rule set or category name
- **FR-005**: System MUST support searching rules by keyword in rule names and descriptions
- **FR-006**: System MUST handle cases where rule information is unavailable with clear error messages
- **FR-007**: System MUST indicate if a rule is deprecated or experimental (if such metadata exists)
- **FR-008**: System MUST provide a count of total rules available in the complete list
- **FR-009**: System MUST present results in a structured format that's easy to parse and read
- **FR-010**: System MUST source rule information from official Rector online resources (https://getrector.com/find-rule or the Rector GitHub repository)
- **FR-011**: System MUST fetch rule data at runtime to ensure up-to-date rule information
- **FR-012**: System MUST return complete result sets without pagination (MCP clients handle display management)
- **FR-013**: System MUST cache fetched rule data in memory for the duration of the server session to optimize performance
- **FR-014**: System MUST validate rule metadata completeness and exclude rules with missing required fields (name, description, or rule set)

### Key Entities *(include if feature involves data)*

- **Rule**: Represents a single Rector refactoring rule with properties: rule identifier/name, human-readable description, rule set/category it belongs to, status (stable/deprecated/experimental if available)
- **Rule Set**: Represents a collection of related rules (e.g., "PHP 8.0 Migration", "Code Quality", "Symfony") with properties: set name, description, count of rules it contains
- **Search Query**: User input for filtering or searching rules, containing: keyword/term, optional rule set filter, search scope (name only vs name+description)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can retrieve a complete list of Rector rules in under 3 seconds
- **SC-002**: Users can identify and locate a specific rule they're looking for within 1 minute using search or filter capabilities
- **SC-003**: 90% of developers can successfully find at least 5 relevant rules for their project needs without external documentation
- **SC-004**: System accurately returns all rules from official Rector rule sets with no missing entries
- **SC-005**: Filter operations return results in under 1 second for any category or rule set
- **SC-006**: Search queries return relevant results with at least 80% precision (matching rules are actually relevant to the search term)
