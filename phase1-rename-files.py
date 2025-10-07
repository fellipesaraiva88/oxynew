#!/usr/bin/env python3
"""
FASE 1: Renomeação de Arquivos e Atualização de Imports
Petshop → Clínica Médica

Este script:
1. Renomeia arquivos (pets → patients, aurora → oxy-assistant)
2. Atualiza TODOS os imports automaticamente
3. Mantém histórico de mudanças
"""
import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Tuple

# Mapeamento de renomeações
FILE_RENAMES = {
    # Backend Services
    'backend/src/services/pets': 'backend/src/services/patients',
    'backend/src/services/aurora': 'backend/src/services/oxy-assistant',
    'backend/src/services/ai/client-ai.service.ts': 'backend/src/services/ai/patient-ai.service.ts',
    
    # Backend Routes
    'backend/src/routes/pets.routes.ts': 'backend/src/routes/patients.routes.ts',
    'backend/src/routes/aurora.routes.ts': 'backend/src/routes/oxy-assistant.routes.ts',
    
    # Backend Queue Jobs
    'backend/src/queue/jobs/aurora-daily-summary.job.ts': 'backend/src/queue/jobs/oxy-assistant-daily-summary.job.ts',
    'backend/src/queue/jobs/aurora-opportunities.job.ts': 'backend/src/queue/jobs/oxy-assistant-opportunities.job.ts',
    
    # Frontend Services
    'src/services/pets.service.ts': 'src/services/patients.service.ts',
    
    # Frontend Hooks
    'src/hooks/usePets.ts': 'src/hooks/usePatients.ts',
    
    # Frontend Pages
    'src/pages/Clientes.tsx': 'src/pages/Pacientes.tsx',
    'src/pages/ClientesKanban.tsx': 'src/pages/PacientesKanban.tsx',
    
    # Mobile
    'mobile/hooks/usePets.ts': 'mobile/hooks/usePatients.ts',
}

# Padrões de import a serem atualizados
IMPORT_PATTERNS = [
    # Pets → Patients
    (r"from ['\"](.*)\/pets\.service['\"]", r"from '\1/patients.service'"),
    (r"from ['\"](.*)\/pets\/pets\.service['\"]", r"from '\1/patients/patients.service'"),
    (r"import.*usePets.*from ['\"](.*)\/usePets['\"]", r"import { usePatients } from '\1/usePatients'"),
    
    # Aurora → OxyAssistant
    (r"from ['\"](.*)\/aurora\.service['\"]", r"from '\1/oxy-assistant.service'"),
    (r"from ['\"](.*)\/aurora\/aurora\.service['\"]", r"from '\1/oxy-assistant/oxy-assistant.service'"),
    (r"from ['\"](.*)\/aurora-proactive\.service['\"]", r"from '\1/oxy-assistant-proactive.service'"),
    
    # Client AI → Patient AI  
    (r"from ['\"](.*)\/client-ai\.service['\"]", r"from '\1/patient-ai.service'"),
    
    # Routes
    (r"from ['\"](.*)\/pets\.routes['\"]", r"from '\1/patients.routes'"),
    (r"from ['\"](.*)\/aurora\.routes['\"]", r"from '\1/oxy-assistant.routes'"),
]

# Pastas a ignorar
IGNORE_DIRS = {'node_modules', '.git', 'dist', 'build', '__pycache__'}

base_dir = Path('/Users/saraiva/oxy')

def rename_files():
    """Renomeia arquivos e diretórios"""
    print("📁 FASE 1.1: Renomeando arquivos...\n")
    
    renamed = []
    
    for old_path, new_path in FILE_RENAMES.items():
        old_full = base_dir / old_path
        new_full = base_dir / new_path
        
        if old_full.exists():
            # Criar diretório pai se não existir
            new_full.parent.mkdir(parents=True, exist_ok=True)
            
            # Renomear
            shutil.move(str(old_full), str(new_full))
            renamed.append((old_path, new_path))
            print(f"✅ {old_path} → {new_path}")
        else:
            print(f"⚠️  Não encontrado: {old_path}")
    
    print(f"\n📊 Total renomeado: {len(renamed)} arquivos/diretórios\n")
    return renamed

def update_imports_in_file(file_path: Path) -> int:
    """Atualiza imports em um arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        changes = 0
        
        # Aplicar padrões de import
        for pattern, replacement in IMPORT_PATTERNS:
            content, count = re.subn(pattern, replacement, content)
            changes += count
        
        # Atualizar referências a usePets → usePatients
        content = content.replace('usePets', 'usePatients')
        
        # Salvar se houver mudanças
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes
        
        return 0
        
    except Exception as e:
        print(f"❌ Erro em {file_path}: {e}")
        return 0

def update_all_imports():
    """Atualiza imports em todos os arquivos"""
    print("🔄 FASE 1.2: Atualizando imports...\n")
    
    extensions = {'.ts', '.tsx', '.js', '.jsx'}
    files_updated = 0
    total_changes = 0
    
    for root, dirs, files in os.walk(base_dir):
        # Remover diretórios ignorados
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if Path(file).suffix in extensions:
                file_path = Path(root) / file
                changes = update_imports_in_file(file_path)
                
                if changes > 0:
                    files_updated += 1
                    total_changes += changes
                    print(f"✅ {file_path.relative_to(base_dir)} ({changes} imports)")
    
    print(f"\n📊 Resumo:")
    print(f"   Arquivos atualizados: {files_updated}")
    print(f"   Total de imports corrigidos: {total_changes}\n")

def main():
    """Executa FASE 1 completa"""
    print("=" * 60)
    print("🚀 FASE 1: Renomeação de Arquivos e Atualização de Imports")
    print("=" * 60)
    print()
    
    # 1.1 Renomear arquivos
    renamed = rename_files()
    
    # 1.2 Atualizar imports
    update_all_imports()
    
    print("=" * 60)
    print("✨ FASE 1 CONCLUÍDA COM SUCESSO!")
    print("=" * 60)
    print()
    print("📝 Próximos passos:")
    print("   1. Verificar se o TypeScript compila sem erros")
    print("   2. Testar dev server")
    print("   3. Prosseguir para FASE 2 (Database Migration)")

if __name__ == '__main__':
    main()
