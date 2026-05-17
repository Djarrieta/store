---
description: "Create a plan.md in the project root for a new feature or task"
agent: "agent"
tools: [read, search]
argument-hint: "Describe the feature or task to plan"
---

Analyze the current codebase (structure, conventions, existing modules) and create a `plan.md` file in the root of the project for the requested feature or task.

The plan should include:
- **Problem statement** — what needs to be done and why
- **Proposed approach** — high-level solution strategy
- **Files to create or modify** — list each file with a short description of the change
- **Database changes** — any new tables, columns, or migrations needed
- **Open questions** — anything that needs clarification before starting

Rules:
- DO NOT write any implementation code
- DO NOT modify any existing files
- ONLY produce the `plan.md` document
- Follow the project conventions described in [AGENTS.md](../../AGENTS.md)
