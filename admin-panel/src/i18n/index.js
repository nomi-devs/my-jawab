// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const enModules = import.meta.glob('./locales/en/*.json', { eager: true });
const arModules = import.meta.glob('./locales/ar/*.json', { eager: true });

function buildResources(modules) {
  const namespaces = {};
  for (const path in modules) {
    const [, namespace] = path.match(/([^/]+)\.json$/);
    namespaces[namespace] = modules[path].default ?? modules[path];
  }
  return namespaces;
}

const resources = {
  en: buildResources(enModules),
  ar: buildResources(arModules),
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  ns: Object.keys(resources.en),
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  returnEmptyString: false,
});

export default i18n;
