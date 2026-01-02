import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCallTranscription } from '@/hooks/useCallTranscription';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Copy, Check } from 'lucide-react';
import '../styles/call.css';

interface CallRoomProps {
  roomCode: string;
  isVideo: boolean;
  onLeave: () => void;
}

const CallRoom = ({ roomCode, isVideo, onLeave }: CallRoomProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [copied, setCopied] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerId = useRef(Math.random().toString(36).substring(7));
  const roomDbIdRef = useRef<string | null>(null);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const handleLocalStream = useCallback((stream: MediaStream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const {
    isConnected,
    isConnecting,
    startCall,
    endCall,
    localStream,
    roomDbId,
  } = useWebRTC({
    roomId: roomCode,
    peerId: peerId.current,
    onRemoteStream: handleRemoteStream,
    onLocalStream: handleLocalStream,
    audioOnly: !isVideo,
  });

  // Update roomDbIdRef when roomDbId changes
  useEffect(() => {
    if (roomDbId.current) {
      roomDbIdRef.current = roomDbId.current;
    }
  }, [roomDbId.current]);

  const {
    transcriptions,
    isTranscribing,
    startTranscription,
    stopTranscription,
  } = useCallTranscription({
    roomDbId: roomDbIdRef.current,
  });

  const handleJoinCall = async (isInitiator: boolean) => {
    try {
      await startCall(isInitiator);
      setHasJoined(true);
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  };

  const handleLeaveCall = () => {
    stopTranscription();
    endCall();
    onLeave();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start transcription when connected
  useEffect(() => {
    if (isConnected && localStream && roomDbIdRef.current && !isTranscribing) {
      startTranscription(localStream);
    }
  }, [isConnected, localStream, startTranscription, isTranscribing]);

  const transcriptRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptions]);

  if (!hasJoined) {
    return (
      <div className="call-lobby">
        <div className="lobby-card">
          <h2 className="lobby-title">Rejoindre l'appel</h2>
          <div className="room-code-display">
            <span className="room-code-label">Code de salle</span>
            <div className="room-code-value">
              <span>{roomCode}</span>
              <button className="copy-button" onClick={copyRoomCode}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <p className="lobby-hint">Partagez ce code avec la personne que vous souhaitez appeler</p>
          <div className="lobby-actions">
            <button className="btn btn-primary" onClick={() => handleJoinCall(true)}>
              <Phone size={20} />
              Créer l'appel
            </button>
            <button className="btn btn-secondary" onClick={() => handleJoinCall(false)}>
              <Phone size={20} />
              Rejoindre
            </button>
          </div>
          <button className="btn btn-cancel" onClick={onLeave}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-room">
      <div className="call-header">
        <div className="room-info">
          <span className="room-label">Salle:</span>
          <span className="room-code">{roomCode}</span>
          <button className="copy-button-small" onClick={copyRoomCode}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className={`connection-status ${isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Connecté' : isConnecting ? 'Connexion...' : 'Déconnecté'}
        </div>
      </div>

      <div className="call-content">
        <div className="video-area">
          {isVideo ? (
            <>
              <div className="remote-video-container">
                <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                {!isConnected && (
                  <div className="video-placeholder">
                    <span>En attente de l'autre participant...</span>
                  </div>
                )}
              </div>
              <div className="local-video-container">
                <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
              </div>
            </>
          ) : (
            <div className="audio-only-display">
              <div className="audio-avatar remote">
                <span>{isConnected ? '👤' : '...'}</span>
              </div>
              <div className="audio-avatar local">
                <span>Vous</span>
              </div>
              <audio ref={remoteVideoRef as React.RefObject<HTMLAudioElement>} autoPlay />
            </div>
          )}
        </div>

        <div className="transcription-panel">
          <div className="panel-header">
            <h3>Transcription en direct</h3>
            {isTranscribing && <span className="live-indicator">● LIVE</span>}
          </div>
          <div className="transcription-content" ref={transcriptRef}>
            {transcriptions.length === 0 ? (
              <p className="no-transcription">La transcription apparaîtra ici...</p>
            ) : (
              transcriptions.map((t) => (
                <div key={t.id} className="transcription-entry">
                  <span className="transcription-time">
                    {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="transcription-text">{t.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="call-controls">
        <button className={`control-button ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        {isVideo && (
          <button className={`control-button ${!isVideoEnabled ? 'active' : ''}`} onClick={toggleVideo}>
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        )}
        <button className="control-button end-call" onClick={handleLeaveCall}>
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default CallRoom;
