#!/usr/bin/env python3
"""
Script para transformação de emojis: 🐾 → 🏥
Transforma emojis de petshop para clínica médica
"""
import os
from pathlib import Path

# Mapeamento de emojis
EMOJI_MAP = {
    '🐾': '🏥',  # Pata → Hospital
    '🐶': '👤',  # Cachorro → Pessoa
    '🐱': '👤',  # Gato → Pessoa
    '🦴': '💊',  # Osso → Remédio
    '🎾': '📋',  # Bolinha → Clipboard
}

# Pastas a ignorar
IGNORE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', 
    'coverage', '.vscode', '.idea', '__pycache__'
}

# Extensões de arquivo para processar
EXTENSIONS = {
    '.md', '.ts', '.tsx', '.js', '.jsx', '.json', 
    '.html', '.css', '.txt', '.svg'
}

def should_process(file_path):
    """Verifica se o arquivo deve ser processado"""
    parts = Path(file_path).parts
    if any(ignore_dir in parts for ignore_dir in IGNORE_DIRS):
        return False
    return Path(file_path).suffix in EXTENSIONS

def transform_file(file_path):
    """Transforma emojis em um arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplica substituições de emojis
        for old_emoji, new_emoji in EMOJI_MAP.items():
            content = content.replace(old_emoji, new_emoji)
        
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
    files_changed = 0
    
    print("🚀 Iniciando transformação de emojis: 🐾 → 🏥\n")
    
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_process(file_path):
                if transform_file(file_path):
                    files_changed += 1
                    print(f"✅ {file_path.relative_to(base_dir)}")
    
    print(f"\n📊 Total de arquivos modificados: {files_changed}")
    print(f"✨ Transformação de emojis concluída!")

if __name__ == '__main__':
    main()
