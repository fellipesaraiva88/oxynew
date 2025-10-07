import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { contactsService } from "@/services/contacts.service";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface Client {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  notes?: string;
}

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClientModal({ client, isOpen, onClose, onSuccess }: EditClientModalProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name || "",
        phone_number: client.phone_number || "",
        email: client.email || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  const handleUpdate = async () => {
    if (!formData.full_name || !formData.phone_number) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await contactsService.update(client.id, {
        full_name: formData.full_name,
        email: formData.email || undefined,
        notes: formData.notes || undefined,
      });

      toast({
        title: "✅ Cliente atualizado!",
        description: "Informações salvas com sucesso",
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Atualize as informações do cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4 mt-3 md:mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit_name" className="text-sm md:text-base">Nome Completo *</Label>
            <Input
              id="edit_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={isUpdating}
              className="h-11 md:h-10 text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_phone" className="text-sm md:text-base">Telefone *</Label>
            <Input
              id="edit_phone"
              value={formData.phone_number}
              disabled
              className="bg-muted h-11 md:h-10 text-sm md:text-base"
            />
            <p className="text-xs text-muted-foreground">Telefone não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_email" className="text-sm md:text-base">Email</Label>
            <Input
              id="edit_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isUpdating}
              className="h-11 md:h-10 text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes" className="text-sm md:text-base">Observações</Label>
            <Input
              id="edit_notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre o cliente..."
              disabled={isUpdating}
              className="h-11 md:h-10 text-sm md:text-base"
            />
          </div>

          <div className="flex gap-2 pt-3 md:pt-4">
            <Button variant="outline" onClick={onClose} disabled={isUpdating} className="flex-1 min-h-[44px] md:min-h-0 text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="flex-1 btn-gradient text-white min-h-[44px] md:min-h-0 text-sm md:text-base">
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
