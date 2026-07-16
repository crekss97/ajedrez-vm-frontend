declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

const DEFAULT_API_URL = '/api';

export const API_URL = (window.__APP_CONFIG__?.apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
