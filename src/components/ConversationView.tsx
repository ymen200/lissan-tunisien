import { User } from "lucide-react";

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

export interface ConversationSegment {
  speakerId: string;
  text: string;
  startTime?: number;
  endTime?: number;
}

interface ConversationViewProps {
  segments: ConversationSegment[];
  speakers: Speaker[];
}

const SPEAKER_COLORS = [
  { bg: "bg-primary/20", border: "border-primary/50", text: "text-primary" },
  { bg: "bg-secondary/20", border: "border-secondary/50", text: "text-secondary" },
  { bg: "bg-accent/20", border: "border-accent/50", text: "text-accent" },
  { bg: "bg-neon-green/20", border: "border-neon-green/50", text: "text-neon-green" },
];

const ConversationView = ({ segments, speakers }: ConversationViewProps) => {
  const getSpeakerStyle = (speakerId: string) => {
    const index = speakers.findIndex((s) => s.id === speakerId);
    return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
  };

  const getSpeakerName = (speakerId: string) => {
    const speaker = speakers.find((s) => s.id === speakerId);
    return speaker?.name || `Locuteur ${speakerId}`;
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <User className="w-8 h-8" />
        </div>
        <p className="text-sm">Aucune conversation détectée</p>
        <p className="text-xs mt-1">La diarisation identifiera les locuteurs automatiquement</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Speaker Legend */}
      <div className="flex flex-wrap gap-3 p-3 glass-card rounded-lg">
        {speakers.map((speaker, index) => {
          const style = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
          return (
            <div
              key={speaker.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} border ${style.border}`}
            >
              <div className={`w-3 h-3 rounded-full ${style.text} bg-current`} />
              <span className={`text-sm font-medium ${style.text}`}>
                {speaker.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conversation Timeline */}
      <div className="space-y-3">
        {segments.map((segment, index) => {
          const style = getSpeakerStyle(segment.speakerId);
          const isLeft = speakers.findIndex((s) => s.id === segment.speakerId) % 2 === 0;

          return (
            <div
              key={index}
              className={`flex ${isLeft ? "justify-start" : "justify-end"} animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${style.bg} border ${style.border} ${
                  isLeft ? "rounded-bl-none" : "rounded-br-none"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full ${style.bg} border ${style.border} flex items-center justify-center`}>
                    <User className={`w-3 h-3 ${style.text}`} />
                  </div>
                  <span className={`text-sm font-semibold ${style.text}`}>
                    {getSpeakerName(segment.speakerId)}
                  </span>
                  {segment.startTime !== undefined && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTime(segment.startTime)}
                    </span>
                  )}
                </div>
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {segment.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statistics */}
      {speakers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {speakers.map((speaker, index) => {
            const style = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
            const speakerSegments = segments.filter(
              (s) => s.speakerId === speaker.id
            );
            const wordCount = speakerSegments
              .map((s) => s.text.split(" ").length)
              .reduce((a, b) => a + b, 0);

            return (
              <div
                key={speaker.id}
                className={`glass-card p-3 rounded-lg border ${style.border}`}
              >
                <div className={`text-xs ${style.text} font-medium mb-1`}>
                  {speaker.name}
                </div>
                <div className="text-lg font-display font-bold text-foreground">
                  {speakerSegments.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  interventions • {wordCount} mots
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationView;
