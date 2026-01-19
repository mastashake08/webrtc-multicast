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
import { Video, VideoOff, Mic, MicOff, Monitor, Trash2, Plus, Play, Square, Link as LinkIcon, AlertCircle, Edit2, Check, X, Download, Circle } from 'lucide-vue-next';
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

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
    replaceMediaStream,
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
const normalizedStream = ref<MediaStream | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isStreaming = ref(false);
const videoEnabled = ref(true);
const audioEnabled = ref(true);
const rtmpUrls = ref<string[]>([]);
const enabledUrls = ref<Set<string>>(new Set());
const newRtmpUrl = ref('');
const selectedVideoDevice = ref('');
const selectedAudioDevice = ref('');
const videoDevices = ref<MediaDeviceInfo[]>([]);
const audioDevices = ref<MediaDeviceInfo[]>([]);
const editingUrlIndex = ref<number | null>(null);
const editingUrlValue = ref('');

// Local recording
const isRecording = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const recordingStartTime = ref<number>(0);
const recordingDuration = ref('00:00');

// Screen sharing with PiP camera
const isScreenSharing = ref(false);
const cameraStream = ref<MediaStream | null>(null);
const cameraVideoElement = ref<HTMLVideoElement | null>(null);

// HD normalization constants
const HD_WIDTH = 1920;
const HD_HEIGHT = 1080;
const TARGET_FPS = 30;

