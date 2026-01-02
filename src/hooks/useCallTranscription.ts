import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TranscriptionEntry {
  id: string;
  text: string;
  created_at: string;
}

interface UseCallTranscriptionProps {
  roomDbId: string | null;
  backendUrl?: string;
}

export const useCallTranscription = ({
  roomDbId,
  backendUrl = 'http://localhost:8000',
}: UseCallTranscriptionProps) => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const channel = useRef<RealtimeChannel | null>(null);
  const transcriptionInterval = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to realtime transcriptions
  useEffect(() => {
    if (!roomDbId) return;

    channel.current = supabase
      .channel(`transcriptions-${roomDbId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_transcriptions',
          filter: `room_id=eq.${roomDbId}`,
        },
        (payload) => {
          const newTranscription = payload.new as TranscriptionEntry;
          setTranscriptions((prev) => [...prev, newTranscription]);
        }
      )
      .subscribe();

    return () => {
      if (channel.current) {
        supabase.removeChannel(channel.current);
      }
    };
  }, [roomDbId]);

  const sendTranscriptionToBackend = useCallback(
    async (audioBlob: Blob) => {
      if (!roomDbId) return;

      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        const response = await fetch(`${backendUrl}/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.transcription && data.transcription.trim()) {
            // Save to database for realtime sync
            await supabase.from('call_transcriptions').insert({
              room_id: roomDbId,
              text: data.transcription,
            });
          }
        }
      } catch (error) {
        console.error('Transcription error:', error);
      }
    },
    [roomDbId, backendUrl]
  );

  const startTranscription = useCallback(
    (stream: MediaStream) => {
      if (!stream || !roomDbId) return;

      try {
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.current.onstop = () => {
          if (audioChunks.current.length > 0) {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            sendTranscriptionToBackend(audioBlob);
            audioChunks.current = [];
          }
        };

        // Start recording and send chunks every 5 seconds
        mediaRecorder.current.start();
        setIsTranscribing(true);

        transcriptionInterval.current = setInterval(() => {
          if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            mediaRecorder.current.start();
          }
        }, 5000);
      } catch (error) {
        console.error('Error starting transcription:', error);
      }
    },
    [roomDbId, sendTranscriptionToBackend]
  );

  const stopTranscription = useCallback(() => {
    if (transcriptionInterval.current) {
      clearInterval(transcriptionInterval.current);
      transcriptionInterval.current = null;
    }

    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }

    setIsTranscribing(false);
  }, []);

  const clearTranscriptions = useCallback(() => {
    setTranscriptions([]);
  }, []);

  return {
    transcriptions,
    isTranscribing,
    startTranscription,
    stopTranscription,
    clearTranscriptions,
  };
};
