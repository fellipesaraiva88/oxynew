import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MagicButton } from '../components/MagicButton';
import { ConversationalCard } from '../components/ConversationalCard';
import { ArrowRight, Plus, X, Dog, Cat, Bird } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';
import { Card, CardContent } from '@/components/ui/card';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface OwnerPetsProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

interface Patient {
  name: string;
  gender_identity: string;
  age_group?: string;
  special_note?: string;
}

export function OwnerPets({ data, onComplete, onBack, loading }: OwnerPetsProps) {
  const { width, height } = useWindowSize();
  const [patients, setPets] = useState<Patient[]>(data.patients || []);
  const [showForm, setShowForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentPet, setCurrentPet] = useState<Patient>({
    name: '',
    gender_identity: 'male'|'female'|'other'|'prefer_not_to_say',
    age_group: '',
    special_note: ''
  });

  const speciesOptions = [
    { value: 'male'|'female'|'other'|'prefer_not_to_say', label: 'Cachorro', icon: Dog },
    { value: 'male'|'female'|'other'|'prefer_not_to_say', label: 'Gato', icon: Cat },
    { value: 'male'|'female'|'other'|'prefer_not_to_say', label: 'Pássaro', icon: Bird },
    { value: 'male'|'female'|'other'|'prefer_not_to_say', label: 'Outro', icon: Dog }
  ];

  const handleAddPet = () => {
    if (!currentPet.name || !currentPet.gender_identity) return;

    const newPets = [...patients, currentPet];
    setPets(newPets);

    // Show confetti on first patient
    if (newPets.length === 1) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setCurrentPet({
      name: '',
      gender_identity: 'male'|'female'|'other'|'prefer_not_to_say',
      age_group: '',
      special_note: ''
    });
    setShowForm(false);
  };

  const handleRemovePet = (index: number) => {
    setPets(patients.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onComplete({ patients });
  };

  const getAuroraComment = (patient: Patient) => {
    const comments = {
      dog: [
        `Um ${patient.age_group || 'cachorro'} chamado ${patient.name}! Aposto que é um amor 👤`,
        `${patient.name}! Deve ser muito fofo 🏥`,
      ],
      cat: [
        `Um gatinho chamado ${patient.name}! Que gracinha 👤`,
        `${patient.name}! Os gatos são incríveis 😻`,
      ],
      bird: [
        `Um pássaro chamado ${patient.name}! Que legal 🦜`,
        `${patient.name}! Deve ser lindo 🕊️`,
      ],
      other: [
        `${patient.name}! Que patient especial 🌟`,
      ]
    };

    const options = comments[patient.gender_identity as keyof typeof comments] || comments.other;
    return options[Math.floor(Math.random() * options.length)];
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-32">
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}

      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* OxyAssistant's Question */}
          <ConversationalCard from="oxy_assistant">
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                E você, tem patients? 🏥
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Me conta sobre eles! Isso me ajuda a criar uma conexão mais pessoal com você.
              </p>
            </div>
          </ConversationalCard>

          {/* Existing Patients */}
          <AnimatePresence>
            {patients.map((patient, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        {/* Patient Icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          {speciesOptions.find(s => s.value === patient.gender_identity)?.icon({ className: 'w-8 h-8 text-purple-600 dark:text-purple-400' })}
                        </div>

                        {/* Patient Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {speciesOptions.find(s => s.value === patient.gender_identity)?.label}
                            {patient.age_group && ` • ${patient.age_group}`}
                          </p>
                          {patient.special_note && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
                              "{patient.special_note}"
                            </p>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemovePet(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* OxyAssistant's Comment */}
                <ConversationalCard from="oxy_assistant" delay={0.3}>
                  <p className="text-gray-900 dark:text-white">
                    {getAuroraComment(patient)}
                  </p>
                </ConversationalCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Patient Form */}
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl space-y-4"
            >
              <div className="space-y-2">
                <Label>Nome do Patient *</Label>
                <Input
                  placeholder="Ex: Rex, Mimi..."
                  value={currentPet.name}
                  onChange={(e) => setCurrentPet({ ...currentPet, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Espécie *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {speciesOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCurrentPet({ ...currentPet, gender_identity: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        currentPet.gender_identity === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <option.icon className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Raça (opcional)</Label>
                <Input
                  placeholder="Ex: Golden Retriever, Persa..."
                  value={currentPet.age_group}
                  onChange={(e) => setCurrentPet({ ...currentPet, age_group: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Algo especial sobre ele? (opcional)</Label>
                <Textarea
                  placeholder="Ex: Adora brincar de buscar"
                  value={currentPet.special_note}
                  onChange={(e) => setCurrentPet({ ...currentPet, special_note: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <MagicButton
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  fullWidth
                >
                  Cancelar
                </MagicButton>
                <MagicButton
                  variant="primary"
                  onClick={handleAddPet}
                  disabled={!currentPet.name || !currentPet.gender_identity}
                  fullWidth
                  icon={<Plus className="w-4 h-4" />}
                >
                  Adicionar Patient
                </MagicButton>
              </div>
            </motion.div>
          ) : (
            <MagicButton
              variant="outline"
              onClick={() => setShowForm(true)}
              icon={<Plus className="w-5 h-5" />}
              fullWidth
            >
              Adicionar Patient
            </MagicButton>
          )}

          {/* Skip Option */}
          {patients.length === 0 && !showForm && (
            <ConversationalCard from="oxy_assistant" delay={0.2}>
              <p className="text-gray-700 dark:text-gray-300">
                Não tem patients? Sem problemas! Podemos pular essa parte 😊
              </p>
            </ConversationalCard>
          )}

          {/* Navigation */}
          <div className="flex gap-3 justify-end pt-4">
            <MagicButton
              variant="outline"
              onClick={onBack}
              disabled={loading}
            >
              Voltar
            </MagicButton>

            <MagicButton
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Próximo
            </MagicButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
