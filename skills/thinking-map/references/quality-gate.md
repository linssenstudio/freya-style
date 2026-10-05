# Quality gate

Before delivery:

1. Confirm the canvas is full-width 16:9 and has no sidebar, notes panel or reserved analysis column.
2. Trace the main path from input to output. Check every directed edge has a visible target arrowhead and a readable relationship label.
3. Check endpoints against model IDs; verify dependency arrows point consumer → prerequisite and feedback points to the actual revision target.
4. Confirm boundaries represent real ownership/layers and node placement does not mix abstraction levels.
5. Inspect at native size and a smaller viewport: no clipped text, detached connectors, hidden arrowheads, edge-label overlaps or lines through unrelated nodes. Minimize crossings and distinguish crossings from junctions.
6. Open the file offline. Ensure CSS/SVG are embedded and no external requests or missing assets are required. Check print aspect ratio.
7. Preserve architecture assumptions in model data; mark material uncertainty briefly on affected nodes. Do not add a commentary panel to explain ambiguous arrows—fix the arrows.
8. Validate package paths and reference links. Report any rendering checks that could not be performed.

## Failure pattern from the supplied V2 example

Do not build seven equal narrow columns filled with tiny cards and connect only the column gaps. Edges must express actual node relationships. Avoid decorative feedback brackets with percentage-based positions: both endpoints must identify real nodes and the return condition. Do not shrink 8–13 px text to fit a dense presentation. Removing a sidebar alone does not repair these problems.
