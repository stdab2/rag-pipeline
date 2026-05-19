from pathlib import Path


def get_project_root() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "pyproject.toml").exists():
            return parent
    raise FileNotFoundError("Could not find project root with pyproject.toml")


PROJECT_ROOT = get_project_root()
