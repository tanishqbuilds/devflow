"""Build a renderable architecture diagram (nodes + edges) from the architecture
bundle. Generated deterministically so the frontend always has a valid graph to
draw with React Flow, independent of model output quirks.
"""
from __future__ import annotations

from typing import Any

_LAYERS = [
    ("frontend", "Frontend"),
    ("backend", "Backend"),
    ("database", "Database"),
    ("infrastructure", "Infrastructure"),
]
_MAX_COMPONENTS = 5


def build_diagram(architecture: dict[str, Any]) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []

    for layer_key, layer_label in _LAYERS:
        layer = architecture.get(layer_key, {}) if isinstance(architecture, dict) else {}
        hub_id = f"layer:{layer_key}"
        nodes.append({"id": hub_id, "label": layer_label, "group": layer_key, "kind": "layer"})

        components = (layer.get("components") or [])[:_MAX_COMPONENTS]
        for idx, comp in enumerate(components):
            comp_id = f"{layer_key}:{idx}"
            nodes.append({"id": comp_id, "label": str(comp), "group": layer_key, "kind": "component"})
            edges.append({"id": f"{hub_id}->{comp_id}", "source": hub_id, "target": comp_id, "label": ""})

    # Inter-layer flow.
    flow = [
        ("layer:frontend", "layer:backend", "API"),
        ("layer:backend", "layer:database", "persists"),
        ("layer:backend", "layer:infrastructure", "deploys on"),
    ]
    for src, dst, label in flow:
        edges.append({"id": f"{src}=>{dst}", "source": src, "target": dst, "label": label})

    return {"nodes": nodes, "edges": edges}


def build_mermaid(architecture: dict[str, Any]) -> str:
    """A Mermaid representation as a portable, copy-pasteable artifact."""
    lines = ["graph TD"]
    for layer_key, layer_label in _LAYERS:
        layer = architecture.get(layer_key, {}) if isinstance(architecture, dict) else {}
        lines.append(f'  {layer_key}["{layer_label}"]')
        for idx, comp in enumerate((layer.get("components") or [])[:_MAX_COMPONENTS]):
            safe = str(comp).replace('"', "'")
            lines.append(f'  {layer_key} --> {layer_key}_{idx}["{safe}"]')
    lines.append("  frontend --> backend")
    lines.append("  backend --> database")
    lines.append("  backend --> infrastructure")
    return "\n".join(lines)
