#!/usr/bin/env python3
"""
Script para corrigir imports incorretos no backend
"""

import os
import re
from pathlib import Path

# Mapeamento de correções
FIXES = [
    # oxy_assistant -> oxy-assistant
    (r"from ['\"](.*)oxy_assistant(.*)\.js['\"]", r"from '\1oxy-assistant\2.js'"),
    (r"from ['\"](.*)oxy_assistant(.*)['\"](?!\.js)", r"from '\1oxy-assistant\2'"),

    # appointments -> bookings (para services)
    (r"from ['\"](.*/services/)appointments/appointments\.service\.js['\"]", r"from '\1bookings/bookings.service.js'"),
    (r"from ['\"](.*/services/)appointments/appointments\.service['\"]", r"from '\1bookings/bookings.service'"),

    # Corrigir paths de rotas
    (r"from ['\"]\.\/routes\/oxy_assistant\.routes\.js['\"]", r"from './routes/oxy-assistant.routes.js'"),
    (r"from ['\"]\.\/routes\/appointments\.routes\.js['\"]", r"from './routes/bookings.routes.js'"),
]

def fix_file(filepath):
    """Corrige imports em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        for pattern, replacement in FIXES:
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