// LocalStorage keys
const STORAGE_KEYS = {
    RTMP_URLS: 'webrtc_rtmp_urls',
    ENABLED_URLS: 'webrtc_enabled_urls',
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
        
        const storedEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED_URLS);
        if (storedEnabled) {
            const enabled = JSON.parse(storedEnabled);
            if (Array.isArray(enabled)) {
                enabledUrls.value = new Set(enabled);
                console.log('[Dashboard] Loaded enabled URLs from localStorage:', enabled);
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
        localStorage.setItem(STORAGE_KEYS.ENABLED_URLS, JSON.stringify([...enabledUrls.value]));
        console.log('[Dashboard] Saved URLs to localStorage:', rtmpUrls.value);
        console.log('[Dashboard] Saved enabled URLs to localStorage:', [...enabledUrls.value]);
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

// Watch for enabled URLs changes to save to localStorage
watch(enabledUrls, () => {
    saveUrlsToStorage();
}, { deep: true });

// Watch for receiver peer ID changes to save to localStorage
watch(receiverPeerId, () => {
    if (receiverPeerId.value) {
        savePeerIdToStorage();
    }
});

// Update recording duration display
const updateRecordingDuration = () => {
    if (isRecording.value) {
        const elapsed = Math.floor((Date.now() - recordingStartTime.value) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        recordingDuration.value = `${minutes}:${seconds}`;
        requestAnimationFrame(updateRecordingDuration);
    }
};

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
        // Request permissions first to get proper device labels
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                // Stop tracks immediately - we just needed permission
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(() => {
                console.warn('Could not get permissions for full device labels');
            });
        
        // Now enumerate devices with proper labels
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices.value = devices.filter(d => d.kind === 'videoinput');
        audioDevices.value = devices.filter(d => d.kind === 'audioinput');
        
        console.log('Available cameras:', videoDevices.value.map(d => ({ id: d.deviceId.slice(0, 8), label: d.label })));
        console.log('Available microphones:', audioDevices.value.map(d => ({ id: d.deviceId.slice(0, 8), label: d.label })));
        
        if (videoDevices.value.length > 0 && !selectedVideoDevice.value) {
            selectedVideoDevice.value = videoDevices.value[0].deviceId;
        }
        if (audioDevices.value.length > 0 && !selectedAudioDevice.value) {
            selectedAudioDevice.value = audioDevices.value[0].deviceId;
        }
    } catch (error) {
        console.error('Error loading devices:', error);
    }
};

const normalizeVideoToHD = (inputStream: MediaStream, cameraOverlay?: MediaStream): MediaStream => {
    console.log('[normalizeVideoToHD] Creating HD normalized stream', { hasCameraOverlay: !!cameraOverlay });
    
    // Create canvas if not exists
    if (!canvasRef.value) {
        canvasRef.value = document.createElement('canvas');
        canvasRef.value.width = HD_WIDTH;
        canvasRef.value.height = HD_HEIGHT;
    }
    
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx) {
        console.error('[normalizeVideoToHD] Failed to get canvas context');
        return inputStream;
    }
    
    // Create video element to draw from (main screen/camera)
    const video = document.createElement('video');
    video.srcObject = inputStream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    
    // Create camera overlay video element if provided
    let cameraVideo: HTMLVideoElement | null = null;
    if (cameraOverlay) {
        cameraVideo = document.createElement('video');
        cameraVideo.srcObject = cameraOverlay;
        cameraVideo.autoplay = true;
        cameraVideo.playsInline = true;
        cameraVideo.muted = true;
        cameraVideoElement.value = cameraVideo;
    }
    
    // Camera overlay dimensions (in lower left corner)
    const CAMERA_WIDTH = 320;  // Width of camera overlay
    const CAMERA_HEIGHT = 180; // Height of camera overlay (16:9)
    const CAMERA_MARGIN = 20;  // Margin from edges
    
    // Start drawing frames
    let animationId: number;
    let frameCount = 0;
    const drawFrame = () => {
        if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
            frameCount++;
            if (frameCount <= 5) {
                console.log('[normalizeVideoToHD] Drawing frame', frameCount, 'video:', video.videoWidth, 'x', video.videoHeight);
            }
            
            // Calculate aspect ratio scaling for main video
            const videoAspect = video.videoWidth / video.videoHeight;
            const canvasAspect = HD_WIDTH / HD_HEIGHT;
            
            let drawWidth = HD_WIDTH;
            let drawHeight = HD_HEIGHT;
            let offsetX = 0;
            let offsetY = 0;
            
            if (videoAspect > canvasAspect) {
                // Video is wider - fit height
                drawHeight = HD_HEIGHT;
                drawWidth = HD_HEIGHT * videoAspect;
                offsetX = (HD_WIDTH - drawWidth) / 2;
            } else {
                // Video is taller - fit width
                drawWidth = HD_WIDTH;
                drawHeight = HD_WIDTH / videoAspect;
                offsetY = (HD_HEIGHT - drawHeight) / 2;
            }
            
            // Clear and draw main video
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, HD_WIDTH, HD_HEIGHT);
            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
            
            // Draw camera overlay in lower left corner if available
            if (cameraVideo && cameraVideo.readyState >= cameraVideo.HAVE_CURRENT_DATA && cameraVideo.videoWidth > 0) {
                // Draw border/background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(
                    CAMERA_MARGIN - 3,
                    HD_HEIGHT - CAMERA_HEIGHT - CAMERA_MARGIN - 3,
                    CAMERA_WIDTH + 6,
                    CAMERA_HEIGHT + 6
                );
                
                // Draw camera feed
                ctx.drawImage(
                    cameraVideo,
                    CAMERA_MARGIN,
                    HD_HEIGHT - CAMERA_HEIGHT - CAMERA_MARGIN,
                    CAMERA_WIDTH,
                    CAMERA_HEIGHT
                );
            }
        }
        animationId = requestAnimationFrame(drawFrame);
    };
    
    // Wait for video to be ready and playing before starting
    const startDrawing = () => {
        console.log('[normalizeVideoToHD] Video ready, starting to draw. Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        drawFrame();
    };
    
    // Listen for when video actually starts playing
    video.addEventListener('playing', startDrawing, { once: true });
    
    // Fallback: start after a short delay if 'playing' event doesn't fire
    setTimeout(() => {
        if (animationId === undefined) {
            console.log('[normalizeVideoToHD] Fallback: starting draw without playing event');
            drawFrame();
        }
    }, 100);
    
    video.onloadedmetadata = () => {
        console.log(`[normalizeVideoToHD] Metadata loaded. Input: ${video.videoWidth}x${video.videoHeight} → Output: ${HD_WIDTH}x${HD_HEIGHT}`);
    };
    
    // Capture canvas stream at target FPS
    const canvasStream = canvas.captureStream(TARGET_FPS);
    console.log('[normalizeVideoToHD] Canvas stream created, tracks:', canvasStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
    
    // Add audio from original stream
    const audioTracks = inputStream.getAudioTracks();
    audioTracks.forEach(track => {
        canvasStream.addTrack(track);
        console.log('[normalizeVideoToHD] Added audio track:', track.label);
    });
    
    // Stop animation when stream ends
    canvasStream.getVideoTracks()[0].addEventListener('ended', () => {
        cancelAnimationFrame(animationId);
        video.srcObject = null;
        if (cameraVideo) {
            cameraVideo.srcObject = null;
        }
    });
    
    return canvasStream;
};

const startStream = async () => {
    try {
        const constraints: MediaStreamConstraints = {
            video: videoEnabled.value ? {
                deviceId: selectedVideoDevice.value ? { exact: selectedVideoDevice.value } : undefined,
                width: { ideal: 3840, min: 1280 },      // 4K ideal, 720p minimum
                height: { ideal: 2160, min: 720 },      // 4K ideal, 720p minimum
                frameRate: { ideal: 60, min: 30 },      // 60fps ideal, 30fps minimum
                aspectRatio: { ideal: 16/9 }
            } : false,
            audio: audioEnabled.value ? {
                deviceId: selectedAudioDevice.value ? { exact: selectedAudioDevice.value } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: { ideal: 48000 },           // 48kHz for high quality
                channelCount: { ideal: 2 }              // Stereo
            } : false
        };

        stream.value = await navigator.mediaDevices.getUserMedia(constraints);
        isScreenSharing.value = false;
        
        if (videoRef.value) {
            videoRef.value.srcObject = stream.value;
        }

        // Normalize video to HD before sending
        normalizedStream.value = normalizeVideoToHD(stream.value);
        console.log('[startStream] Created HD normalized stream');

        // Send or replace media stream to receiver if connected
        if (isConnected.value) {
            if (receiverPeerId.value) {
                // Check if we already have an active connection by trying to replace tracks
                const replaced = await replaceMediaStream(normalizedStream.value);
                // If replace failed (no connection), create new connection
                if (!replaced) {
                    sendMediaStream(normalizedStream.value, receiverPeerId.value);
                }
            }
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
            video: {
                width: { ideal: 3840 },                 // 4K ideal
                height: { ideal: 2160 },                // 4K ideal
                frameRate: { ideal: 60 },               // 60fps ideal
                // @ts-ignore - cursor property
                cursor: 'always'                        // Always show cursor
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2 }
            }
        });
        
        if (videoRef.value) {
            videoRef.value.srcObject = stream.value;
        }

        // Normalize screen capture to HD before sending
        normalizedStream.value = normalizeVideoToHD(stream.value);
        console.log('[captureScreen] Created HD normalized screen stream');

        // Replace tracks on existing connection if connected
        if (isConnected.value) {
            console.log('[Dashboard] Replacing tracks with screen capture');
            await replaceMediaStream(normalizedStream.value);
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
        enabledUrls.value.add(newRtmpUrl.value);  // Enable by default
        
        // Send to backend if connected
        if (isConnected.value) {
            addRtmpUrlToPeer(newRtmpUrl.value);
        }
        
        newRtmpUrl.value = '';
    }
};

