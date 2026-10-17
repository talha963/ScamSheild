import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept API fetch calls to route cleanly to the ScamShield backend in both web and Android APK WebView
if (typeof window !== 'undefined') {
  const getBackendBase = (): string => {
    // 1. Android Native Bridge (queried dynamically on every call)
    if (typeof (window as any).ScamShieldAndroid?.getServerUrl === 'function') {
      try {
        const u = (window as any).ScamShieldAndroid.getServerUrl();
        if (u) return u.replace(/\/$/, '');
      } catch (e) {
        console.warn('ScamShieldAndroid getServerUrl error', e);
      }
    }
    // 2. Saved preference in local storage
    const saved = localStorage.getItem('scamshield_server_url');
    if (saved) return saved.replace(/\/$/, '');

    // 3. Bundled inside Android APK WebView (appassets.androidplatform.net or file://)
    if (
      window.location.protocol === 'file:' ||
      window.location.hostname === 'appassets.androidplatform.net' ||
      window.location.hostname.includes('androidplatform.net')
    ) {
      return 'https://flatbed-carve-imprint.ngrok-free.dev';
    }
    // 4. In browser, relative proxying via Nginx/Vite handles /v1/ and /bank/
    return '';
  };

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    const base = getBackendBase();

    // Ensure ngrok-skip-browser-warning header is always attached to prevent ERR_NGROK_6024
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));
    if (!headers.has('ngrok-skip-browser-warning')) {
      headers.set('ngrok-skip-browser-warning', 'true');
    }

    if (base && (url.startsWith('/v1/') || url.startsWith('/health') || url.startsWith('/bank/') || url.startsWith('/samples/'))) {
      url = base + url;
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers,
    };

    if (typeof input === 'string' || input instanceof URL) {
      return originalFetch(url, modifiedInit);
    } else if (input instanceof Request) {
      return originalFetch(new Request(url, { ...input, headers, ...init }));
    }
    return originalFetch(url, modifiedInit);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
