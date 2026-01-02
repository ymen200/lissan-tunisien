import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CallRoom from '@/components/CallRoom';
import { Phone, Video, ArrowLeft } from 'lucide-react';
import '../styles/call.css';

const CallPage = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
  };

  const handleStartCall = (videoCall: boolean) => {
    if (!roomCode.trim()) {
      generateRoomCode();
    }
    setIsVideo(videoCall);
    setIsInCall(true);
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setRoomCode('');
  };

  if (isInCall) {
    return <CallRoom roomCode={roomCode} isVideo={isVideo} onLeave={handleLeaveCall} />;
  }

  return (
    <div className="call-page">
      <div className="call-page-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="call-page-content">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="call-setup-card">
          <h1 className="call-title">Appel avec Transcription</h1>
          <p className="call-subtitle">
            Lancez un appel audio ou vidéo avec transcription en temps réel
          </p>

          <div className="room-input-section">
            <label className="input-label">Code de salle</label>
            <div className="room-input-group">
              <input
                type="text"
                className="room-input"
                placeholder="Ex: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="generate-button" onClick={generateRoomCode}>
                Générer
              </button>
            </div>
            <p className="input-hint">
              Créez un nouveau code ou entrez un code existant pour rejoindre
            </p>
          </div>

          <div className="call-type-section">
            <button className="call-type-button audio" onClick={() => handleStartCall(false)}>
              <Phone size={32} />
              <span className="call-type-label">Appel Audio</span>
              <span className="call-type-desc">Voix uniquement</span>
            </button>
            <button className="call-type-button video" onClick={() => handleStartCall(true)}>
              <Video size={32} />
              <span className="call-type-label">Appel Vidéo</span>
              <span className="call-type-desc">Avec caméra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
