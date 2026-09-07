#!/usr/bin/env python3
"""EasyFlashcard Developer Mode Prepopulation Entrypoint.

Directly invokes the backend seed script.
"""

import os
import sys

# Ensure backend directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
BACKEND_SCRIPTS_DIR = os.path.join(ROOT_DIR, "backend", "scripts")
sys.path.insert(0, BACKEND_SCRIPTS_DIR)

from seed_dev_data import main

if __name__ == "__main__":
    sys.exit(main())
