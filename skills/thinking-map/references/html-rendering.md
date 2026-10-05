# HTML rendering

Default to one full-width architecture canvas with SVG viewBox="0 0 1600 900". Preserve the 16:9 ratio; scale the complete SVG uniformly so edges remain attached to nodes. Use a minimum readable width with horizontal scrolling on narrow screens rather than compressing labels beyond recognition.

Use inline CSS, inline SVG and system font fallbacks. No CDN, network fetch, external font, image or script. The file must open with file:// and without a server. Give the SVG an accessible title and description. Use a 16:9 print page and avoid clipping.

Do not render analysis, commentary, citations, risks or next-action panels. Keep analysis metadata in the model. A compact diagram title and necessary relation labels are allowed. Explicitly requested supporting prose belongs in a separate deliverable.

Render boundaries behind connectors, then nodes and labels. Route connectors between node edges, with arrowheads visible at target boundaries. Place relation labels in clear gaps on an opaque background. Route returns through dedicated outside lanes. Adjust paths whenever nodes move; fixed coordinates do not auto-layout.

The bundled template demonstrates one model; it does not parse architecture JSON. Replace its nodes, labels, boundaries and paths together. Validate node IDs and edge endpoints against the actual model. Escape any user text inserted into HTML/SVG.