const removeRtmpUrl = (url: string) => {
    rtmpUrls.value = rtmpUrls.value.filter(u => u !== url);
    enabledUrls.value.delete(url);
    
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

const toggleUrl = (url: string) => {
    if (enabledUrls.value.has(url)) {
        enabledUrls.value.delete(url);
        // Remove from backend if connected and streaming
        if (isConnected.value && isStreaming.value) {
            removeRtmpUrlFromPeer(url);
        }
    } else {
        enabledUrls.value.add(url);
        // Add to backend if connected and streaming
        if (isConnected.value && isStreaming.value) {
            addRtmpUrlToPeer(url);
        }
    }
};

const startBroadcast = async () => {
    console.log('[Dashboard] startBroadcast called');
    console.log('[Dashboard] isConnected:', isConnected.value);
    console.log('[Dashboard] rtmpUrls:', rtmpUrls.value);
    console.log('[Dashboard] enabledUrls:', [...enabledUrls.value]);
    console.log('[Dashboard] stream:', stream.value);
    
    if (!isConnected.value) {
        console.log('[Dashboard] Not connected, showing connection dialog');
        showConnectionDialog.value = true;
        return;
    }

    // Get enabled URLs
    const urlsToStream = rtmpUrls.value.filter(url => enabledUrls.value.has(url));

    // Check if there are enabled RTMP URLs
    if (urlsToStream.length === 0) {
        console.log('[Dashboard] No enabled RTMP URLs');
        alert('Please enable at least one RTMP URL before starting broadcast');
        return;
    }

    // Send only enabled URLs to backend first
    console.log('[Dashboard] Sending enabled RTMP URLs to backend:', urlsToStream);
    for (const url of urlsToStream) {
        addRtmpUrlToPeer(url);
    }

    // Wait a moment for URLs to be added
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[Dashboard] Calling startRecording()');
    const result = startRecording();
    console.log('[Dashboard] startRecording() returned:', result);
    
    if (result) {
        console.log('Starting broadcast to:', urlsToStream);
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

const startLocalRecording = () => {
    if (!stream.value) {
        alert('Please start camera or screen share first');
        return;
    }

    try {
        recordedChunks.value = [];
        
        // Record the normalized canvas stream if available, otherwise record original stream
        const streamToRecord = normalizedStream.value || stream.value;
        
        // Verify the stream has active tracks
        const videoTracks = streamToRecord.getVideoTracks();
        const audioTracks = streamToRecord.getAudioTracks();
        
        console.log('[startLocalRecording] Stream info:', {
            hasVideo: videoTracks.length > 0,
            hasAudio: audioTracks.length > 0,
            videoEnabled: videoTracks[0]?.enabled,
            videoReadyState: videoTracks[0]?.readyState,
            isNormalized: !!normalizedStream.value
        });
        
        if (videoTracks.length === 0) {
            alert('No video track available to record');
            return;
        }
        
        const options: MediaRecorderOptions = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 8000000 // 8 Mbps
        };
        
        // Fallback to vp8 if vp9 not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
            console.log('[startLocalRecording] Falling back to VP8');
        }
        
        // Additional fallback
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            options.mimeType = 'video/webm';
            console.log('[startLocalRecording] Falling back to default webm');
        }
        
        mediaRecorder.value = new MediaRecorder(streamToRecord, options);
        
        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.value.push(event.data);
                console.log('[Recording] Chunk received:', event.data.size, 'bytes');
            }
        };
        
        mediaRecorder.value.onstop = () => {
            console.log('[Recording] Stopped, total chunks:', recordedChunks.value.length);
            const totalSize = recordedChunks.value.reduce((acc, chunk) => acc + chunk.size, 0);
            console.log('[Recording] Total size:', totalSize, 'bytes');
        };
        
        mediaRecorder.value.onerror = (event) => {
            console.error('[Recording] Error:', event);
            alert('Recording error occurred');
            isRecording.value = false;
        };
        
        mediaRecorder.value.start(1000); // Collect data every second
        isRecording.value = true;
        recordingStartTime.value = Date.now();
        updateRecordingDuration();
        
        console.log('[startLocalRecording] Recording started with codec:', options.mimeType);
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. Your browser may not support this feature.');
    }
};

const stopLocalRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop();
        isRecording.value = false;
        console.log('Stopped local recording');
    }
};

const downloadRecording = () => {
    if (recordedChunks.value.length === 0) {
        alert('No recording to download');
        return;
    }
    
    const blob = new Blob(recordedChunks.value, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Downloaded recording');
};

const captureScreenWithCamera = async () => {
    try {
        // Get camera stream first if we don't have one
        if (!stream.value || isScreenSharing.value) {
            // Start camera stream
            const cameraConstraints: MediaStreamConstraints = {
                video: videoEnabled.value ? {
                    deviceId: selectedVideoDevice.value ? { exact: selectedVideoDevice.value } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                    aspectRatio: { ideal: 16/9 }
                } : false,
                audio: audioEnabled.value ? {
                    deviceId: selectedAudioDevice.value ? { exact: selectedAudioDevice.value } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: { ideal: 48000 },
                    channelCount: { ideal: 2 }
                } : false
            };
            cameraStream.value = await navigator.mediaDevices.getUserMedia(cameraConstraints);
        } else {
            // Save current camera stream
            cameraStream.value = stream.value.clone();
        }
        
        // Get screen share stream
        // @ts-ignore - displayMedia is not in TypeScript types yet
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: 3840 },
                height: { ideal: 2160 },
                frameRate: { ideal: 60 },
                // @ts-ignore - cursor property
                cursor: 'always'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2 }
            }
        });
        
        // Stop old stream if exists
        if (stream.value && !isScreenSharing.value) {
            stream.value.getTracks().forEach(track => track.stop());
        }
        
        stream.value = screenStream;
        isScreenSharing.value = true;
        
        if (videoRef.value) {
            videoRef.value.srcObject = screenStream;
        }
        
        // Create composite stream with camera overlay
        normalizedStream.value = normalizeVideoToHD(screenStream, cameraStream.value);
        console.log('[captureScreenWithCamera] Created composite stream with camera overlay');
        
        // Replace tracks on existing connection if connected
        if (isConnected.value) {
            console.log('[Dashboard] Replacing tracks with screen+camera composite');
            await replaceMediaStream(normalizedStream.value);
        }
    } catch (error) {
        console.error('Error capturing screen with camera:', error);
        // Clean up camera stream on error
        if (cameraStream.value) {
            cameraStream.value.getTracks().forEach(track => track.stop());
            cameraStream.value = null;
        }
    }
};

