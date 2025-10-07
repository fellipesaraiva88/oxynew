import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Tag } from "lucide-react";
import { useClientTags, ClientTag } from "@/hooks/useClientTags";
import { cn } from "@/lib/utils";

interface ClientTagSelectorProps {
  contactId: string;
  compact?: boolean;
}

const TAG_COLORS = [
  { value: "bg-red-500", label: "Vermelho" },
  { value: "bg-orange-500", label: "Laranja" },
  { value: "bg-yellow-500", label: "Amarelo" },
  { value: "bg-green-500", label: "Verde" },
  { value: "bg-blue-500", label: "Azul" },
  { value: "bg-purple-500", label: "Roxo" },
  { value: "bg-pink-500", label: "Rosa" },
  { value: "bg-gray-500", label: "Cinza" },
];

export function ClientTagSelector({ contactId, compact = false }: ClientTagSelectorProps) {
  const {
    availableTags,
    getClientTags,
    addTagToClient,
    removeTagFromClient,
    createCustomTag,
  } = useClientTags();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState("bg-blue-500");

  const clientTags = getClientTags(contactId);

  const handleToggleTag = (tagId: string) => {
    const hasTag = clientTags.some((tag) => tag.id === tagId);
    if (hasTag) {
      removeTagFromClient(contactId, tagId);
    } else {
      addTagToClient(contactId, tagId);
    }
  };

  const handleCreateTag = () => {
    if (newTagLabel.trim()) {
      const newTag = createCustomTag(newTagLabel.trim(), newTagColor);
      addTagToClient(contactId, newTag.id);
      setNewTagLabel("");
      setNewTagColor("bg-blue-500");
      setShowCreateTag(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-1 flex-wrap">
        {clientTags.slice(0, 2).map((tag) => (
          <Badge
            key={tag.id}
            className={cn(tag.color, "text-white text-xs")}
          >
            {tag.label}
          </Badge>
        ))}
        {clientTags.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{clientTags.length - 2}
          </Badge>
        )}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              <Tag className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Tags do Cliente</h4>

              {!showCreateTag ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = clientTags.some((t) => t.id === tag.id);
                      return (
                        <Badge
                          key={tag.id}
                          className={cn(
                            tag.color,
                            "text-white cursor-pointer hover:opacity-80 transition-opacity",
                            isSelected && "ring-2 ring-white ring-offset-2"
                          )}
                          onClick={() => handleToggleTag(tag.id)}
                        >
                          {tag.label}
                          {isSelected && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowCreateTag(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nova Tag
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="tag-label">Nome da Tag</Label>
                    <Input
                      id="tag-label"
                      value={newTagLabel}
                      onChange={(e) => setNewTagLabel(e.target.value)}
                      placeholder="Ex: Cliente Premium"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Cor</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {TAG_COLORS.map((color) => (
                        <div
                          key={color.value}
                          className={cn(
                            "h-8 rounded cursor-pointer transition-transform hover:scale-110",
                            color.value,
                            newTagColor === color.value && "ring-2 ring-offset-2 ring-primary"
                          )}
                          onClick={() => setNewTagColor(color.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowCreateTag(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleCreateTag}
                      disabled={!newTagLabel.trim()}
                    >
                      Criar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {clientTags.map((tag) => (
        <Badge
          key={tag.id}
          className={cn(tag.color, "text-white")}
        >
          {tag.label}
          <X
            className="w-3 h-3 ml-1 cursor-pointer hover:opacity-70"
            onClick={() => removeTagFromClient(contactId, tag.id)}
          />
        </Badge>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Tags Disponíveis</h4>

            {!showCreateTag ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !clientTags.some((t) => t.id === tag.id))
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        className={cn(
                          tag.color,
                          "text-white cursor-pointer hover:opacity-80 transition-opacity"
                        )}
                        onClick={() => {
                          addTagToClient(contactId, tag.id);
                          setIsOpen(false);
                        }}
                      >
                        {tag.label}
                      </Badge>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCreateTag(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Nova Tag
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="tag-label-full">Nome da Tag</Label>
                  <Input
                    id="tag-label-full"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="Ex: Cliente Premium"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Cor</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {TAG_COLORS.map((color) => (
                      <div
                        key={color.value}
                        className={cn(
                          "h-8 rounded cursor-pointer transition-transform hover:scale-110",
                          color.value,
                          newTagColor === color.value && "ring-2 ring-offset-2 ring-primary"
                        )}
                        onClick={() => setNewTagColor(color.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowCreateTag(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleCreateTag}
                    disabled={!newTagLabel.trim()}
                  >
                    Criar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
