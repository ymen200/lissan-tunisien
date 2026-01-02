import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Json } from '@/integrations/supabase/types';

interface UseWebRTCProps {
  roomId: string;
  peerId: string;
  onRemoteStream: (stream: MediaStream) => void;
  onLocalStream: (stream: MediaStream) => void;
  audioOnly?: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = ({
  roomId,
  peerId,
  onRemoteStream,
  onLocalStream,
  audioOnly = true,
}: UseWebRTCProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const roomDbId = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (channel.current) {
      supabase.removeChannel(channel.current);
      channel.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendSignal = useCallback(
    async (signalType: string, signalData: object) => {
      if (!roomDbId.current) return;

      await supabase.from('call_signals').insert([{
        room_id: roomDbId.current,
        sender_id: peerId,
        signal_type: signalType,
        signal_data: signalData as Json,
      }]);
    },
    [peerId]
  );

  const handleSignal = useCallback(
    async (payload: { new: { sender_id: string; signal_type: string; signal_data: object } }) => {
      const { sender_id, signal_type, signal_data } = payload.new;

      if (sender_id === peerId || !peerConnection.current) return;

      console.log('Received signal:', signal_type);

      try {
        if (signal_type === 'offer') {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(signal_data as RTCSessionDescriptionInit)
          );
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          await sendSignal('answer', answer);
        } else if (signal_type === 'answer') {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(signal_data as RTCSessionDescriptionInit)
          );
        } else if (signal_type === 'ice-candidate') {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(signal_data as RTCIceCandidateInit)
          );
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    },
    [peerId, sendSignal]
  );

  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote track received');
      onRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    return pc;
  }, [onRemoteStream, sendSignal]);

  const startCall = useCallback(
    async (isInitiator: boolean) => {
      setIsConnecting(true);

      try {
        // Get or create room
        let roomData = await supabase
          .from('call_rooms')
          .select('id')
          .eq('room_code', roomId)
          .maybeSingle();

        if (!roomData.data) {
          const { data: newRoom } = await supabase
            .from('call_rooms')
            .insert({ room_code: roomId })
            .select('id')
            .single();
          roomDbId.current = newRoom?.id || null;
        } else {
          roomDbId.current = roomData.data.id;
        }

        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: !audioOnly,
        });
        localStream.current = stream;
        onLocalStream(stream);

        // Initialize peer connection
        peerConnection.current = initializePeerConnection();

        // Add tracks
        stream.getTracks().forEach((track) => {
          peerConnection.current!.addTrack(track, stream);
        });

        // Subscribe to signals
        channel.current = supabase
          .channel(`room-${roomId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'call_signals',
              filter: `room_id=eq.${roomDbId.current}`,
            },
            handleSignal as (payload: unknown) => void
          )
          .subscribe();

        // If initiator, create offer
        if (isInitiator) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await sendSignal('offer', offer);
        }
      } catch (error) {
        console.error('Error starting call:', error);
        cleanup();
        throw error;
      }
    },
    [roomId, audioOnly, onLocalStream, initializePeerConnection, handleSignal, sendSignal, cleanup]
  );

  const endCall = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    startCall,
    endCall,
    localStream: localStream.current,
    peerConnection: peerConnection.current,
    roomDbId,
  };
};
