#!/usr/bin/env python3
"""
FASE 5: Adaptação de AI Prompts
Adapta todos os prompts de IA para contexto médico/hospitalar
"""
import re
from pathlib import Path

base_dir = Path('/Users/saraiva/oxy')

# Mapeamento de contexto veterinário → médico nos prompts
PROMPT_TRANSFORMATIONS = {
    # Referências gerais
    r'patients e tutores': 'pacientes e responsáveis',
    r'tutores': 'responsáveis',
    r'tutor': 'responsável',
    r'clientes com carinho': 'pacientes com empatia e cuidado',
    r'Cadastrar patients': 'Cadastrar pacientes',
    r'patients automaticamente': 'pacientes automaticamente',
    r'carinho do {patient}': 'do paciente {patient}',
    r'banho do {patient}': 'consulta do(a) {patient}',
    r'Vamos marcar o banho': 'Vamos agendar a consulta',
    r'Vou já cadastrar o {patient}': 'Vou cadastrar o(a) paciente {patient}',
    r'patients e tutores': 'pacientes',
    
    # Serviços veterinários → médicos
    r'banho e tosa': 'consultas médicas',
    r'vacinas': 'imunizações',
    r'consulta veterinária': 'consulta médica',
    r'veterinário': 'médico',
    r'veterinária': 'médica',
    
    # Avisos e disclaimers médicos
    r'NUNCA forneça diagnósticos': 
        'NUNCA forneça diagnósticos médicos ou prescreva medicamentos',
    r'SEMPRE recomende consulta presencial':
        'SEMPRE recomende consulta presencial para questões de saúde',
}

def adapt_patient_ai_prompts():
    """Adapta prompts do Patient AI"""
    print("🔄 Adaptando Patient AI prompts...\n")
    
    file_path = base_dir / 'backend/src/services/ai/patient-ai.service.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    # Aplicar transformações
    for pattern, replacement in PROMPT_TRANSFORMATIONS.items():
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += 1
            content = new_content
    
    # Substituições específicas de contexto médico
    medical_context = """CONTEXTO MÉDICO IMPORTANTE:
- Você atende PACIENTES via WhatsApp
- Sua função: agendamento de consultas, confirmação de presença, renovação de receitas
- NUNCA forneça diagnósticos médicos ou prescreva medicamentos
- SEMPRE recomende consulta presencial para questões de saúde
- Proteja dados sensíveis (LGPD) - confirme identidade antes de fornecer informações médicas
- Em caso de emergência, oriente a procurar atendimento imediato (UPA/Pronto-Socorro)

SOBRE OS PACIENTES:
- Trate com empatia, respeito e profissionalismo
- Pergunte sobre sintomas apenas para contexto de agendamento
- Não faça perguntas clínicas detalhadas
- Encaminhe dúvidas médicas para consulta presencial

"""
    
    # Inserir contexto médico após SUAS RESPONSABILIDADES
    content = re.sub(
        r'(SUAS RESPONSABILIDADES:)',
        medical_context + r'\1',
        content
    )
    
    # Salvar
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Patient AI prompts adaptados ({changes} mudanças)")
    
    return changes

def adapt_oxy_assistant_prompts():
    """Adapta prompts do Oxy Assistant"""
    print("\n🔄 Adaptando Oxy Assistant prompts...\n")
    
    file_path = base_dir / 'backend/src/services/oxy-assistant/oxy_assistant.service.ts'
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        # Tentar caminho alternativo
        file_path = base_dir / 'backend/src/services/oxy-assistant/aurora.service.ts'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    
    original = content
    changes = 0
    
    # Transformações específicas do Oxy Assistant
    oxy_transformations = {
        r'Dr\(a\)\. {ownerName}': 'Dr(a). {ownerName}',
        r'petshop': 'clínica médica',
        r'Petshop': 'Clínica Médica',
        r'pets cadastrados': 'pacientes cadastrados',
        r'pacientes prioritários': 'pacientes prioritários',
        r'PATIENTS PRIORITÁRIOS': 'PACIENTES PRIORITÁRIOS',
        r'Último atendimento': 'Última consulta',
        r'patients em risco': 'pacientes em risco',
        r'proativas de campanhas': 'proativas de saúde preventiva',
    }
    
    for pattern, replacement in oxy_transformations.items():
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes += 1
            content = new_content
    
    # Adicionar contexto hospitalar
    clinical_context = """
CONTEXTO CLÍNICO:
Você tem acesso completo aos dados da clínica em tempo real:
- Pacientes cadastrados e histórico médico
- Consultas agendadas e realizadas
- Taxa de ocupação de leitos (se aplicável)
- Convênios e faturamento
- Exames pendentes de resultado
- Pacientes que necessitam acompanhamento

SUA FUNÇÃO PRINCIPAL:
- Fornecer insights estratégicos para gestão clínica
- Identificar pacientes que precisam de acompanhamento
- Sugerir campanhas de saúde preventiva
- Alertar sobre riscos e oportunidades
- Otimizar agenda e recursos

RESPONSABILIDADES ÉTICAS:
- Manter sigilo médico (LGPD)
- Não compartilhar dados sensíveis sem autorização
- Respeitar autonomia do médico nas decisões clínicas
- Focar em gestão, não em diagnósticos
"""
    
    # Inserir contexto
    if 'SUAS FUNÇÕES:' in content:
        content = content.replace(
            'SUAS FUNÇÕES:',
            clinical_context + '\nSUAS FUNÇÕES:'
        )
        changes += 1
    
    # Salvar
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Oxy Assistant prompts adaptados ({changes} mudanças)")
    
    return changes

def main():
    """Executa FASE 5"""
    print("=" * 60)
    print("🚀 FASE 5: Adaptação de AI Prompts para Contexto Médico")
    print("=" * 60)
    print()
    
    patient_ai_changes = adapt_patient_ai_prompts()
    oxy_assistant_changes = adapt_oxy_assistant_prompts()
    
    total = patient_ai_changes + oxy_assistant_changes
    
    print("\n" + "=" * 60)
    print(f"📊 Total de adaptações: {total}")
    print("=" * 60)
    print("\n✨ FASE 5 CONCLUÍDA!")
    print("\n📝 Próximo: FASE 6 - LGPD Compliance")

if __name__ == '__main__':
    main()
