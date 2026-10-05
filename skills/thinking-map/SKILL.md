---
name: thinking-map
description: >
  Universal thinking architecture skill. Use when a user has an idea, project, problem,
  workflow, product, system, course, business model, research topic, plan, or any complex
  task that should be clarified before execution. The skill turns incomplete thinking into
  a structured architecture, supplements missing domains when needed, selects the best
  diagram type, and produces a full-width 16:9 HTML architecture diagram with labeled directional relationships.
metadata:
  version: "3.0.0"
---

# Thinking Map

## Purpose

Thinking Map is not a drawing skill.

Its job is to help the user **think clearly before executing**.

Transform:

> "I have an idea."

into:

> "I can see the whole structure, the missing parts, the relationships, and the next move."

The skill must perform:

**Understand → Research → Complete → Critique → Model → Visualize**

before recommending execution.

---

# 1. When to use this skill

Trigger this skill when the user wants to clarify or architect any of the following:

- idea
- project
- workflow
- product
- software / app / SaaS
- AI agent / skill
- content system
- course
- book
- business model
- marketing system
- service system
- SOP
- learning plan
- research project
- event
- organizational process
- decision system
- personal project
- unfamiliar complex task

Also use it when the user says things such as:

- "帮我搭框架"
- "帮我把思路理清"
- "画一个架构图"
- "这个项目应该包含什么"
- "我是不是漏了什么"
- "先不要执行，先把整个结构搭出来"
- "帮我做一个完整思维框架"

Do NOT treat every request as a mind map.
Choose the diagram form based on the relationship structure.

---

# 2. Core rule

**Think first. Draw second. Execute third.**

Do not merely reorganize the user's words.

The user may provide only 20%-60% of a complete system.

You must determine:

1. What is the user actually trying to achieve?
2. What problem is being solved?
3. Which professional domains are involved?
4. What has the user already defined?
5. What critical parts are missing?
6. What relationships exist between the parts?
7. What should remain in the main diagram?
8. What belongs in internal analysis rather than on the diagram?
9. What assumptions are being made?
10. What should the user do next?

---

# 3. Stage A — Understand

Extract or infer the following:

## Goal
What final outcome should exist?

## Problem
What problem or need creates the project?

## User / Stakeholders
Who uses, receives, operates, approves, pays for, or depends on it?

## Scenario
Where and when does it happen?

## Input
What must enter the system?

## Process
What transformations or decisions happen?

## Output
What comes out?

## Constraints
Possible constraints include:

- time
- budget
- people
- technology
- data
- skills
- platform
- policy / law
- security
- operations
- quality
- dependencies

If information is incomplete, do not stop by default.
Create a reasonable V1 architecture and explicitly mark assumptions and TBD items.

Ask a clarification question only when the missing information would radically change the architecture and cannot be safely represented as an assumption.

---

# 4. Stage B — Domain recognition

Identify every professional domain materially involved.

Examples:

Software:
- product
- UX
- frontend
- backend
- database
- authentication
- payments
- security
- analytics
- operations

Course:
- learning objectives
- audience
- curriculum
- teaching flow
- examples
- assignments
- assessment
- delivery
- conversion

Business:
- customer
- value proposition
- acquisition
- product ladder
- delivery
- revenue
- cost
- retention
- operations

Do not limit the analysis to domains explicitly mentioned by the user.

---

# 5. Stage C — Knowledge supplementation

Decide whether external knowledge is needed.

Use four possible knowledge sources:

## USER
Information explicitly provided by the user.

## CONTEXT
Relevant files, prior project context, internal knowledge base, or connected sources.

## RESEARCH
External professional knowledge or current information.

## ASSUMPTION
A reasonable working assumption required to complete the V1 map.

Research only when it materially improves structural completeness or accuracy.

Research is not the final product.
The architecture is the final product.

---

# 6. Stage D — Architecture Critic

Before rendering the diagram, perform an internal architecture review.

Check:

## Goal completeness
Can this architecture actually produce the intended outcome?

## Module completeness
Are critical modules missing?

## Flow completeness
Is there a complete path from input to output?

## Dependency correctness
Are prerequisites and dependencies represented correctly?

## Decision points
Where are choices required?

## Risk
Where can the project fail?

## Feedback loop
How does the system learn, improve, or update?

## Scalability
Can future expansion happen without rebuilding everything?

## Redundancy
Are any modules unnecessary or duplicated?

## Granularity
Are some modules too broad or too detailed?

Revise before output.

---

# 7. Stage E — Architecture lenses

Use only the lenses relevant to the project.

Possible lenses:

## WHY
- background
- problem
- opportunity
- goal

## WHO
- user
- customer
- operator
- stakeholder

## WHAT
- product
- service
- module
- feature

## INPUT
- data
- files
- people
- tools
- money
- content
- technology

## PROCESS
- workflow
- transformation
- decision
- handoff

## OUTPUT
- deliverable
- result
- artifact
- user outcome

## SYSTEM
- AI
- database
- knowledge base
- API
- people
- SOP
- software

## CONTROL
- review
- permission
- standard
- safety
- QA
- approval

## FEEDBACK
- measurement
- data
- learning
- iteration
- optimization

