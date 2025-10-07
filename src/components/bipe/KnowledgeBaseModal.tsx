import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Search,
  Trash2,
  Edit2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  source: "bipe" | "manual";
  usage_count: number;
  created_at: string;
}

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Serviços",
  "Preços",
  "Horários",
  "Políticas",
  "Adestramento",
  "Hotel/Creche",
  "BIPE Protocol",
  "Geral",
];

const COMMON_TAGS = [
  "Banho",
  "Tosa",
  "Consulta",
  "Vacina",
  "Hotel",
  "Creche",
  "Adestramento",
  "Emergência",
  "FAQ",
];

export function KnowledgeBaseModal({
  isOpen,
  onClose,
  onSuccess,
}: KnowledgeBaseModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"add" | "manage">("add");
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Geral",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (isOpen && activeTab === "manage") {
      loadEntries();
    }
  }, [isOpen, activeTab]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      // const response = await apiClient.get('/api/knowledge-base');
      // setEntries(response.data.entries);

      // Mock data for now
      setEntries([
        {
          id: "1",
          question: "Qual o horário de funcionamento?",
          answer: "Funcionamos de segunda a sexta das 8h às 18h, e sábados das 9h às 13h.",
          category: "Horários",
          tags: ["FAQ", "Horários"],
          source: "manual",
          usage_count: 45,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          question: "Quanto custa o banho para cachorro grande?",
          answer: "O banho para cachorros grandes custa R$80. Inclui banho, secagem e escovação.",
          category: "Preços",
          tags: ["Banho", "Preços"],
          source: "bipe",
          usage_count: 23,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar entradas",
        description: "Tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Pergunta e resposta são obrigatórias",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call
      // await apiClient.post('/api/knowledge-base', {
      //   ...formData,
      //   source: 'manual'
      // });

      toast({
        title: "✅ Entrada adicionada!",
        description: "Conhecimento salvo com sucesso",
      });

      // Reset form
      setFormData({
        question: "",
        answer: "",
        category: "Geral",
        tags: [],
      });

      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: "Tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta entrada?")) return;

    setIsLoading(true);
    try {
      // TODO: Implement API call
      // await apiClient.delete(`/api/knowledge-base/${id}`);

      toast({
        title: "✅ Entrada removida",
      });

      loadEntries();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Gestão de Knowledge Base
          </DialogTitle>
          <DialogDescription>
            Adicione e gerencie o conhecimento da IA
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Search className="w-4 h-4 mr-2" />
              Gerenciar ({entries.length})
            </TabsTrigger>
          </TabsList>

          {/* Add New Entry */}
          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Pergunta *</Label>
                <Input
                  id="question"
                  placeholder="Ex: Qual o horário de funcionamento?"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Resposta *</Label>
                <Textarea
                  id="answer"
                  placeholder="Resposta completa e detalhada..."
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Tags</Label>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Tags comuns:</div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.filter((tag) => !formData.tags.includes(tag)).map(
                      (tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => addTag(tag)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Tag personalizada..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(newTag);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(newTag)}
                    disabled={!newTag}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddEntry}
                disabled={isLoading || !formData.question || !formData.answer}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Adicionar Conhecimento
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Manage Entries */}
          <TabsContent value="manage" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pergunta, resposta ou tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery
                  ? "Nenhuma entrada encontrada"
                  : "Nenhuma entrada cadastrada"}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {filteredEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            {entry.question}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {entry.answer}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{entry.category}</Badge>
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        <Badge
                          variant={entry.source === "bipe" ? "default" : "outline"}
                        >
                          {entry.source === "bipe" ? "Via BIPE" : "Manual"}
                        </Badge>
                        <Badge variant="outline" className="ml-auto">
                          {entry.usage_count}x usado
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
