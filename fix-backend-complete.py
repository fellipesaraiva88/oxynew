#!/usr/bin/env python3
"""
Script completo para corrigir todos os problemas no backend
"""

import os
import re
from pathlib import Path

# Mapeamento de correções
REPLACEMENTS = [
    # PetsService -> PatientsService (class name)
    (r'\bPetsService\b', 'PatientsService'),

    # petsService -> patientsService (instance name)
    (r'\bpetsService\b', 'patientsService'),

    # oxy_assistant -> oxy-assistant em middleware
    (r"oxy_assistant-auth\.middleware", "oxy-assistant-auth.middleware"),

    # oxy_assistant -> oxy-assistant em context builder
    (r"oxy_assistant-context-builder\.service", "oxy-assistant-context-builder.service"),
]

def fix_file(filepath):
    """Corrige todas as substituições em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    backend_dir = Path(__file__).parent / 'backend' / 'src'

    fixed_count = 0
    for filepath in backend_dir.rglob('*.ts'):
        if fix_file(filepath):
            print(f"✓ Fixed: {filepath.relative_to(backend_dir)}")
            fixed_count += 1

    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
