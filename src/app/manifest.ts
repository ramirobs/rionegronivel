import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nível Rio Negro — App para Monitorar Perigos de Enchente em RioMafra',
    short_name: 'Nível Rio Negro',
    description: 'App para monitorar perigos de enchente em RioMafra.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0284c7',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
