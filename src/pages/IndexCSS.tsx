import { useState, useRef, useEffect } from "react";
import "../styles/main.css";
import ParticleBackground from "@/components/ParticleBackground";
import AudioVisualizerCSS from "@/components/AudioVisualizerCSS";
import TranscriptionHistoryCSS from "@/components/TranscriptionHistoryCSS";
import ConversationViewCSS from "@/components/ConversationViewCSS";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTranscriptionHistory } from "@/hooks/useTranscriptionHistory";
import { TranscriptionItem } from "@/components/TranscriptionHistory";
import { toast } from "sonner";

// Icons as simple SVG components
const RadioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" />
    <path d="M4.93 4.93a10 10 0 0 0 14.14 14.14" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M7.76 7.76a6 6 0 0 0 8.48 8.48" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" x2="22" y1="2" y2="22" />
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
    <path d="M5 10v2a7 7 0 0 0 12 5" />
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M3 5h4" />
    <path d="M19 17v4" />
    <path d="M17 19h4" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

interface Speaker {
  id: string;
  name: string;
  color: string;
}

interface ConversationSegment {
  speakerId: string;
  text: string;
  startTime: number;
  endTime: number;
}

const IndexCSS = () => {
  const [mode, setMode] = useState<"file" | "micro" | "conversation">("file");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [diarizationEnabled, setDiarizationEnabled] = useState(false);
  const [conversationSegments, setConversationSegments] = useState<ConversationSegment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isRecording, analyzerNode, startRecording, stopRecording } = useAudioRecorder();
  const { history, addToHistory, deleteFromHistory, clearHistory } = useTranscriptionHistory();

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update audio level from analyzer
  useEffect(() => {
    if (isRecording && analyzerNode) {
      const dataArray = new Uint8Array(analyzerNode.frequencyBinCount);
      
      levelIntervalRef.current = setInterval(() => {
        analyzerNode.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel((average / 255) * 100);
      }, 50);
    } else {
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
    };
  }, [isRecording, analyzerNode]);

  // Duration counter
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranscript("");
      setSummary("");
      setConversationSegments([]);
      setSpeakers([]);
    }
  };

  const handleFileTranscribe = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setTranscript("");
    setSummary("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8000/transcribe-file/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur de transcription");

      const data = await response.json();
      setTranscript(data.transcript);
      setSummary(data.summary || "");

      if (mode === "conversation" && diarizationEnabled) {
        const mockSegments = generateMockDiarization(data.transcript);
        setConversationSegments(mockSegments.segments);
        setSpeakers(mockSegments.speakers);
      }

      addToHistory({
        text: data.transcript,
        summary: data.summary,
        mode: mode,
        fileName: selectedFile.name,
      });

      toast.success("Transcription terminée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la transcription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setTranscript("");
      setSummary("");
      setConversationSegments([]);
      setSpeakers([]);
      toast.success("Enregistrement démarré");
    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const handleCancelRecording = async () => {
    await stopRecording();
    setTranscript("");
    setSummary("");
    setRecordingDuration(0);
    toast.info("Enregistrement annulé");
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    const blob = await stopRecording();

    if (!blob) {
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");

      const response = await fetch("http://localhost:8000/transcribe-file/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur de transcription");

      const data = await response.json();
      setTranscript(data.transcript);

      addToHistory({
        text: data.transcript,
        mode: "micro",
      });

      toast.success("Transcription terminée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la transcription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: TranscriptionItem) => {
    setTranscript(item.text);
    setSummary(item.summary || "");
    setIsHistoryOpen(false);
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    toast.success("Copié dans le presse-papiers");
  };

  const generateMockDiarization = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const mockSpeakers: Speaker[] = [
      { id: "1", name: "Locuteur 1", color: "cyan" },
      { id: "2", name: "Locuteur 2", color: "purple" },
    ];

    const segments: ConversationSegment[] = sentences.map((sentence, i) => ({
      speakerId: i % 2 === 0 ? "1" : "2",
      text: sentence.trim(),
      startTime: i * 5,
      endTime: (i + 1) * 5,
    }));

    return { speakers: mockSpeakers, segments };
  };

  return (
    <div className="app-container">
      <ParticleBackground />
      <div className="grid-background" />

      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-logo">
            <div className="logo-icon">
              <RadioIcon />
            </div>
            <h1 className="header-title">ASR TUNISIEN</h1>
          </div>
          <p className="header-subtitle">
            Reconnaissance vocale automatique pour le dialecte tunisien
          </p>
        </header>

        {/* History Button */}
        <button className="history-button" onClick={() => setIsHistoryOpen(true)}>
          <HistoryIcon />
          Historique
          {history.length > 0 && (
            <span className="history-badge">{history.length}</span>
          )}
        </button>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === "file" ? "active" : ""}`}
            onClick={() => setMode("file")}
          >
            <FileIcon />
            Fichier
          </button>
          <button
            className={`mode-tab ${mode === "micro" ? "active" : ""}`}
            onClick={() => setMode("micro")}
          >
            <MicIcon />
            Micro Live
          </button>
          <button
            className={`mode-tab ${mode === "conversation" ? "active" : ""}`}
            onClick={() => setMode("conversation")}
          >
            <UsersIcon />
            Conversation
          </button>
        </div>

        {/* File Mode */}
        {mode === "file" && (
          <div className="tab-content">
            <div className="glass-card card-section">
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden-input"
                />
                <button
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  <div className="upload-button-text">
                    <p>Charger un fichier audio</p>
                    <p>WAV, MP3, M4A...</p>
                  </div>
                </button>

                {selectedFile && (
                  <div className="file-info">
                    <div className="file-details">
                      <p className="file-name">{selectedFile.name}</p>
                      <p className="file-size">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleFileTranscribe}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="spinner" style={{ width: 20, height: 20 }} />
                      ) : (
                        <>
                          <SparklesIcon />
                          Transcrire
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Micro Mode */}
        {mode === "micro" && (
          <div className="tab-content">
            <div className="glass-card card-section">
              <div className="recording-section">
                {/* Duration Counter */}
                {isRecording && (
                  <div className="duration-counter">
                    <span className="duration-dot" />
                    {formatDuration(recordingDuration)}
                  </div>
                )}

                <div className="record-button-container">
                  {isRecording && (
                    <>
                      <div className="pulse-ring" />
                      <div className="pulse-ring" />
                    </>
                  )}
                  <button
                    className={`record-button ${isRecording ? "recording" : ""}`}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isLoading && !isRecording}
                  >
                    {isLoading ? (
                      <div className="spinner" />
                    ) : isRecording ? (
                      <MicOffIcon />
                    ) : (
                      <MicIcon />
                    )}
                  </button>
                </div>

                {/* Cancel Button */}
                {isRecording && (
                  <button className="btn btn-cancel" onClick={handleCancelRecording}>
                    Annuler
                  </button>
                )}

                <p className="recording-text">
                  {isRecording
                    ? "Cliquez pour arrêter l'enregistrement"
                    : "Cliquez pour commencer l'enregistrement"}
                </p>

                {/* VU Meter */}
                <div className="vu-meter-container">
                  <div className="vu-meter">
                    <div 
                      className="vu-meter-fill"
                      style={{ 
                        width: `${audioLevel}%`,
                        background: audioLevel > 80 
                          ? 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)' 
                          : audioLevel > 50 
                            ? 'linear-gradient(90deg, #22c55e, #eab308)' 
                            : '#22c55e'
                      }}
                    />
                    <div className="vu-meter-markers">
                      <span>0</span>
                      <span className="marker-yellow">-12</span>
                      <span className="marker-red">0 dB</span>
                    </div>
                  </div>
                  <div className="vu-meter-level">
                    {Math.round(audioLevel)}%
                  </div>
                </div>

                <div className="visualizer-container">
                  <AudioVisualizerCSS isActive={isRecording} analyzerNode={analyzerNode} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Mode */}
        {mode === "conversation" && (
          <div className="tab-content">
            <div className="glass-card card-section">
              <div className="diarization-toggle">
                <div className="diarization-info">
                  <UsersIcon />
                  <div className="diarization-text">
                    <h4>Identification des locuteurs</h4>
                    <p>Détecte automatiquement les différents intervenants</p>
                  </div>
                </div>
                <div
                  className={`toggle-switch ${diarizationEnabled ? "active" : ""}`}
                  onClick={() => setDiarizationEnabled(!diarizationEnabled)}
                />
              </div>

              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden-input"
                />
                <button
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  <span>Charger un enregistrement de conversation</span>
                </button>

                {selectedFile && (
                  <div className="file-info">
                    <div className="file-details">
                      <p className="file-name" style={{ color: "var(--color-secondary)" }}>
                        {selectedFile.name}
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={handleFileTranscribe}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="spinner" style={{ width: 20, height: 20 }} />
                      ) : (
                        <>
                          <SparklesIcon />
                          Analyser
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {(transcript || isLoading) && (
          <div className="results-section">
            {/* Transcription Card */}
            <div className="glass-card result-card transcription-card">
              <div className="result-header">
                <div className="result-title">
                  <SparklesIcon />
                  <span>Transcription</span>
                  {transcript && (
                    <span className="word-count">{transcript.split(/\s+/).filter(Boolean).length} mots</span>
                  )}
                </div>
                {transcript && (
                  <button className="btn btn-ghost" onClick={copyTranscript}>
                    <CopyIcon />
                    Copier
                  </button>
                )}
              </div>
              <div className="result-content" ref={transcriptRef}>
                {isLoading ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>Transcription en cours...</p>
                  </div>
                ) : mode === "conversation" && diarizationEnabled && conversationSegments.length > 0 ? (
                  <ConversationViewCSS segments={conversationSegments} speakers={speakers} />
                ) : (
                  <div className="transcript-display">
                    <p className="result-text">{transcript}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Card */}
            {summary && (
              <div className="glass-card result-card summary-card">
                <div className="result-header">
                  <div className="result-title">
                    <SparklesIcon />
                    <span>Résumé</span>
                  </div>
                </div>
                <div className="result-content summary-content">
                  <div className="summary-display">
                    <div className="summary-icon">💡</div>
                    <p className="summary-text">{summary}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Sidebar */}
      {isHistoryOpen && (
        <TranscriptionHistoryCSS
          history={history}
          onSelect={handleHistorySelect}
          onDelete={deleteFromHistory}
          onClear={clearHistory}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  );
};

export default IndexCSS;
