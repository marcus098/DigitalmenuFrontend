import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'REACT_APP_');

    // Replicate CRA: expose every REACT_APP_* var via process.env at build time.
    // Keeps existing call sites (`process.env.REACT_APP_FOO`) working unchanged.
    const processEnv: Record<string, string> = { NODE_ENV: mode };
    for (const [k, v] of Object.entries(env)) {
        if (k.startsWith('REACT_APP_')) processEnv[k] = v;
    }
    const define: Record<string, string> = {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env': JSON.stringify(processEnv),
    };

    return {
        plugins: [react()],
        envPrefix: ['REACT_APP_', 'VITE_'],
        define,
        server: {
            port: 3000,
            host: true,
            strictPort: true,
            open: false,
        },
        preview: {
            port: 3000,
            strictPort: true,
        },
        build: {
            outDir: 'build',
            sourcemap: process.env.GENERATE_SOURCEMAP === 'true',
            chunkSizeWarningLimit: 1024,
            rollupOptions: {
                output: {
                    manualChunks: (id: string) => {
                        if (!id.includes('node_modules')) return undefined;
                        if (/[\\/]react(-dom|-router-dom)?[\\/]/.test(id)) return 'react-vendor';
                        if (id.includes('framer-motion')) return 'framer-motion';
                        if (id.includes('@sentry')) return 'sentry';
                        if (id.includes('@stripe')) return 'stripe';
                        if (id.includes('i18next')) return 'i18n';
                        if (/lucide-react|react-icons|@heroicons|@fortawesome/.test(id)) return 'icons';
                        if (id.includes('@radix-ui')) return 'radix';
                        if (/@hello-pangea[\\/]dnd|react-grid-layout|react-resizable/.test(id)) return 'dnd-grid';
                        if (/qrcode\.react|react-qr-code|react-qr-scanner/.test(id)) return 'qr';
                        if (id.includes('@lottiefiles')) return 'lottie';
                        if (/axios|clsx|tailwind-merge|tailwind-variants|class-variance-authority/.test(id)) return 'utils';
                        return undefined;
                    },
                },
            },
        },
    };
});
