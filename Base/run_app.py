from __future__ import annotations

import sys
from pathlib import Path

# Add the parent of Base/ to sys.path so "from Base.app..." resolves correctly
# regardless of the working directory the script is launched from.
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from Base.app.ui_supplement_humain import main


if __name__ == "__main__":
    raise SystemExit(main())
