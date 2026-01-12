<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import CardContent from '@/components/ui/card/CardContent.vue';
import CardDescription from '@/components/ui/card/CardDescription.vue';
import CardHeader from '@/components/ui/card/CardHeader.vue';
import CardTitle from '@/components/ui/card/CardTitle.vue';
import Input from '@/components/ui/input/Input.vue';
import Label from '@/components/ui/label/Label.vue';
import { usePeerJS } from '@/composables/usePeerJS';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/vue3';
import { Video, VideoOff, Mic, MicOff, Monitor, Trash2, Plus, Play, Square, Link as LinkIcon, AlertCircle, Edit2, Check, X } from 'lucide-vue-next';
import { ref, onMounted, onUnmounted, watch } from 'vue';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// PeerJS
const {
    peerId,
    isConnected,
    isConnecting,
    lastStatus,
    error: peerError,
    initialize,
    connect,
    sendMediaStream,
    startRecording,
    stopRecording,
    addRtmpUrl: addRtmpUrlToPeer,
    removeRtmpUrl: removeRtmpUrlFromPeer,
    getStatus,
} = usePeerJS();

const receiverPeerId = ref('');
const showConnectionDialog = ref(false);

// Media
const videoRef = ref<HTMLVideoElement | null>(null);
const stream = ref<MediaStream | null>(null);
const isStreaming = ref(false);
const videoEnabled = ref(true);
const audioEnabled = ref(true);
const rtmpUrls = ref<string[]>([]);
const newRtmpUrl = ref('');
const selectedVideoDevice = ref('');
const selectedAudioDevice = ref('');
const videoDevices = ref<MediaDeviceInfo[]>([]);
const audioDevices = ref<MediaDeviceInfo[]>([]);
const editingUrlIndex = ref<number | null>(null);
const editingUrlValue = ref('');

// LocalStorage keys
const STORAGE_KEYS = {
    RTMP_URLS: 'webrtc_rtmp_urls',
    RECEIVER_PEER_ID: 'webrtc_receiver_peer_id',
};

// Load URLs from localStorage
const loadStoredUrls = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.RTMP_URLS);
        if (stored) {
            const urls = JSON.parse(stored);
            if (Array.isArray(urls)) {
                rtmpUrls.value = urls;
                console.log('[Dashboard] Loaded URLs from localStorage:', urls);
            }
        }
        
        const storedPeerId = localStorage.getItem(STORAGE_KEYS.RECEIVER_PEER_ID);
        if (storedPeerId) {
            receiverPeerId.value = storedPeerId;
            console.log('[Dashboard] Loaded receiver peer ID from localStorage:', storedPeerId);
        }
    } catch (error) {
        console.error('[Dashboard] Error loading from localStorage:', error);
    }
};

// Save URLs to localStorage
const saveUrlsToStorage = () => {
    try {
        localStorage.setItem(STORAGE_KEYS.RTMP_URLS, JSON.stringify(rtmpUrls.value));
        console.log('[Dashboard] Saved URLs to localStorage:', rtmpUrls.value);
    } catch (error) {
        console.error('[Dashboard] Error saving to localStorage:', error);
    }
};

// Save receiver peer ID to localStorage
const savePeerIdToStorage = () => {
    try {
        localStorage.setItem(STORAGE_KEYS.RECEIVER_PEER_ID, receiverPeerId.value);
        console.log('[Dashboard] Saved receiver peer ID to localStorage:', receiverPeerId.value);
    } catch (error) {
        console.error('[Dashboard] Error saving peer ID to localStorage:', error);
    }
};

onMounted(async () => {
    initialize();
    loadStoredUrls();
    await loadDevices();
});

onUnmounted(() => {
    stopStream();
});

// Watch for URL changes to save to localStorage
watch(rtmpUrls, () => {
    saveUrlsToStorage();
}, { deep: true });

// Watch for receiver peer ID changes to save to localStorage
watch(receiverPeerId, () => {
    if (receiverPeerId.value) {
        savePeerIdToStorage();
    }
});

// Watch for connection status
watch(isConnected, (connected) => {
    if (connected) {
        showConnectionDialog.value = false;
        // Request initial status
        setTimeout(() => getStatus(), 500);
    }
});

// Watch for status updates
watch(lastStatus, (status) => {
    if (status) {
        isStreaming.value = status.recording;
    }
});