const stopScreenShare = async () => {
    // Stop camera overlay stream
    if (cameraStream.value) {
        cameraStream.value.getTracks().forEach(track => track.stop());
        cameraStream.value = null;
    }
    
    // Clean up camera video element
    if (cameraVideoElement.value) {
        cameraVideoElement.value.srcObject = null;
        cameraVideoElement.value = null;
    }
    
    // Return to regular camera
    isScreenSharing.value = false;
    stopStream();
    await startStream();
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
                                
                                <!-- Recording indicator -->
                                <div 
                                    v-if="isRecording"
                                    class="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                                >
                                    <Circle class="h-3 w-3 fill-current animate-pulse" />
                                    REC {{ recordingDuration }}
                                </div>
                                
                                <!-- Camera overlay indicator when screen sharing -->
                                <div 
                                    v-if="isScreenSharing && cameraStream"
                                    class="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
                                >
                                    <Video class="h-3 w-3" />
                                    Camera Overlay Active
                                </div>
                                
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
                                            v-if="!isScreenSharing"
                                            @click="captureScreenWithCamera"
                                            variant="secondary"
                                            size="sm"
                                            title="Screen share with camera PiP"
                                        >
                                            <Monitor class="h-4 w-4" />
                                        </Button>
                                        <Button
                                            v-else
                                            @click="stopScreenShare"
                                            variant="secondary"
                                            size="sm"
                                            title="Back to camera"
                                        >
                                            <Video class="h-4 w-4" />
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
                                        <input 
                                            type="checkbox"
                                            :checked="enabledUrls.has(url)"
                                            @change="toggleUrl(url)"
                                            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            :title="enabledUrls.has(url) ? 'Enabled' : 'Disabled'"
                                        />
                                        <span 
                                            class="flex-1 truncate" 
                                            :title="url"
                                            :class="{ 'text-muted-foreground': !enabledUrls.has(url) }"
                                        >
                                            {{ url }}
                                        </span>
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
                                    :disabled="enabledUrls.size === 0 || !stream"
                                    class="w-full"
                                >
                                    <Play class="mr-2 h-4 w-4" />
                                    Start Broadcast ({{ enabledUrls.size }})
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
            <div class="grid gap-4 lg:grid-cols-2">
                <!-- Device Settings -->
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

                <!-- Local Recording Controls -->
                <Card>
                    <CardHeader>
                        <CardTitle>Local Recording</CardTitle>
                        <CardDescription>Record locally and download video</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <div class="flex items-center gap-2">
                            <Button
                                v-if="!isRecording"
                                @click="startLocalRecording"
                                :disabled="!stream"
                                class="flex-1"
                            >
                                <Circle class="mr-2 h-4 w-4" />
                                Start Recording
                            </Button>
                            <Button
                                v-else
                                @click="stopLocalRecording"
                                variant="destructive"
                                class="flex-1"
                            >
                                <Square class="mr-2 h-4 w-4" />
                                Stop Recording
                            </Button>
                        </div>
                        
                        <Button
                            v-if="recordedChunks.length > 0"
                            @click="downloadRecording"
                            variant="secondary"
                            class="w-full"
                        >
                            <Download class="mr-2 h-4 w-4" />
                            Download Recording ({{ Math.round(recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1024 / 1024) }}MB)
                        </Button>
                        
                        <p v-if="!stream" class="text-sm text-muted-foreground text-center">
                            Start camera or screen share to enable recording
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </AppLayout>
</template>
