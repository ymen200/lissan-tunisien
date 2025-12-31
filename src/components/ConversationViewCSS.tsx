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

interface ConversationViewCSSProps {
  segments: ConversationSegment[];
  speakers: Speaker[];
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const ConversationViewCSS = ({ segments, speakers }: ConversationViewCSSProps) => {
  const getSpeaker = (id: string) => speakers.find((s) => s.id === id);

  return (
    <div className="conversation-timeline">
      {segments.map((segment, index) => {
        const speaker = getSpeaker(segment.speakerId);
        const colorClass = speaker?.color === "cyan" ? "cyan" : "purple";

        return (
          <div
            key={index}
            className={`conversation-segment ${segment.speakerId === "2" ? "speaker-2" : ""}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`speaker-avatar ${colorClass}`}>
              {speaker?.name.charAt(0) || "?"}
            </div>
            <div className="segment-content">
              <div className="segment-header">
                <span className={`speaker-name ${colorClass}`}>
                  {speaker?.name || "Inconnu"}
                </span>
                <span className="segment-time">
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </span>
              </div>
              <p className="segment-text">{segment.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationViewCSS;
