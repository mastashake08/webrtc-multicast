<template>
    <div
        v-if="offlineReady || needRefresh"
        class="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border bg-background p-4 shadow-lg"
        role="alert"
    >
        <div class="flex items-start gap-3">
            <div class="flex-1">
                <p class="font-medium text-sm">
                    {{ offlineReady ? 'App ready to work offline' : 'New version available!' }}
                </p>
                <p v-if="needRefresh" class="mt-1 text-sm text-muted-foreground">
                    Click reload to update to the latest version.
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    v-if="needRefresh"
                    @click="updateServiceWorker()"
                    class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    Reload
                </button>
                <button
                    @click="close"
                    class="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                    {{ needRefresh ? 'Later' : 'OK' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { usePWA } from '@/composables/usePWA';
import { ref } from 'vue';

const { offlineReady, needRefresh, updateServiceWorker } = usePWA();
const closed = ref(false);

function close() {
    closed.value = true;
    offlineReady.value = false;
    needRefresh.value = false;
}
</script>
