import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { ref, onUnmounted } from 'vue';

export interface PeerStatus {
    recording: boolean;
    urls: string[];
    tracks: number;
    active_recorders?: number;
}

export interface PeerCommand {
    action: 'start' | 'stop' | 'add_url' | 'remove_url' | 'list_urls' | 'status';
    url?: string;
}

export interface PeerResponse {
    status: 'ok' | 'error';
    action?: string;
    urls?: string[];
    recording?: boolean;
    tracks?: number;
    active_recorders?: number;
    error?: string;
}

export function usePeerJS() {
    const peer = ref<Peer | null>(null);
    const peerId = ref<string>('');
    const dataConnection = ref<DataConnection | null>(null);
    const mediaConnection = ref<MediaConnection | null>(null);
    const isConnected = ref(false);
    const isConnecting = ref(false);
    const lastStatus = ref<PeerStatus | null>(null);
    const error = ref<string | null>(null);

    const initialize = (config?: { host?: string; port?: number; path?: string }) => {
        if (peer.value) return;

        try {
            peer.value = new Peer(config);

            peer.value.on('open', (id) => {
                peerId.value = id;
                console.log('[PeerJS] Initialized with ID:', id);
            });

            peer.value.on('connection', (conn) => {
                console.log('[PeerJS] Incoming connection from:', conn.peer);
                // Handle incoming data connections
                conn.on('open', () => {
                    console.log('[PeerJS] Incoming connection opened');
                });
                conn.on('data', (data) => {
                    console.log('[PeerJS] Data from incoming connection:', data);
                });
            });

            peer.value.on('call', (call) => {
                console.log('[PeerJS] Incoming call from:', call.peer);
                // This shouldn't happen in our architecture, but log it
            });

            peer.value.on('error', (err) => {
                error.value = err.message;
                console.error('[PeerJS] Error:', err);
            });

            peer.value.on('disconnected', () => {
                isConnected.value = false;
                console.log('[PeerJS] Disconnected from signaling server');
                // Try to reconnect
                if (peer.value && !peer.value.destroyed) {
                    console.log('[PeerJS] Attempting to reconnect...');
                    peer.value.reconnect();
                }
            });

            peer.value.on('close', () => {
                console.log('[PeerJS] Peer connection closed');
            });
        } catch (err: any) {
            error.value = err.message;
            console.error('Failed to initialize PeerJS:', err);
        }
    };

    const connect = async (receiverPeerId: string) => {
        console.log('[connect] Called with receiverPeerId:', receiverPeerId);
        console.log('[connect] Current peer:', peer.value);

        if (!peer.value) {
            error.value = 'Peer not initialized';
            console.error('[connect] Peer not initialized');
            return false;
        }

        isConnecting.value = true;
        error.value = null;

        // Note: We don't create a separate data connection here
        // The data channel will be added when we call sendMediaStream
        console.log('[connect] Ready to connect (will establish connection when media is sent)');
        return true;
    };

    const sendMediaStream = (stream: MediaStream, receiverPeerId: string) => {
        console.log('[sendMediaStream] Called with:', {
            hasPeer: !!peer.value,
            receiverPeerId,
            streamTracks: stream.getTracks().length,
        });

        if (!peer.value) {
            error.value = 'Peer not initialized';
            console.error('[sendMediaStream] Peer not initialized');
            return false;
        }

        try {
            console.log('[sendMediaStream] Calling peer.call()...');
            mediaConnection.value = peer.value.call(receiverPeerId, stream, {
                metadata: { type: 'media-with-data' }
            });
            console.log('[sendMediaStream] peer.call() returned:', mediaConnection.value);

            // Get the underlying RTCPeerConnection immediately
            const pc = (mediaConnection.value as any).peerConnection as RTCPeerConnection;
            console.log('[sendMediaStream] Got underlying RTCPeerConnection:', pc);
            console.log('[sendMediaStream] Connection state:', pc.connectionState);
            console.log('[sendMediaStream] ICE connection state:', pc.iceConnectionState);
            console.log('[sendMediaStream] Signaling state:', pc.signalingState);
            
            // Monitor signaling state to see when answer arrives
            pc.onsignalingstatechange = () => {
                console.log('[sendMediaStream] Signaling state changed to:', pc.signalingState);
                console.log('[sendMediaStream] Remote description:', pc.remoteDescription);
            };
            
            // Monitor connection state changes
            pc.onconnectionstatechange = () => {
                console.log('[sendMediaStream] PC connection state changed to:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    console.log('[sendMediaStream] WebRTC connection fully established!');
                }
            };
            
            pc.oniceconnectionstatechange = () => {
                console.log('[sendMediaStream] ICE connection state changed to:', pc.iceConnectionState);
            };
            
            // Listen for incoming data channel from the backend
            pc.ondatachannel = (event) => {
                console.log('[sendMediaStream] Received data channel from backend:', event.channel);
                const dataChannel = event.channel;
                
                dataChannel.onopen = () => {
                    console.log('[sendMediaStream] Backend data channel opened!');
                    isConnected.value = true;
                    isConnecting.value = false;
                };
                
                dataChannel.onmessage = (event) => {
                    console.log('[sendMediaStream] Data channel message:', event.data);
                    try {
                        const data = JSON.parse(event.data);
                        handleResponse(data as PeerResponse);
                    } catch (err) {
                        console.error('[sendMediaStream] Failed to parse data channel message:', err);
                    }
                };
                
                dataChannel.onclose = () => {
                    console.log('[sendMediaStream] Data channel closed');
                    isConnected.value = false;
                };
                
                dataChannel.onerror = (err) => {
                    console.error('[sendMediaStream] Data channel error:', err);
                    error.value = 'Data channel error';
                };
                
                // Store a reference to the data channel
                (mediaConnection.value as any).dataChannel = dataChannel;
            };

            mediaConnection.value.on('stream', (remoteStream) => {
                console.log('[sendMediaStream] Received remote stream:', remoteStream);
            });

            mediaConnection.value.on('close', () => {
                console.log('[sendMediaStream] Media connection closed');
                isConnected.value = false;
            });

            mediaConnection.value.on('error', (err) => {
                error.value = err.message;
                isConnecting.value = false;
                console.error('[sendMediaStream] Media connection error:', err);
            });
            
            // Check if PeerJS MediaConnection has internal events for answer
            if ((mediaConnection.value as any)._pc) {
                console.log('[sendMediaStream] PeerJS internal _pc:', (mediaConnection.value as any)._pc);
            }

            console.log('[sendMediaStream] Successfully initiated call, waiting for answer...');
            
            // Poll for remote description
            let checkCount = 0;
            const checkRemoteDesc = setInterval(() => {
                checkCount++;
                if (pc.remoteDescription) {
                    console.log('[sendMediaStream] Remote description received!', pc.remoteDescription.type);
                    clearInterval(checkRemoteDesc);
                } else if (checkCount > 50) {
                    console.error('[sendMediaStream] Timeout waiting for remote description after 5 seconds');
                    clearInterval(checkRemoteDesc);
                } else if (checkCount % 10 === 0) {
                    console.log(`[sendMediaStream] Still waiting for remote description... (${checkCount * 100}ms)`);
                }
            }, 100);

            return true;
        } catch (err: any) {
            error.value = err.message;
            isConnecting.value = false;
            console.error('[sendMediaStream] Failed to send media stream:', err);
            return false;
        }
    };

    const sendCommand = (command: PeerCommand): boolean => {
        console.log('[sendCommand] Attempting to send command:', command);
        console.log('[sendCommand] State:', {
            hasMediaConnection: !!mediaConnection.value,
            isConnected: isConnected.value,
            hasDataChannel: !!(mediaConnection.value && (mediaConnection.value as any).dataChannel),
        });

        if (!mediaConnection.value || !(mediaConnection.value as any).dataChannel) {
            error.value = 'Not connected to receiver';
            console.error('[sendCommand] No data channel available', {
                hasMediaConnection: !!mediaConnection.value,
                isConnected: isConnected.value,
            });
            return false;
        }

        const dataChannel = (mediaConnection.value as any).dataChannel as RTCDataChannel;
        
        if (dataChannel.readyState !== 'open') {
            error.value = 'Data channel not open';
            console.error('[sendCommand] Data channel not open, state:', dataChannel.readyState);
            return false;
        }

        try {
            const commandStr = JSON.stringify(command);
            console.log('[sendCommand] Sending command string:', commandStr);
            dataChannel.send(commandStr);
            console.log('[sendCommand] Command sent successfully');
            return true;
        } catch (err: any) {
            error.value = err.message;
            console.error('[sendCommand] Failed to send command:', err);
            return false;
        }
    };

    const handleResponse = (response: PeerResponse) => {
        console.log('Received response from backend:', response);

        if (response.status === 'error') {
            error.value = response.error || 'Unknown error';
            console.error('Backend error:', response);
            return;
        }

        // Update status if this is a status response
        if (response.recording !== undefined) {
            lastStatus.value = {
                recording: response.recording,
                urls: response.urls || [],
                tracks: response.tracks || 0,
                active_recorders: response.active_recorders,
            };
            console.log('Updated status:', lastStatus.value);
        }
    };

    const startRecording = () => {
        return sendCommand({ action: 'start' });
    };

    const stopRecording = () => {
        return sendCommand({ action: 'stop' });
    };

    const addRtmpUrl = (url: string) => {
        return sendCommand({ action: 'add_url', url });
    };

    const removeRtmpUrl = (url: string) => {
        return sendCommand({ action: 'remove_url', url });
    };

    const listUrls = () => {
        return sendCommand({ action: 'list_urls' });
    };

    const getStatus = () => {
        return sendCommand({ action: 'status' });
    };

    const disconnect = () => {
        if (mediaConnection.value) {
            mediaConnection.value.close();
            mediaConnection.value = null;
        }

        if (dataConnection.value) {
            dataConnection.value.close();
            dataConnection.value = null;
        }

        isConnected.value = false;
    };

    const destroy = () => {
        disconnect();

        if (peer.value) {
            peer.value.destroy();
            peer.value = null;
        }

        peerId.value = '';
        error.value = null;
    };

    onUnmounted(() => {
        destroy();
    });

    return {
        peer,
        peerId,
        isConnected,
        isConnecting,
        lastStatus,
        error,
        initialize,
        connect,
        sendMediaStream,
        startRecording,
        stopRecording,
        addRtmpUrl,
        removeRtmpUrl,
        listUrls,
        getStatus,
        disconnect,
        destroy,
    };
}
