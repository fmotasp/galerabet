import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// [CACHE BUSTER]
// Aumente este número (ex: 1.0.1, 1.0.2) toda vez que precisar forçar
// os navegadores dos usuários a atualizarem/recarregarem o JS mais recente.
const APP_VERSION = '1.0.1';
const currentVersion = localStorage.getItem('spine_app_version');

if (currentVersion !== APP_VERSION) {
  console.log(`[Cache Buster] Atualizando da versão ${currentVersion} para ${APP_VERSION}`);
  localStorage.setItem('spine_app_version', APP_VERSION);
  
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
  
  // Força reload pulando cache se possível
  window.location.reload();
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
