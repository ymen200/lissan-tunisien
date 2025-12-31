import { useState } from "react";
import { TranscriptionItem } from "./TranscriptionHistory";

interface TranscriptionHistoryCSSProps {
  history: TranscriptionItem[];
  onSelect: (item: TranscriptionItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const TranscriptionHistoryCSS = ({
  history,
  onSelect,
  onDelete,
  onClear,
  onClose,
}: TranscriptionHistoryCSSProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "file":
        return <FileIcon />;
      case "micro":
        return <MicIcon />;
      case "conversation":
        return <UsersIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "file":
        return "Fichier";
      case "micro":
        return "Micro";
      case "conversation":
        return "Conversation";
      default:
        return mode;
    }
  };

  const copyText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <>
      <div className="history-overlay" onClick={onClose} />
      <div className="history-sidebar">
        <div className="history-header">
          <h2 className="history-title">Historique</h2>
          <button className="close-button" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="history-search">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="history-empty">
              <p>Aucune transcription trouvée</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() => onSelect(item)}
              >
                <div className="history-item-header">
                  <div className="history-item-mode">
                    {getModeIcon(item.mode)}
                    {getModeLabel(item.mode)}
                  </div>
                  <span className="history-item-time">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <p className="history-item-text">{item.text}</p>
                <div className="history-item-actions">
                  <button
                    className="history-action-btn"
                    onClick={(e) => copyText(item.text, e)}
                  >
                    <CopyIcon />
                    Copier
                  </button>
                  <button
                    className="history-action-btn delete"
                    onClick={(e) => handleDelete(item.id, e)}
                  >
                    <TrashIcon />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="history-footer">
            <button className="clear-all-btn" onClick={onClear}>
              Effacer tout l'historique
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default TranscriptionHistoryCSS;