const loadDevices = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices.value = devices.filter(d => d.kind === 'videoinput');
        audioDevices.value = devices.filter(d => d.kind === 'audioinput');
        
        if (videoDevices.value.length > 0) {
            selectedVideoDevice.value = videoDevices.value[0].deviceId;
        }
        if (audioDevices.value.length > 0) {
            selectedAudioDevice.value = audioDevices.value[0].deviceId;
        }
    } catch (error) {
        console.error('Error loading devices:', error);
    }
};

const startStream = async () => {
    try {
        const constraints: MediaStreamConstraints = {
            video: videoEnabled.value ? {
                deviceId: selectedVideoDevice.value ? { exact: selectedVideoDevice.value } : undefined,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } : false,
            audio: audioEnabled.value ? {
                deviceId: selectedAudioDevice.value ? { exact: selectedAudioDevice.value } : undefined,
                echoCancellation: true,
                noiseSuppression: true
            } : false
        };

        stream.value = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.value) {
            videoRef.value.srcObject = stream.value;
        }

        // Send media stream to receiver if connected
        if (isConnected.value && receiverPeerId.value) {
            sendMediaStream(stream.value, receiverPeerId.value);
        }
    } catch (error) {
        console.error('Error starting stream:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
    }
};

const stopStream = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
        stream.value = null;
    }
    if (videoRef.value) {
        videoRef.value.srcObject = null;
    }
};

const toggleVideo = async () => {
    videoEnabled.value = !videoEnabled.value;
    if (stream.value) {
        const videoTracks = stream.value.getVideoTracks();
        videoTracks.forEach(track => track.enabled = videoEnabled.value);
    }
};

const toggleAudio = () => {
    audioEnabled.value = !audioEnabled.value;
    if (stream.value) {
        const audioTracks = stream.value.getAudioTracks();
        audioTracks.forEach(track => track.enabled = audioEnabled.value);
    }
};

const captureScreen = async () => {
    try {
        stopStream();
        // @ts-ignore - displayMedia is not in TypeScript types yet
        stream.value = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true
        });
        
        if (videoRef.value) {
            videoRef.value.srcObject = stream.value;
        }

        // Send screen stream to receiver if connected
        if (isConnected.value && receiverPeerId.value) {
            sendMediaStream(stream.value, receiverPeerId.value);
        }
    } catch (error) {
        console.error('Error capturing screen:', error);
    }
};

const connectToPeer = async () => {
    if (!receiverPeerId.value) {
        alert('Please enter a receiver Peer ID');
        return;
    }

    const success = await connect(receiverPeerId.value);
    if (success && stream.value) {
        sendMediaStream(stream.value, receiverPeerId.value);
    }
};

const addRtmpUrl = () => {
    if (newRtmpUrl.value && !rtmpUrls.value.includes(newRtmpUrl.value)) {
        rtmpUrls.value.push(newRtmpUrl.value);
        
        // Send to backend if connected
        if (isConnected.value) {
            addRtmpUrlToPeer(newRtmpUrl.value);
        }
        
        newRtmpUrl.value = '';
    }
};

const removeRtmpUrl = (url: string) => {
    rtmpUrls.value = rtmpUrls.value.filter(u => u !== url);
    
    // Remove from backend if connected
    if (isConnected.value) {
        removeRtmpUrlFromPeer(url);
    }
};

const startEditingUrl = (index: number) => {
    editingUrlIndex.value = index;
    editingUrlValue.value = rtmpUrls.value[index];
};

const saveEditedUrl = () => {
    if (editingUrlIndex.value !== null && editingUrlValue.value) {
        const oldUrl = rtmpUrls.value[editingUrlIndex.value];
        rtmpUrls.value[editingUrlIndex.value] = editingUrlValue.value;
        
        // Update backend if connected
        if (isConnected.value) {
            removeRtmpUrlFromPeer(oldUrl);
            addRtmpUrlToPeer(editingUrlValue.value);
        }
        
        cancelEditingUrl();
    }
};

const cancelEditingUrl = () => {
    editingUrlIndex.value = null;
    editingUrlValue.value = '';
};

