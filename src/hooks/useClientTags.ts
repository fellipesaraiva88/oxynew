import { useState, useEffect } from "react";

export interface ClientTag {
  id: string;
  label: string;
  color: string;
}

export interface ClientTags {
  [contactId: string]: string[]; // Array de tag IDs
}

const PREDEFINED_TAGS: ClientTag[] = [
  { id: "vip", label: "VIP", color: "bg-yellow-500" },
  { id: "priority", label: "Prioridade", color: "bg-red-500" },
  { id: "regular", label: "Regular", color: "bg-blue-500" },
  { id: "inactive", label: "Inativo", color: "bg-gray-500" },
  { id: "new", label: "Novo", color: "bg-green-500" },
  { id: "followup", label: "Follow-up", color: "bg-purple-500" },
  { id: "issue", label: "Problema", color: "bg-orange-500" },
];

export function useClientTags() {
  const [clientTags, setClientTags] = useState<ClientTags>(() => {
    const saved = localStorage.getItem("client-tags");
    return saved ? JSON.parse(saved) : {};
  });

  const [availableTags, setAvailableTags] = useState<ClientTag[]>(() => {
    const saved = localStorage.getItem("available-tags");
    return saved ? JSON.parse(saved) : PREDEFINED_TAGS;
  });

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("client-tags", JSON.stringify(clientTags));
  }, [clientTags]);

  useEffect(() => {
    localStorage.setItem("available-tags", JSON.stringify(availableTags));
  }, [availableTags]);

  const addTagToClient = (contactId: string, tagId: string) => {
    setClientTags((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), tagId],
    }));
  };

  const removeTagFromClient = (contactId: string, tagId: string) => {
    setClientTags((prev) => ({
      ...prev,
      [contactId]: (prev[contactId] || []).filter((id) => id !== tagId),
    }));
  };

  const getClientTags = (contactId: string): ClientTag[] => {
    const tagIds = clientTags[contactId] || [];
    return tagIds
      .map((id) => availableTags.find((tag) => tag.id === id))
      .filter((tag): tag is ClientTag => tag !== undefined);
  };

  const createCustomTag = (label: string, color: string) => {
    const newTag: ClientTag = {
      id: `custom-${Date.now()}`,
      label,
      color,
    };
    setAvailableTags((prev) => [...prev, newTag]);
    return newTag;
  };

  const deleteCustomTag = (tagId: string) => {
    // Remover dos clientes
    setClientTags((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((contactId) => {
        updated[contactId] = updated[contactId].filter((id) => id !== tagId);
      });
      return updated;
    });

    // Remover da lista de tags disponíveis
    setAvailableTags((prev) => prev.filter((tag) => tag.id !== tagId));
  };

  return {
    clientTags,
    availableTags,
    addTagToClient,
    removeTagFromClient,
    getClientTags,
    createCustomTag,
    deleteCustomTag,
  };
}
