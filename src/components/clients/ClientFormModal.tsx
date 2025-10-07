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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Loader2,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PhoneInput } from "@/components/PhoneInput";

interface Client {
  full_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSubmit: (data: Client) => Promise<void>;
  isLoading?: boolean;
}

const COMMON_TAGS = [
  "VIP",
  "Preferencial",
  "Novo",
  "Fidelizado",
  "Inadimplente",
  "Especial",
];

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSubmit,
  isLoading = false,
}: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
    notes: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  // Load client data when editing
  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name || "",
        phone_number: client.phone_number || "",
        email: client.email || "",
        address: client.address || "",
        notes: client.notes || "",
        tags: client.tags || [],
      });
    } else {
      setFormData({
        full_name: "",
        phone_number: "",
        email: "",
        address: "",
        notes: "",
        tags: [],
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
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


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="w-6 h-6 text-primary" />
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {client
              ? "Atualize as informações do cliente"
              : "Preencha os dados para cadastrar um novo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo *
              </Label>
              <Input
                id="full_name"
                placeholder="Ex: João Silva"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-base font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone *
                </Label>
                <PhoneInput
                  value={formData.phone_number}
                  onChange={(value) => setFormData({ ...formData, phone_number: value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro, cidade"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="h-12"
              />
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
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

            {/* Common Tags */}
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

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag personalizada..."
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

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Observações
            </Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre o cliente..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.full_name || !formData.phone_number}
              className="flex-1 btn-gradient text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {client ? "Atualizar" : "Criar Cliente"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

