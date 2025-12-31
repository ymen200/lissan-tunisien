import { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  MicOff, 
  FileAudio, 
  Upload, 
  History, 
  Users, 
  Sparkles,
  Copy,
  Loader2,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ParticleBackground from "@/components/ParticleBackground";
import AudioVisualizer from "@/components/AudioVisualizer";
import TranscriptionHistory, { TranscriptionItem } from "@/components/TranscriptionHistory";
import ConversationView, { Speaker, ConversationSegment } from "@/components/ConversationView";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTranscriptionHistory } from "@/hooks/useTranscriptionHistory";

const Index = () => {
  const [mode, setMode] = useState<"file" | "micro" | "conversation">("file");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [diarizationEnabled, setDiarizationEnabled] = useState(false);
  const [conversationSegments, setConversationSegments] = useState<ConversationSegment[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const { isRecording, analyzerNode, startRecording, stopRecording } = useAudioRecorder();
  const { history, addToHistory, deleteFromHistory, clearHistory } = useTranscriptionHistory();

  // Auto-scroll transcript
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

      // Handle conversation mode with mock diarization
      if (mode === "conversation" && diarizationEnabled) {
        // Mock diarization - in real app, this would come from backend
        const mockSegments = generateMockDiarization(data.transcript);
        setConversationSegments(mockSegments.segments);
        setSpeakers(mockSegments.speakers);
      }

      // Add to history
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
      toast.success("Enregistrement démarré");
    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
    }
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

  // Mock diarization for demo
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Radio className="w-12 h-12 text-primary animate-pulse-glow" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wider neon-text">
              ASR TUNISIEN
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Reconnaissance vocale automatique pour le dialecte tunisien
          </p>
        </header>

        {/* History button */}
        <Button
          variant="outline"
          className="fixed top-4 right-4 z-50 glass-card border-primary/30 hover:border-primary/60 hover:box-glow-cyan"
          onClick={() => setIsHistoryOpen(true)}
        >
          <History className="w-4 h-4 mr-2" />
          Historique
          {history.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {history.length}
            </span>
          )}
        </Button>

        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="mb-8">
          <TabsList className="grid grid-cols-3 gap-2 bg-muted/50 p-1 glass-card">
            <TabsTrigger 
              value="file" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:box-glow-cyan font-semibold"
            >
              <FileAudio className="w-4 h-4 mr-2" />
              Fichier
            </TabsTrigger>
            <TabsTrigger 
              value="micro"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:box-glow-cyan font-semibold"
            >
              <Mic className="w-4 h-4 mr-2" />
              Micro Live
            </TabsTrigger>
            <TabsTrigger 
              value="conversation"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:box-glow-cyan font-semibold"
            >
              <Users className="w-4 h-4 mr-2" />
              Conversation
            </TabsTrigger>
          </TabsList>

          {/* File upload tab */}
          <TabsContent value="file" className="mt-6 animate-fade-in">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full md:w-auto border-dashed border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 h-24 px-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 mr-3 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Charger un fichier audio</p>
                      <p className="text-xs text-muted-foreground">WAV, MP3, M4A...</p>
                    </div>
                  </Button>

                  {selectedFile && (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1 p-3 glass-card rounded-lg">
                        <p className="text-sm font-medium text-primary truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        onClick={handleFileTranscribe}
                        disabled={isLoading}
                        className="btn-neon h-12"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Transcrire
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Microphone tab */}
          <TabsContent value="micro" className="mt-6 animate-fade-in">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-6">
                  {/* Recording button */}
                  <div className="relative">
                    {isRecording && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse-ring" />
                        <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                      </>
                    )}
                    <Button
                      size="lg"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      disabled={isLoading}
                      className={`w-24 h-24 rounded-full transition-all duration-300 ${
                        isRecording ? "btn-recording" : "btn-neon"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-10 h-10 animate-spin" />
                      ) : isRecording ? (
                        <MicOff className="w-10 h-10" />
                      ) : (
                        <Mic className="w-10 h-10" />
                      )}
                    </Button>
                  </div>

                  <p className="text-muted-foreground">
                    {isRecording
                      ? "Cliquez pour arrêter l'enregistrement"
                      : "Cliquez pour commencer l'enregistrement"}
                  </p>

                  {/* Audio visualizer */}
                  <div className="w-full max-w-md">
                    <AudioVisualizer isActive={isRecording} analyzerNode={analyzerNode} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversation tab */}
          <TabsContent value="conversation" className="mt-6 animate-fade-in">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-6">
                  {/* Diarization toggle */}
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-secondary" />
                      <div>
                        <Label className="font-semibold">Identification des locuteurs</Label>
                        <p className="text-xs text-muted-foreground">
                          Détecte automatiquement les différents intervenants
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={diarizationEnabled}
                      onCheckedChange={setDiarizationEnabled}
                    />
                  </div>

                  {/* File input for conversation */}
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full md:w-auto border-dashed border-2 border-secondary/30 hover:border-secondary/60 hover:bg-secondary/5 h-20 px-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 mr-3 text-secondary" />
                      <span>Charger un enregistrement de conversation</span>
                    </Button>

                    {selectedFile && (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1 p-3 glass-card rounded-lg">
                          <p className="text-sm font-medium text-secondary truncate">
                            {selectedFile.name}
                          </p>
                        </div>
                        <Button
                          onClick={handleFileTranscribe}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground hover:opacity-90"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Analyser
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results section */}
        {(transcript || isLoading) && (
          <div className="space-y-6 animate-fade-in">
            {/* Transcription card */}
            <Card className="glass-card border-border/50 neon-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-xl text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Transcription
                </CardTitle>
                {transcript && (
                  <Button variant="ghost" size="sm" onClick={copyTranscript}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48" ref={transcriptRef}>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-muted-foreground">Transcription en cours...</p>
                      </div>
                    </div>
                  ) : mode === "conversation" && diarizationEnabled && conversationSegments.length > 0 ? (
                    <ConversationView segments={conversationSegments} speakers={speakers} />
                  ) : (
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {transcript}
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Summary card */}
            {summary && (
              <Card className="glass-card border-secondary/30 box-glow-purple">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-xl text-secondary flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Résumé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 leading-relaxed">{summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state */}
        {!transcript && !isLoading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
              <Radio className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl text-muted-foreground mb-2">
              Prêt à transcrire
            </h3>
            <p className="text-sm text-muted-foreground/70">
              Chargez un fichier audio ou utilisez le microphone pour commencer
            </p>
          </div>
        )}
      </div>

      {/* History sidebar */}
      <TranscriptionHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDelete={deleteFromHistory}
        onClearAll={clearHistory}
        onSelect={handleHistorySelect}
      />
    </div>
  );
};

export default Index;