const startBroadcast = async () => {
    console.log('[Dashboard] startBroadcast called');
    console.log('[Dashboard] isConnected:', isConnected.value);
    console.log('[Dashboard] rtmpUrls:', rtmpUrls.value);
    console.log('[Dashboard] stream:', stream.value);
    
    if (!isConnected.value) {
        console.log('[Dashboard] Not connected, showing connection dialog');
        showConnectionDialog.value = true;
        return;
    }

    // Check if there are RTMP URLs
    if (rtmpUrls.value.length === 0) {
        console.log('[Dashboard] No RTMP URLs configured');
        alert('Please add at least one RTMP URL before starting broadcast');
        return;
    }

    // Send all URLs to backend first
    console.log('[Dashboard] Sending RTMP URLs to backend:', rtmpUrls.value);
    for (const url of rtmpUrls.value) {
        addRtmpUrlToPeer(url);
    }

    // Wait a moment for URLs to be added
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[Dashboard] Calling startRecording()');
    const result = startRecording();
    console.log('[Dashboard] startRecording() returned:', result);
    
    if (result) {
        console.log('Starting broadcast to:', rtmpUrls.value);
        // Poll status to update UI
        setTimeout(() => getStatus(), 1000);
    }
};

const stopBroadcast = () => {
    if (stopRecording()) {
        console.log('Stopping broadcast');
        // Poll status to update UI
        setTimeout(() => getStatus(), 1000);
    }
};

const changeVideoDevice = async () => {
    if (stream.value) {
        stopStream();
        await startStream();
    }
};

const changeAudioDevice = async () => {
    if (stream.value) {
        stopStream();
        await startStream();
    }
};
</script>

