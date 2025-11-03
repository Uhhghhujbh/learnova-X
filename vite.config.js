import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        target: 'esnext',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor';
                        }
                        if (id.includes('date-fns') || id.includes('dompurify')) {
                            return 'utils';
                        }
                        if (id.includes('@supabase/supabase-js')) {
                            return 'supabase';
                        }
                    }
                }
            }
        }
    },
    server: {
        port: 3000,
        host: true
    }
});
