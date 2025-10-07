export const testUser = {
  email: 'teste@oxy.com',
  password: 'teste123',
  name: 'Usuário Teste',
};

export const testClient = {
  name: 'João da Silva',
  phone: '+5511999998888',
  email: 'joao@example.com',
};

export const testPet = {
  name: 'Thor',
  species: 'Cachorro',
  breed: 'Labrador',
  age: 3,
};

export const testBooking = {
  service: 'Banho',
  date: new Date(Date.now() + 86400000), // Tomorrow
  time: '14:00',
};

export const aiConfig = {
  attendanceEnabled: true,
  autoBooking: true,
  workingHours: {
    start: '08:00',
    end: '18:00',
  },
  tone: 'friendly' as const,
};
