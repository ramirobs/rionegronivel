import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hidro Alert — Simulador de Enchentes Rio Negro e Mafra',
    short_name: 'Hidro Alert',
    description: 'Monitoramento em tempo real do nível do Rio Negro e previsão de cheias.',
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
