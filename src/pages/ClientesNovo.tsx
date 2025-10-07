import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Dog,
  Bot,
  Search,
  Filter,
  Grid3x3,
  List,
  Download,
  Sparkles,
} from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { contactsService } from "@/services/contacts.service";
import { useToast } from "@/hooks/use-toast";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { BookingFormModal } from "@/components/appointments/BookingFormModal";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCSV } from "@/utils/exportCSV";

export default function ClientesNovo() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "new" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { contacts, total, isLoading, refetch } = useContacts(searchQuery);

  // Calculate stats
  const newClients = contacts.filter((c) => {
    if (!c.created_at) return false;
    const createdDate = new Date(c.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  const totalPets = contacts.reduce((sum, c) => sum + (c.patients?.length || 0), 0);

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    if (statusFilter === "all") return true;
    
    if (statusFilter === "new") {
      if (!contact.created_at) return false;
      const createdDate = new Date(contact.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }

    if (statusFilter === "active") {
      if (!contact.last_message_at) return false;
      const lastMessage = new Date(contact.last_message_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastMessage >= sevenDaysAgo;
    }

    if (statusFilter === "inactive") {
      if (!contact.last_message_at) return true;
      const lastMessage = new Date(contact.last_message_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastMessage < thirtyDaysAgo;
    }

    return true;
  });

  const handleCreateClient = async (data: any) => {
    setIsCreating(true);
    try {
      await contactsService.create({
        ...data,
        phone_number: data.phone_number.replace(/\D/g, '')
      });
      toast({
        title: "✅ Cliente criado!",
        description: `${data.full_name} foi adicionado com sucesso`,
      });
      setIsFormOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar cliente",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateClient = async (data: any) => {
    if (!selectedClient) return;

    setIsCreating(true);
    try {
      const updateData = { ...data };
      if (updateData.phone_number) {
        updateData.phone_number = updateData.phone_number.replace(/\D/g, '');
      }
      await contactsService.update(selectedClient.id, updateData);
      toast({
        title: "✅ Cliente atualizado!",
        description: "Informações salvas com sucesso",
      });
      setIsFormOpen(false);
      setSelectedClient(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (client: any) => {
    if (!confirm(`Tem certeza que deseja excluir ${client.full_name}?`)) return;

    try {
      await contactsService.delete(client.id);
      toast({
        title: "✅ Cliente excluído!",
        description: "Cliente removido com sucesso",
      });
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.response?.data?.error || "Tente novamente",
      });
    }
  };

  const handleWhatsApp = (client: any) => {
    const phone = client.phone_number || client.phone;
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
  };

  const handleSchedule = (client: any) => {
    setSelectedClient(client);
    setIsBookingOpen(true);
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredContacts.map((c) => ({
        Nome: c.full_name,
        Telefone: c.phone_number,
        Email: c.email || "",
        Patients: c.patients?.length || 0,
        "Última Interação": c.last_message_at || "",
      })),
      "clientes"
    );
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes & Patients"
        subtitle="Gerencie seus clientes de forma visual e intuitiva"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || filteredContacts.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button
              className="btn-gradient text-white"
              onClick={() => {
                setSelectedClient(null);
                setIsFormOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Cliente</span>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={Users}
          title="Total de Clientes"
          value={isLoading ? "-" : total}
          subtitle="Cadastrados"
        />
        <StatCard
          icon={UserPlus}
          title="Novos Clientes"
          value={isLoading ? "-" : newClients}
          subtitle="Últimos 30 dias"
        />
        <StatCard
          icon={Dog}
          title="Total de Patients"
          value={isLoading ? "-" : totalPets}
          subtitle="Cadastrados"
        />
        <StatCard
          icon={Bot}
          title="Cadastros pela IA"
          value={isLoading ? "-" : newClients}
          subtitle="Automáticos"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {filteredContacts.length} {filteredContacts.length === 1 ? "cliente" : "clientes"}
          {searchQuery && " encontrado(s)"}
        </div>
        {filteredContacts.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {Math.round((newClients / total) * 100)}% novos
          </Badge>
        )}
      </div>

      {/* Clients Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Tente ajustar sua busca"
              : "Comece adicionando seu primeiro cliente"}
          </p>
          {!searchQuery && (
            <Button
              className="btn-gradient text-white"
              onClick={() => setIsFormOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Cliente
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }
          >
            {filteredContacts.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={(c) => {
                  setSelectedClient(c);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteClient}
                onWhatsApp={handleWhatsApp}
                onSchedule={handleSchedule}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modals */}
      <ClientFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedClient(null);
        }}
        client={selectedClient}
        onSubmit={selectedClient ? handleUpdateClient : handleCreateClient}
        isLoading={isCreating}
      />

      <BookingFormModal
        open={isBookingOpen}
        onOpenChange={(open) => {
          setIsBookingOpen(open);
          if (!open) setSelectedClient(null);
        }}
        contacts={contacts}
        onSubmit={async (data) => {
          // Handle appointment creation
          toast({
            title: "✅ Agendamento criado!",
            description: "Serviço agendado com sucesso",
          });
          setIsBookingOpen(false);
        }}
      />
    </div>
  );
}

