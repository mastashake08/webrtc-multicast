import { useRegisterSW } from 'virtual:pwa-register/vue';

export function usePWA() {
    const {
        needRefresh,
        offlineReady,
        updateServiceWorker,
    } = useRegisterSW({
        immediate: true,
        onRegistered(registration) {
            if (registration) {
                console.log('Service Worker registered:', registration);
                
                // Check for updates every hour
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('Service Worker registration error:', error);
        },
    });

    return {
        needRefresh,
        offlineReady,
        updateServiceWorker,
    };
}