## EXPANSION
- V2
- V3
- additional users
- additional channels
- automation
- new revenue
- new integrations

Do not force all ten lenses onto every project.

---

# 8. Stage F — Select the diagram type

Choose the diagram that best expresses the relationships.

## System Architecture
Use for:
- software
- AI systems
- SaaS
- apps
- agents
- technical platforms

## Workflow
Use for:
- SOP
- production
- service process
- automation
- operational sequence

## Mind Map
Use for:
- conceptual expansion
- topic breakdown
- knowledge categories

## Decision Tree
Use for:
- branching logic
- choices
- diagnostics
- qualification

## Business Architecture
Use for:
- business model
- revenue system
- product ladder
- conversion system

## Customer Journey
Use for:
- user experience
- service touchpoints
- lifecycle

## Knowledge Architecture
Use for:
- courses
- books
- knowledge systems
- disciplines

## Roadmap
Use for:
- staged execution
- product development
- timeline

## Ecosystem Map
Use for:
- multi-party platforms
- partner systems
- organizations
- stakeholder networks

If needed, combine one primary diagram with one secondary diagram.
Avoid more than two diagram types unless the user explicitly requests complexity.

---

# 9. Main diagram density

The main diagram must contain only information necessary to understand the system.

Prefer node labels of **2-8 Chinese characters** or a short English phrase.

Do not place paragraphs inside nodes.

Keep detailed reasoning in internal architecture data; do not render it as a sidebar, notes panel, or footer commentary.

Target:

- 6-16 primary nodes for a normal project
- 3-7 major groups/layers
- a clear visual hierarchy
- obvious directional relationships

---

# 10. Provenance labels

Each important node should retain a provenance value in the architecture data:

- `USER` — explicitly from the user
- `CONTEXT` — from user-owned project context
- `AI` — structural supplementation by the model
- `RESEARCH` — supported by external research
- `ASSUMPTION` — working assumption
- `TBD` — requires later confirmation

The user should be able to distinguish:
**what they said vs what AI added.**

---

# 11. Diagram-only default

Use the entire 16:9 canvas for the architecture. No AI Analysis sidebar, notes panel, risk cards, next-action panel, or reserved commentary column. A compact title, group labels, node labels and edge labels are part of the diagram.

Retain analysis and provenance in the structured model. Show a short ASSUMPTION or TBD marker on affected nodes when uncertainty matters; do not turn metadata into a separate panel. Provide analysis outside the artifact only when requested.

Before rendering, read [visual-system.md](references/visual-system.md) for grouping, flow and relationship conventions.

---

# 12. Architecture schema

Before writing HTML, create structured architecture data.

Use the schema in:

`references/architecture-schema.json`

Minimum conceptual structure:

```json
{
  "project": {},
  "diagram": {},
  "domains": [],
  "groups": [],
  "nodes": [],
  "edges": [],
  "analysis": {},
  "next_actions": []
}
```

Do NOT make HTML the source of truth.

The architecture schema is the source of truth.
HTML is only a renderer.

---

# 13. HTML output

Generate a self-contained HTML file with a full-width 1600 × 900 (16:9) diagram. Use inline SVG for nodes, boundaries and directional edges in one coordinate system. No external scripts, fonts, stylesheets or images are required.

Read [html-rendering.md](references/html-rendering.md) and adapt [architecture-template.html](assets/architecture-template.html). Replace the example graph with the user's actual architecture. Preserve clear source-to-target arrowheads, labeled relationships, meaningful boundaries and readable dependency paths. Minimize edge crossings; use another full-width view if complexity exceeds readable density.

# 14. Required output

Default: deliver the architecture HTML and a concise link. Do not append analysis or next-action sections to the canvas. If explanations are explicitly requested, provide them separately. Keep the structured model as the source of truth; schema fields `analysis` and `next_actions` are internal metadata, not instructions to render panels.

---

# 15. Quality gate

Apply [quality-gate.md](references/quality-gate.md) before delivery. The internal review should answer:

1. 我要做的这件事本质是什么？
2. 为什么要做？
3. 它由哪些关键部分组成？
4. 各部分是什么关系？
5. 从哪里开始？
6. 中间如何运转？
7. 最终产生什么？
8. 我遗漏了什么？
9. 哪些是 AI 补充的？
10. 下一步做什么？

Ensure the diagram clearly communicates components, relationships, entry points and outcomes. Keep supplementary reasoning internal unless requested.

---

# 16. Anti-patterns

Do NOT:

- simply convert bullets into boxes
- generate a generic mind map for every task
- dump research into the diagram
- add every possible module just to appear comprehensive
- confuse "more nodes" with "better thinking"
- hide assumptions
- create a beautiful diagram with weak logic
- produce execution details before the architecture is stable
- make the user read long paragraphs inside nodes
- force technical jargon on non-technical projects

---

# 17. Core philosophy

The user's original idea is a starting point, not a boundary.

The skill should preserve the user's intent while expanding the field of view.

The final map should feel like:

> "这是我原来的想法，但它被看得更完整、更专业、更清楚了。"

The skill succeeds when the user can see the entire system at a glance and knows what to do next.
