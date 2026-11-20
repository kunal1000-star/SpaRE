import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dbUrl = env.VITE_DATABASE_URL || env.DATABASE_URL || "postgresql://neondb_owner:npg_kD7gbqN4uKnQ@ep-wandering-band-bdibtiqf-pooler.c-8.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
    },
    define: {
      'import.meta.env.VITE_DATABASE_URL': JSON.stringify(dbUrl),
    },
  };
});
