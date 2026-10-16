import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept API fetch calls to route cleanly to the ScamShield backend in both web and Android APK WebView
if (typeof window !== 'undefined') {
  const getBackendBase = (): string => {
    // 1. Android Native Bridge
    if ((window as any).ScamShieldAndroid?.getServerUrl) {
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

    // 3. Bundled inside Android APK WebView (file protocol)
    if (window.location.protocol === 'file:') {
      return 'https://americans-membrane-variation-thomas.trycloudflare.com';
    }
    // 4. In browser, relative proxying via Nginx/Vite handles /v1/
    return '';
  };

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    const base = getBackendBase();

    if (base && (url.startsWith('/v1/') || url.startsWith('/health') || url.startsWith('/bank/'))) {
      url = base + url;
      if (typeof input === 'string') {
        return originalFetch(url, init);
      } else if (input instanceof Request) {
        return originalFetch(new Request(url, input), init);
      }
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
