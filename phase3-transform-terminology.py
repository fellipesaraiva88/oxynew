#!/usr/bin/env python3
"""
FASE 3: Transformação de Terminologia Backend
Petshop → Clínica Médica

Transforma toda a terminologia veterinária para médica
"""
import os
import re
from pathlib import Path

# Mapeamento completo de terminologia
TERMINOLOGY_MAP = {
    # Tabelas e tipos principais
    r'\bpet\b': 'patient',
    r'\bPet\b': 'Patient',
    r'\bpets\b': 'patients',
    r'\bPets\b': 'Patients',
    r'\bPET\b': 'PATIENT',
    r'\bPETS\b': 'PATIENTS',
    
    # Domínio veterinário → médico
    r'\bspecies\b': 'gender_identity',
    r'\bSpecies\b': 'GenderIdentity',
    r'\bbreed\b': 'age_group',
    r'\bBreed\b': 'AgeGroup',
    r'\bis_neutered\b': 'has_chronic_condition',
    r'\bisNeutered\b': 'hasChronicCondition',
    r'\bvaccination_record\b': 'immunization_record',
    r'\bvaccinationRecord\b': 'immunizationRecord',
    r'\bmedical_notes\b': 'medical_history',
    r'\bmedicalNotes\b': 'medicalHistory',
    r'\bbehavioral_notes\b': 'psychological_notes',
    r'\bbehavioralNotes\b': 'psychologicalNotes',
    
    # Serviços e agendamentos
    r'\bbooking\b': 'appointment',
    r'\bBooking\b': 'Appointment',
    r'\bbookings\b': 'appointments',
    r'\bBookings\b': 'Appointments',
    r'\bBOOKING\b': 'APPOINTMENT',
    r'\bBOOKINGS\b': 'APPOINTMENTS',
    r'\bpet_id\b': 'patient_id',
    r'\bpetId\b': 'patientId',
    
    # AI Services
    r'\bClientAI\b': 'PatientAI',
    r'\bclient-ai\b': 'patient-ai',
    r'\bclientAI\b': 'patientAI',
    r'\bClient AI\b': 'Patient AI',
    
    # Aurora → Oxy Assistant
    r'\bAurora\b': 'OxyAssistant',
    r'\baurora\b': 'oxy_assistant',
    r'\bAURORA\b': 'OXY_ASSISTANT',
    
    # Contextos e descrições
    r'\bowner\b': 'guardian',
    r'\bOwner\b': 'Guardian',
    r'\bveterinary\b': 'medical',
    r'\bVeterinary\b': 'Medical',
    r'\bvet\b': 'doctor',
    r'\bVet\b': 'Doctor',
    r'\banimal\b': 'patient',
    r'\bAnimal\b': 'Patient',
}

# Tipos específicos que precisam ser atualizados
TYPE_UPDATES = {
    # Enums veterinários
    r"'dog'|'cat'|'bird'|'rabbit'|'other'": 
        "'male'|'female'|'other'|'prefer_not_to_say'",
    
    # Comentários e documentação
    r'Pet species \(dog, cat, etc\)':
        'Patient gender identity',
    r'Pet breed':
        'Patient age group (infant, child, adolescent, adult, senior)',
}

IGNORE_DIRS = {'node_modules', '.git', 'dist', 'build', '__pycache__', 'migrations'}
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx'}

base_dir = Path('/Users/saraiva/oxy')

def should_process(file_path: Path) -> bool:
    """Verifica se arquivo deve ser processado"""
    parts = file_path.parts
    if any(ignore in parts for ignore in IGNORE_DIRS):
        return False
    return file_path.suffix in EXTENSIONS

def transform_terminology(content: str) -> tuple[str, int]:
    """Aplica transformações de terminologia"""
    original = content
    changes = 0
    
    # Aplicar substituições de terminologia
    for pattern, replacement in TERMINOLOGY_MAP.items():
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += len(re.findall(pattern, content))
            content = new_content
    
    # Aplicar atualizações de tipos
    for pattern, replacement in TYPE_UPDATES.items():
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += 1
            content = new_content
    
    return content, changes

def process_file(file_path: Path) -> int:
    """Processa um arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, changes = transform_terminology(content)
        
        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return changes
        
        return 0
        
    except Exception as e:
        print(f"❌ Erro em {file_path}: {e}")
        return 0

def process_backend():
    """Processa arquivos do backend"""
    print("🔄 Processando Backend...\n")
    
    backend_dir = base_dir / 'backend' / 'src'
    files_changed = 0
    total_changes = 0
    
    for root, dirs, files in os.walk(backend_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_process(file_path):
                changes = process_file(file_path)
                
                if changes > 0:
                    files_changed += 1
                    total_changes += changes
                    print(f"✅ {file_path.relative_to(base_dir)} ({changes} mudanças)")
    
    return files_changed, total_changes

def process_frontend():
    """Processa arquivos do frontend"""
    print("\n🔄 Processando Frontend...\n")
    
    frontend_dir = base_dir / 'src'
    files_changed = 0
    total_changes = 0
    
    for root, dirs, files in os.walk(frontend_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_process(file_path):
                changes = process_file(file_path)
                
                if changes > 0:
                    files_changed += 1
                    total_changes += changes
                    print(f"✅ {file_path.relative_to(base_dir)} ({changes} mudanças)")
    
    return files_changed, total_changes

def main():
    """Executa FASE 3"""
    print("=" * 60)
    print("🚀 FASE 3: Transformação de Terminologia")
    print("=" * 60)
    print()
    
    # Processar backend
    backend_files, backend_changes = process_backend()
    
    # Processar frontend
    frontend_files, frontend_changes = process_frontend()
    
    # Resumo
    total_files = backend_files + frontend_files
    total_changes = backend_changes + frontend_changes
    
    print("\n" + "=" * 60)
    print("📊 RESUMO GERAL")
    print("=" * 60)
    print(f"Backend:")
    print(f"  - Arquivos modificados: {backend_files}")
    print(f"  - Total de mudanças: {backend_changes}")
    print(f"\nFrontend:")
    print(f"  - Arquivos modificados: {frontend_files}")
    print(f"  - Total de mudanças: {frontend_changes}")
    print(f"\nTOTAL:")
    print(f"  - Arquivos: {total_files}")
    print(f"  - Mudanças: {total_changes}")
    print("=" * 60)
    print("\n✨ FASE 3 CONCLUÍDA!")

if __name__ == '__main__':
    main()
