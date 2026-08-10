from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv


def _candidate_env_files(base_dir: Path | None = None) -> Iterable[Path]:
    roots: list[Path] = []
    if base_dir is not None:
        roots.append(base_dir)
    roots.extend([
        Path.cwd(),
        Path(__file__).resolve().parents[1],
        Path(__file__).resolve().parents[2],
    ])

    seen: set[Path] = set()
    for root in roots:
        resolved = root.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        yield resolved / ".env"
        yield resolved / "ai-services" / ".env"


def load_runtime_env(base_dir: str | os.PathLike[str] | None = None) -> None:
    """Load environment variables from the nearest .env files without overriding existing values."""
    for env_path in _candidate_env_files(Path(base_dir) if base_dir is not None else None):
        if env_path.exists():
            load_dotenv(env_path, override=False)
