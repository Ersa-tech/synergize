# Project Issues

## Critical Issues
- [x] TokenCounter service missing - Created complete TokenCounter service with tiktoken integration
  - **Impact:** High - Backend couldn't start without this service
  - **Difficulty:** Medium - Required implementing tiktoken integration
  - **Found:** 2024-12-31
  - **Task:** Backend service initialization
  - **Bolt.new Specific:** No
  - **Status:** Resolved
  - **Solution:** Created TokenCounter.ts with full tiktoken integration for precise token counting

- [x] Import path error in collaborationOrchestrator.ts - Fixed .ts extension to .js
  - **Impact:** High - Prevented backend from starting
  - **Difficulty:** Easy - Simple import path fix
  - **Found:** 2024-12-31
  - **Task:** Backend service imports
  - **Bolt.new Specific:** No
  - **Status:** Resolved
  - **Solution:** Changed import from './tokenCounter.ts' to './tokenCounter.js'

## Bolt.new Environment Issues
- [ ] Development servers need to be started
  - **Type:** Runtime
  - **Impact:** High - No preview available
  - **Workaround:** Run npm run dev
  - **Status:** In Progress

## Technical Debt
- [ ] Add comprehensive error handling to TokenCounter
  - **Priority:** Medium
  - **Effort:** 2 hours
  - **Task:** TokenCounter service
  - **Bolt.new Impact:** Stability

## Code Quality Issues
- [ ] Add unit tests for TokenCounter service
  - **File:** backend/src/services/tokenCounter.ts
  - **Type:** Testing
  - **Task:** TokenCounter implementation
  - **Bolt.new Testing:** Needs Testing

## Resolved Issues
- [x] Missing TokenCounter service - Created complete implementation
  - **Resolved:** 2024-12-31
  - **Solution:** Implemented TokenCounter with tiktoken for precise token counting
  - **Task:** Backend services
  - **Bolt.new Verified:** Pending