#!/usr/bin/env python3
"""
Script para transformação em massa: AuZap → Oxy
Substitui todas as referências mantendo case-sensitivity
"""
import os
import re
from pathlib import Path

# Mapeamento de substituições
REPLACEMENTS = {
    'AuZap': 'Oxy',
    'auzap': 'oxy',
    'AUZAP': 'OXY',
}

# Pastas a ignorar
IGNORE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', 
    'coverage', '.vscode', '.idea', '__pycache__'
}

# Extensões de arquivo para processar
EXTENSIONS = {
    '.md', '.ts', '.tsx', '.js', '.jsx', '.json', 
    '.html', '.css', '.txt', '.yml', '.yaml'
}

def should_process(file_path):
    """Verifica se o arquivo deve ser processado"""
    # Ignora node_modules e outras pastas
    parts = Path(file_path).parts
    if any(ignore_dir in parts for ignore_dir in IGNORE_DIRS):
        return False
    
    # Apenas extensões específicas
    return Path(file_path).suffix in EXTENSIONS

def transform_file(file_path):
    """Transforma um arquivo aplicando todas as substituições"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplica substituições
        for old, new in REPLACEMENTS.items():
            content = content.replace(old, new)
        
        # Só escreve se houver mudanças
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"❌ Erro em {file_path}: {e}")
        return False

def main():
    """Processa todos os arquivos recursivamente"""
    base_dir = Path('/Users/saraiva/oxy')
    files_processed = 0
    files_changed = 0
    
    print("🚀 Iniciando transformação em massa: AuZap → Oxy\n")
    
    for root, dirs, files in os.walk(base_dir):
        # Remove diretórios ignorados da busca
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_process(file_path):
                files_processed += 1
                
                if transform_file(file_path):
                    files_changed += 1
                    print(f"✅ {file_path.relative_to(base_dir)}")
    
    print(f"\n📊 Resumo:")
    print(f"   Arquivos processados: {files_processed}")
    print(f"   Arquivos modificados: {files_changed}")
    print(f"\n✨ Transformação concluída!")

if __name__ == '__main__':
    main()
