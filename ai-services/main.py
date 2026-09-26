"""JSON command-line entry point for the Python agent workflow."""

import argparse
import json
import sys
from pathlib import Path

from orchestrator.pipeline import Pipeline


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the social-media multi-agent workflow")
    parser.add_argument("input", nargs="?", help="JSON file; stdin is used when omitted")
    args = parser.parse_args()
    try:
        raw = Path(args.input).read_text(encoding="utf-8") if args.input else sys.stdin.read()
        payload = json.loads(raw)
        result = Pipeline().run(payload["posts"], payload["query"], payload.get("limit", 10))
        json.dump({"success": True, "data": result}, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        json.dump({"success": False, "error": str(error)}, sys.stderr)
        sys.stderr.write("\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
