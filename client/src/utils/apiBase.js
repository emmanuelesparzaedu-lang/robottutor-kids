import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'robottutor-api-url';

/** URL de producción (nube) — se define al compilar la APK con npm run apk:cloud */
const CLOUD_API_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const isCloudUrl = (url) => url.startsWith('https://');

export function getApiBase() {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored.replace(/\/$/, '');

  if (Capacitor.isNativePlatform() && CLOUD_API_URL) {
    return CLOUD_API_URL;
  }

  if (Capacitor.isNativePlatform()) {
    return 'http://192.168.1.100:3001';
  }

  return '';
}

export function setApiBase(url) {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''));
}

export function buildApiUrl(path) {
  const base = getApiBase();
  if (base) return `${base}${path}`;
  return path;
}

export function isCloudMode() {
  if (import.meta.env.VITE_STANDALONE_MODE === 'true') return true;
  const base = getApiBase();
  return isCloudUrl(base);
}

export function isStandaloneMode() {
  return import.meta.env.VITE_STANDALONE_MODE === 'true';
}

export function getCloudApiUrl() {
  return CLOUD_API_URL;
}
