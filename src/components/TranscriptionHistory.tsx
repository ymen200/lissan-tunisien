import { useState } from "react";
import { History, X, Trash2, Copy, Search, Clock, FileAudio, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export interface TranscriptionItem {
  id: string;
  text: string;
  summary?: string;
  timestamp: Date;
  mode: "file" | "micro" | "conversation";
  fileName?: string;
  speakers?: { id: string; text: string; color: string }[];
}

interface TranscriptionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: TranscriptionItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSelect: (item: TranscriptionItem) => void;
}

const TranscriptionHistory = ({
  isOpen,
  onClose,
  history,
  onDelete,
  onClearAll,
  onSelect,
}: TranscriptionHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "file":
        return <FileAudio className="w-4 h-4" />;
      case "micro":
        return <Mic className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md h-full glass-card border-l border-border animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold neon-text">
              Historique
            </h2>
            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {history.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Tout effacer
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border focus:border-primary"
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">
                {history.length === 0
                  ? "Aucune transcription"
                  : "Aucun résultat"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="group glass-card p-4 cursor-pointer hover:border-primary/50 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => onSelect(item)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                        {getModeIcon(item.mode)}
                        <span className="capitalize">{item.mode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.text);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Content preview */}
                  <p className="text-sm text-foreground/80 line-clamp-3">
                    {item.text}
                  </p>

                  {item.fileName && (
                    <div className="mt-2 text-xs text-primary/70 flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      {item.fileName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default TranscriptionHistory;
