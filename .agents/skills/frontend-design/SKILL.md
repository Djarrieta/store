---
name: frontend-design
description: Create bold, production-grade UI aligned with this project visual language.
---

When working on UI in this repository, follow these rules:

- Build expressive, intentional interfaces. Avoid default boilerplate layouts.
- Respect existing project visual language in src/app/globals.css and shared components.
- Prefer reusable components in src/app/components before adding one-off markup.
- Keep pages responsive across mobile and desktop.
- Use accessible semantics (headings, labels, button text, alt text).
- Keep motion purposeful and lightweight.
- Avoid introducing new design systems unless explicitly requested.

Implementation guidance:

- For page composition: prefer server components where possible.
- For forms and interactions: isolate client logic in "use client" components.
- Keep class names readable and grouped by layout, spacing, and state.
- Reuse existing patterns from ItemCard, ItemForm, PageHeader, and FilterableList.
