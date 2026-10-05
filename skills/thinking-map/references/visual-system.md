# Visual system

Use the full 16:9 canvas. Do not reserve a sidebar or notes area. Borrow layout cues from a reference image without copying its content, branding or pixels.

## Hierarchy and grouping

Use named boundaries for real systems, responsibilities or layers. Containment means membership, not execution order. Keep one abstraction level per view. Use a compact title, short node names, readable edge labels, restrained colors and sufficient contrast. Prefer 24–30 px node labels and 18–22 px relationship labels at 1600 × 900. Split dense diagrams into separate full-width overview and detail views instead of shrinking text.

## Relationship semantics

Choose a dominant left-to-right or top-to-bottom flow. All directed relationships need a visible arrowhead and a concise label such as submits, validates, reads or publishes. For `depends_on`, draw consumer → prerequisite and label it “depends on”/“依赖”; do not confuse this with data moving prerequisite → consumer. For feedback, draw reviewer/output → revision target and label the reason for return. Decision branches require conditions. Two-way interactions use separate labeled routes when their meanings differ.

Prefer straight or orthogonal connectors with short routes. Anchor them at node boundaries, never at arbitrary canvas points. Do not run edges through unrelated nodes or text. Reserve lanes for feedback and dependencies; distinguish feedback with a dashed stroke and explicit label, not color alone. Minimize crossings by reordering nodes. If a crossing is unavoidable, make non-connection unambiguous with a bridge/gap; only use junction dots for actual shared connections.

Avoid decorative arrows, unlabeled ambiguous lines, accidental merging, and boundaries that imply false ownership. Show only actual relationships; do not connect nearby nodes just to fill space.
