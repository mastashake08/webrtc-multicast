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
                console.log('PeerJS initialized with ID:', id);
            });

            peer.value.on('error', (err) => {
                error.value = err.message;
                console.error('PeerJS error:', err);
            });

            peer.value.on('disconnected', () => {
                isConnected.value = false;
                console.log('PeerJS disconnected');
            });
        } catch (err: any) {
            error.value = err.message;
            console.error('Failed to initialize PeerJS:', err);
        }
    };

    const connect = async (receiverPeerId: string) => {
        if (!peer.value) {
            error.value = 'Peer not initialized';
            return false;
        }

        isConnecting.value = true;
        error.value = null;

        try {
            // Establish data connection
            dataConnection.value = peer.value.connect(receiverPeerId, {
                reliable: true,
            });

            dataConnection.value.on('open', () => {
                isConnected.value = true;
                isConnecting.value = false;
                console.log('Data connection established');
            });

            dataConnection.value.on('data', (data) => {
                handleResponse(data as PeerResponse);
            });

            dataConnection.value.on('close', () => {
                isConnected.value = false;
                console.log('Data connection closed');
            });

            dataConnection.value.on('error', (err) => {
                error.value = err.message;
                isConnecting.value = false;
                console.error('Data connection error:', err);
            });

            return true;
        } catch (err: any) {
            error.value = err.message;
            isConnecting.value = false;
            console.error('Failed to connect:', err);
            return false;
        }
    };

    const sendMediaStream = (stream: MediaStream, receiverPeerId: string) => {
        if (!peer.value) {
            error.value = 'Peer not initialized';
            return false;
        }

        try {
            mediaConnection.value = peer.value.call(receiverPeerId, stream);

            mediaConnection.value.on('close', () => {
                console.log('Media connection closed');
            });

            mediaConnection.value.on('error', (err) => {
                error.value = err.message;
                console.error('Media connection error:', err);
            });

            return true;
        } catch (err: any) {
            error.value = err.message;
            console.error('Failed to send media stream:', err);
            return false;
        }
    };

    const sendCommand = (command: PeerCommand): boolean => {
        if (!dataConnection.value || !isConnected.value) {
            error.value = 'Not connected to receiver';
            return false;
        }

        try {
            dataConnection.value.send(JSON.stringify(command));
            return true;
        } catch (err: any) {
            error.value = err.message;
            console.error('Failed to send command:', err);
            return false;
        }
    };

    const handleResponse = (response: PeerResponse) => {
        console.log('Received response:', response);

        if (response.status === 'error') {
            error.value = response.error || 'Unknown error';
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
