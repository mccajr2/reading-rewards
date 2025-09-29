import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Now you can access env.VITE_BACKEND_PORT
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_FRONTEND_PORT || 3000)
    },
  };
});