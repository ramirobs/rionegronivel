import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nível Rio Negro',
    short_name: 'Nível Rio Negro',
    description: 'Monitoramento e alerta de enchentes em Rio Negro (PR) e Mafra (SC).',
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
