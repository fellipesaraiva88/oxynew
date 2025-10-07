# Client AI Service - Complete Function List

## Updated: October 2025

The Client AI Service (`backend/src/services/ai/client-ai.service.ts`) now includes **11 OpenAI Function Calling functions** organized into categories:

## 📋 Core Pet & Service Functions (3)

### 1. `cadastrar_pet`
- **Purpose**: Register a new pet for the client
- **Parameters**: nome, especie, raca, idade_anos, idade_meses, genero
- **Returns**: Success message with pet_id

### 2. `agendar_servico`
- **Purpose**: Schedule a service for a pet
- **Parameters**: pet_nome, tipo_servico, data, hora, duracao_minutos
- **Services**: consultation, grooming, hotel, daycare, surgery, exam, vaccine
- **Returns**: Booking confirmation with booking_id

### 3. `consultar_horarios`
- **Purpose**: Check available time slots for a service
- **Parameters**: tipo_servico, data
- **Returns**: List of available time slots

## 🎓 Training Functions (2) - NEW!

### 4. `criar_plano_adestramento`
- **Purpose**: Create a new training plan for a pet
- **Parameters**:
  - petId: Pet identifier
  - planType: basico, intermediario, avancado, personalizado
  - goals: Array of training objectives
  - totalSessions: Total number of sessions
- **Returns**: Success message with planId

### 5. `listar_planos_adestramento`
- **Purpose**: List training plans for a contact or specific pet
- **Parameters**: petId (optional)
- **Returns**: Array of plans with type, status, duration, frequency

## 🏨 Daycare/Hotel Functions (2) - NEW!

### 6. `criar_reserva_hospedagem`
- **Purpose**: Create daycare or hotel reservation
- **Parameters**:
  - petId: Pet identifier
  - stayType: daycare_diario, hospedagem_pernoite, hospedagem_estendida
  - checkInDate: Entry date (YYYY-MM-DD)
  - checkOutDate: Exit date (YYYY-MM-DD)
  - specialRequests: Optional special requests
- **Returns**: Reservation confirmation with stayId and status

### 7. `listar_reservas_hospedagem`
- **Purpose**: List daycare/hotel reservations
- **Parameters**:
  - petId: Optional pet filter
  - status: Optional status filter (reservado, em_andamento, concluido)
- **Returns**: Array of reservations with dates and status

## 🏥 BIPE Protocol Functions (2) - NEW!

### 8. `consultar_bipe_pet`
- **Purpose**: Check BIPE protocol (comprehensive health) for a pet
- **Parameters**: petId
- **Returns**: Protocol status with behavioral, individual, preventive, and emergent aspects

### 9. `adicionar_alerta_saude`
- **Purpose**: Add urgent health alert to BIPE protocol
- **Parameters**:
  - petId: Pet identifier
  - type: vacina_atrasada, vermifugo_atrasado, comportamento_critico, saude_urgente
  - description: Alert description
- **Returns**: Confirmation that manager was notified

## 📚 Knowledge Base Function (1) - NEW!

### 10. `consultar_base_conhecimento`
- **Purpose**: Search organization's knowledge base for answers
- **Parameters**: question
- **Returns**: Answer with confidence level (high/medium) or trigger for specialist

## 🚨 System Function (1)

### 11. `escalar_para_humano`
- **Purpose**: Escalate conversation to human attendant
- **Parameters**: motivo
- **Returns**: Confirmation of transfer

## Implementation Details

### Function Organization
```typescript
private getFunctions(): any[] {
  return [
    // Core Pet & Service Functions
    { name: 'cadastrar_pet', ... },
    { name: 'agendar_servico', ... },
    { name: 'consultar_horarios', ... },

    // Training Functions (NEW)
    { name: 'criar_plano_adestramento', ... },
    { name: 'listar_planos_adestramento', ... },

    // Daycare/Hotel Functions (NEW)
    { name: 'criar_reserva_hospedagem', ... },
    { name: 'listar_reservas_hospedagem', ... },

    // BIPE Protocol Functions (NEW)
    { name: 'consultar_bipe_pet', ... },
    { name: 'adicionar_alerta_saude', ... },

    // Knowledge Base Function (NEW)
    { name: 'consultar_base_conhecimento', ... },

    // System Functions
    { name: 'escalar_para_humano', ... }
  ];
}
```

### Handler Methods
Each function has a corresponding private method:
- `cadastrarPet()`
- `agendarServico()`
- `consultarHorarios()`
- `criarPlanoAdestramento()` ✨
- `listarPlanosAdestramento()` ✨
- `criarReservaHospedagem()` ✨
- `listarReservasHospedagem()` ✨
- `consultarBipePet()` ✨
- `adicionarAlertaSaude()` ✨
- `consultarBaseConhecimento()` ✨
- `escalarParaHumano()`

✨ = New functions added in October 2025

## Usage Example

```typescript
// AI automatically selects appropriate function based on user message
const response = await clientAIService.processMessage(
  {
    organizationId: 'org_123',
    contactId: 'contact_456',
    conversationId: 'conv_789'
  },
  "Quero criar um plano de adestramento básico para o Rex"
);

// AI will call criar_plano_adestramento with appropriate parameters
```

## Database Tables Used

- `pets` - Pet registration and health notes
- `services` - Available services catalog
- `bookings` - Service appointments
- `training_plans` - Training plans and sessions
- `daycare_hotel_stays` - Daycare/hotel reservations
- `bipe_protocol` - Health alerts and escalations
- `knowledge_base` - FAQ entries and responses
- `conversations` - Chat conversations
- `ai_interactions` - AI usage logging

## Notes

1. All functions respect multi-tenant isolation via `organization_id`
2. Functions include comprehensive error handling and logging
3. AI model used: GPT-4o-mini for cost efficiency
4. Maximum 500 tokens per response
5. Function calling is automatic based on conversation context