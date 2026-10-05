# Thinking Map Skill V3

Turn ideas into structured architecture diagrams. Default output is a full-width 16:9 diagram only: no AI Analysis sidebar or notes panel.

## Changes

- Entire 1600 × 900 canvas serves the architecture.
- Directional arrowheads and concise relationship labels make flow and dependencies explicit.
- Named boundaries communicate responsibility or system layers; routes avoid nodes and minimize crossings.
- Self-contained HTML uses inline CSS and SVG and works offline.
- Analysis and provenance remain in model data; important uncertainty can appear as a short node marker.

This package upgrades the supplied `thinking-map-skill.zip` (whose SKILL.md declared 1.0.0). The unavailable V2 package was not used. The three rendering references below are newly added.

## Files

- `SKILL.md`: workflow and output defaults.
- `references/html-rendering.md`: offline HTML and sizing rules.
- `references/visual-system.md`: grouping and arrow conventions.
- `references/quality-gate.md`: delivery checks.
- `references/architecture-schema.json`: preserved architecture model.
- `references/examples.md`: preserved use cases.
- `assets/architecture-template.html`: editable, complete sample diagram.

Open the template directly in a browser. Adapt its example nodes and SVG paths to the actual model. The template is a static rendering starter, not an automatic graph layout engine.

The uploaded reference image informs grouping, spacing and connector routing only; its content and pixels are not embedded or copied.
