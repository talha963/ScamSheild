import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { handleMockApiRequest } from './services/mockApiHandler'

// Intercept API fetch calls to route cleanly to either a live backend or the autonomous in-browser engine
if (typeof window !== 'undefined') {
  const getBackendBase = (): string => {
    // 1. Android Native Bridge
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

    return '';
  };

  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    const base = getBackendBase();
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    const isApiCall =
      url.startsWith('/v1/') ||
      url.startsWith('/health') ||
      url.startsWith('/bank/') ||
      url.includes('/v1/') ||
      url.includes('/bank/');

    // If an explicit backend server URL is configured, attempt remote call first
    if (base && isApiCall) {
      const targetUrl = url.startsWith('http') ? url : base + url;
      try {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));
        if (!headers.has('ngrok-skip-browser-warning')) {
          headers.set('ngrok-skip-browser-warning', 'true');
        }
        const res = await originalFetch(targetUrl, { ...init, headers });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res;
        }
      } catch {
        // Fall through to in-browser autonomous mock engine
      }
    }

    // In-browser autonomous backend engine
    if (isApiCall) {
      let bodyText: string | undefined;
      if (init?.body) {
        if (typeof init.body === 'string') {
          bodyText = init.body;
        } else if (init.body instanceof FormData) {
          // Serialize form data hints for vision / OCR
          const formEntries: string[] = [];
          init.body.forEach((val, key) => {
            if (val instanceof File) {
              formEntries.push(`${key}:${val.name}`);
            } else {
              formEntries.push(`${key}:${val}`);
            }
          });
          bodyText = formEntries.join(';');
        }
      }

      try {
        const mockRes = await handleMockApiRequest(url, method, bodyText);
        if (mockRes) {
          return new Response(JSON.stringify(mockRes.data), {
            status: mockRes.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (err) {
        console.error('ScamShield In-Browser Engine error:', err);
      }
    }

    // Default fetch for static assets, HTML, images, and bundles
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
