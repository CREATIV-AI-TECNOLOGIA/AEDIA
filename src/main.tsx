import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

// Shim de compatibilidade para evitar erros de objetos antigos ou cache
(window as any).configService = {
  getConfigurations: () => {
    console.warn('Chamada para configService.getConfigurations bloqueada por shim de compatibilidade');
    throw new Error('configService descontinuado: Use ProfessorIAConfigService.getConfiguracaoesOuPadrao() em vez disso');
  }
};

// Remover React.StrictMode para evitar re-renderizações duplas
// e melhorar a performance da aplicação
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
  </>,
);
