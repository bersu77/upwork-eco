/**
 * Service Worker Registration
 * Registers and manages the service worker lifecycle
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("[SW] Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[SW] Service worker registered:", registration.scope);

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          // New content available
          console.log("[SW] New content available, please refresh");
          
          // Optionally show a notification to the user
          if (window.confirm("New content available! Reload to update?")) {
            window.location.reload();
          }
        }
      });
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour

    return registration;
  } catch (error) {
    console.error("[SW] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  } catch (error) {
    console.error("[SW] Service worker unregistration failed:", error);
    return false;
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Prompt user to install PWA
 */
let deferredPrompt: any = null;

export function setupInstallPrompt(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("[PWA] Install prompt available");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    console.log("[PWA] App installed");
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log("[PWA] Install prompt not available");
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] Install prompt outcome:", outcome);
    deferredPrompt = null;
    return outcome === "accepted";
  } catch (error) {
    console.error("[PWA] Install prompt failed:", error);
    return false;
  }
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}


