import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log para depuração
  console.log(`[VITE_CONFIG_DEBUG] Chave OpenAI: ${env.VITE_OPENAI_API_KEY ? 'Encontrada' : 'NÃO ENCONTRADA'}`);
  console.log(`[VITE_CONFIG_DEBUG] Chave Tavily: ${env.VITE_TAVILY_API_KEY ? 'Encontrada' : 'NÃO ENCONTRADA'}`);

  return {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },  define: {
    'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
    'process.env.VITE_TAVILY_API_KEY': JSON.stringify(env.VITE_TAVILY_API_KEY),
  },
  plugins: [
    react(), 
    tailwindcss()
  ],
  base: './',
  // publicDir: 'public', // REMOVIDO (usa o padrão)
  server: {
    host: true, // Escuta em todas as interfaces de rede
    port: 5173, // Porta padrão do Vite
    // https: {}, // TEMPORARIAMENTE DESABILITADO para teste
    hmr: {
      timeout: 120000,
      overlay: false,
      clientPort: 5173,
      protocol: 'ws' // WebSocket normal para HTTP
    },
    watch: {
      usePolling: false, // Desabilitar polling para melhor performance
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['react-hot-toast', 'framer-motion']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@supabase/supabase-js',
      'react-hot-toast',
      'framer-motion'
    ],
    exclude: []
  },
  // Configurações para evitar recarregamentos desnecessários
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
  };
});