<template>
    <Head title="Dashboard" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="flex h-full flex-1 flex-col gap-4 p-4">
            <!-- Connection Status -->
            <Card v-if="!isConnected" class="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent class="flex items-center gap-4 p-4">
                    <AlertCircle class="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    <div class="flex-1">
                        <p class="font-medium text-yellow-900 dark:text-yellow-100">Not connected to backend</p>
                        <p class="text-sm text-yellow-700 dark:text-yellow-300">Enter the receiver Peer ID to connect</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Input
                            v-model="receiverPeerId"
                            placeholder="Receiver Peer ID"
                            class="w-64"
                        />
                        <Button @click="connectToPeer" :disabled="isConnecting || !receiverPeerId">
                            <LinkIcon class="mr-2 h-4 w-4" />
                            {{ isConnecting ? 'Connecting...' : 'Connect' }}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <!-- Error Alert -->
            <Card v-if="peerError" class="border-red-500/50 bg-red-50 dark:bg-red-950/20">
                <CardContent class="flex items-center gap-4 p-4">
                    <AlertCircle class="h-5 w-5 text-red-600 dark:text-red-500" />
                    <div class="flex-1">
                        <p class="font-medium text-red-900 dark:text-red-100">Connection Error</p>
                        <p class="text-sm text-red-700 dark:text-red-300">{{ peerError }}</p>
                    </div>
                </CardContent>
            </Card>

            <!-- Status Bar -->
            <Card v-if="isConnected" class="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CardContent class="flex items-center justify-between p-4">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                            <span class="text-sm font-medium text-green-900 dark:text-green-100">Connected</span>
                        </div>
                        <span class="text-sm text-green-700 dark:text-green-300">Peer ID: {{ peerId }}</span>
                    </div>
                    <div v-if="lastStatus" class="flex items-center gap-4 text-sm">
                        <span class="text-green-700 dark:text-green-300">
                            Recording: {{ lastStatus.recording ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="text-green-700 dark:text-green-300">
                            Destinations: {{ lastStatus.urls.length }}
                        </span>
                        <span class="text-green-700 dark:text-green-300">
                            Tracks: {{ lastStatus.tracks }}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <!-- Preview and RTMP URLs -->
            <div class="grid gap-4 lg:grid-cols-3">
                <!-- Video Preview -->
                <div class="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stream Preview</CardTitle>
                            <CardDescription>Your camera or screen capture</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                                <video
                                    ref="videoRef"
                                    autoplay
                                    playsinline
                                    muted
                                    class="h-full w-full object-contain"
                                />
                                
                                <!-- Overlay controls -->
                                <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                                    <Button
                                        v-if="!stream"
                                        @click="startStream"
                                        variant="default"
                                        size="sm"
                                    >
                                        <Video class="mr-2 h-4 w-4" />
                                        Start Camera
                                    </Button>
                                    <template v-else>
                                        <Button
                                            @click="toggleVideo"
                                            :variant="videoEnabled ? 'default' : 'destructive'"
                                            size="sm"
                                        >
                                            <VideoOff v-if="!videoEnabled" class="h-4 w-4" />
                                            <Video v-else class="h-4 w-4" />
                                        </Button>
                                        <Button
                                            @click="toggleAudio"
                                            :variant="audioEnabled ? 'default' : 'destructive'"
                                            size="sm"
                                        >
                                            <MicOff v-if="!audioEnabled" class="h-4 w-4" />
                                            <Mic v-else class="h-4 w-4" />
                                        </Button>
                                        <Button
                                            @click="captureScreen"
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <Monitor class="h-4 w-4" />
                                        </Button>
                                    </template>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- RTMP URLs -->
                <div>
                    <Card class="h-full">
                        <CardHeader>
                            <CardTitle>RTMP Destinations</CardTitle>
                            <CardDescription>Add streaming platforms</CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="space-y-2">
                                <Label for="rtmp-url">RTMP URL</Label>
                                <div class="flex gap-2">
                                    <Input
                                        id="rtmp-url"
                                        v-model="newRtmpUrl"
                                        placeholder="rtmp://..."
                                        @keyup.enter="addRtmpUrl"
                                    />
                                    <Button @click="addRtmpUrl" size="sm">
                                        <Plus class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div
                                    v-for="(url, index) in rtmpUrls"
                                    :key="url"
                                    class="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2 text-xs"
                                >
                                    <template v-if="editingUrlIndex === index">
                                        <Input
                                            v-model="editingUrlValue"
                                            class="h-7 flex-1 text-xs"
                                            @keyup.enter="saveEditedUrl"
                                            @keyup.esc="cancelEditingUrl"
                                            autofocus
                                        />
                                        <Button
                                            @click="saveEditedUrl"
                                            variant="ghost"
                                            size="sm"
                                            class="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                            title="Save"
                                        >
                                            <Check class="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            @click="cancelEditingUrl"
                                            variant="ghost"
                                            size="sm"
                                            class="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                            title="Cancel"
                                        >
                                            <X class="h-3.5 w-3.5" />
                                        </Button>
                                    </template>
                                    <template v-else>
                                        <span class="flex-1 truncate" :title="url">{{ url }}</span>
                                        <Button
                                            @click="startEditingUrl(index)"
                                            variant="ghost"
                                            size="sm"
                                            class="h-7 w-7 p-0"
                                            title="Edit"
                                        >
                                            <Edit2 class="h-3 w-3" />
                                        </Button>
                                        <Button
                                            @click="removeRtmpUrl(url)"
                                            variant="ghost"
                                            size="sm"
                                            class="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                            title="Delete"
                                        >
                                            <Trash2 class="h-3 w-3" />
                                        </Button>
                                    </template>
                                </div>
                                <p v-if="rtmpUrls.length === 0" class="text-center text-sm text-muted-foreground">
                                    No destinations added
                                </p>
                            </div>

                            <div class="pt-4">
                                <Button
                                    v-if="!isStreaming"
                                    @click="startBroadcast"
                                    :disabled="rtmpUrls.length === 0 || !stream"
                                    class="w-full"
                                >
                                    <Play class="mr-2 h-4 w-4" />
                                    Start Broadcast
                                </Button>
                                <Button
                                    v-else
                                    @click="stopBroadcast"
                                    variant="destructive"
                                    class="w-full"
                                >
                                    <Square class="mr-2 h-4 w-4" />
                                    Stop Broadcast
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Camera and Microphone Settings -->
            <Card>
                <CardHeader>
                    <CardTitle>Device Settings</CardTitle>
                    <CardDescription>Configure your camera and microphone</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="video-device">Camera</Label>
                            <select
                                id="video-device"
                                v-model="selectedVideoDevice"
                                @change="changeVideoDevice"
                                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                <option
                                    v-for="device in videoDevices"
                                    :key="device.deviceId"
                                    :value="device.deviceId"
                                >
                                    {{ device.label || `Camera ${device.deviceId.slice(0, 8)}` }}
                                </option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <Label for="audio-device">Microphone</Label>
                            <select
                                id="audio-device"
                                v-model="selectedAudioDevice"
                                @change="changeAudioDevice"
                                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                <option
                                    v-for="device in audioDevices"
                                    :key="device.deviceId"
                                    :value="device.deviceId"
                                >
                                    {{ device.label || `Microphone ${device.deviceId.slice(0, 8)}` }}
                                </option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </AppLayout>
</template>
