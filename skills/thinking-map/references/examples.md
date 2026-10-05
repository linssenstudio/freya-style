# Thinking Map Examples

## Example 1 — Build an AI writing workflow

### User input
> 我想做一个工作流，先分析一个人的历史资料，再生成符合她本人思想的小红书、口播和图文内容。

### Recommended diagram
Workflow + Knowledge Architecture

### Key supplements
- source ingestion
- identity/persona model
- factual memory vs opinion model
- domain knowledge
- content planning
- generation
- review
- feedback loop

### Provenance
- historical materials: USER
- persona model: AI
- factual/opinion separation: AI
- platform rules: RESEARCH if current rules matter

---

## Example 2 — Build a software product

### User input
> 我想把设计网页做成 APP 和 Mac/Windows 软件，还要有账号、订阅和付费。

### Recommended diagram
System Architecture

### Likely groups
- Client
- Identity
- Core Product
- Data
- Billing
- Security
- Analytics
- Operations

### Typical AI supplements
- password reset
- OAuth
- RBAC
- subscription lifecycle
- refund handling
- file storage
- logging
- rate limiting
- backup
- privacy
- app-store billing constraints

---

## Example 3 — Create a course

### User input
> 我要做一门给小白的色彩季型课。

### Recommended diagram
Knowledge Architecture + Learning Journey

### Likely structure
Problem → Learning Goal → Core Concepts → Demonstration → Practice → Feedback → Assessment → Application

### Architecture Critic questions
- Is the course teaching recognition or memorization?
- Is there a visual comparison method?
- How is learner confusion diagnosed?
- What evidence proves the learner can apply the method?
