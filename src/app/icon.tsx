import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #091428 0%, #031d44 50%, #020c1b 100%)',
          borderRadius: '24%',
          position: 'relative',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* Glow ambient de alerta e água */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(245, 158, 11, 0) 70%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.5) 0%, rgba(2, 132, 199, 0) 70%)',
          }}
        />

        {/* Borda externa com reflexo de vidro */}
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            borderRadius: '22%',
            border: '2px solid rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* Ilustração Central: Triângulo de Alerta de Enchente + Régua + Ondas do Rio */}
        <svg
          width="360"
          height="360"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradiente do Triângulo de Alerta */}
            <linearGradient id="alertTriangleGrad" x1="50" y1="12" x2="50" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" />
              <stop offset="0.6" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>

            {/* Gradiente da Água / Enchente */}
            <linearGradient id="waterSurgeGrad" x1="50" y1="52" x2="50" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.4" stopColor="#0284c7" />
              <stop offset="1" stopColor="#034d82" />
            </linearGradient>

            {/* Gradiente da Régua */}
            <linearGradient id="rulerGrad" x1="78" y1="28" x2="78" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="0.4" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Sombra / Glow do Triângulo */}
          <path
            d="M50 14L86 78C88 81.5 85.5 86 81.5 86H18.5C14.5 86 12 81.5 14 78L50 14Z"
            fill="rgba(245, 158, 11, 0.15)"
          />

          {/* Triângulo Principal de Emergência */}
          <path
            d="M50 16L83.5 76.5C85 79.5 83 83 79.5 83H20.5C17 83 15 79.5 16.5 76.5L50 16Z"
            stroke="url(#alertTriangleGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Símbolo de Exclamação (!) no Topo do Triângulo */}
          <path
            d="M50 31V49"
            stroke="#fbbf24"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="57" r="2.8" fill="#fbbf24" />

          {/* Ondas Subindo (Cheia do Rio Negro) */}
          {/* Camada de Água de Fundo */}
          <path
            d="M17 72C25 66 35 66 45 71C55 76 65 76 75 70C79 67.5 82.5 70 83 75.5V81.5C82.5 82.5 81 83 79.5 83H20.5C18 83 17 81.5 16.5 79L17 72Z"
            fill="#0369a1"
            opacity="0.8"
          />

          {/* Camada de Água Frontal em Elevação */}
          <path
            d="M18 76C27 71 37 71 47 76C57 81 67 81 76 75C78.5 73.5 81 75 82 78.5V81.5C81.5 82.5 80.5 83 79.5 83H20.5C18.5 83 17.5 82 17 80.5L18 76Z"
            fill="url(#waterSurgeGrad)"
          />

          {/* Crista de Espuma da Onda Branca */}
          <path
            d="M18 76C27 71 37 71 47 76C57 81 67 81 77 75"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Régua Fluviométrica Vertical com Níveis de Perigo */}
          <rect x="74" y="32" width="5" height="42" rx="2.5" fill="#0f172a" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          {/* Ticks da Régua */}
          <line x1="74" y1="38" x2="79" y2="38" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="74" y1="46" x2="78" y2="46" stroke="#f97316" strokeWidth="1.5" />
          <line x1="74" y1="54" x2="78" y2="54" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="74" y1="62" x2="78" y2="62" stroke="#10b981" strokeWidth="1.5" />
          <line x1="74" y1="70" x2="79" y2="70" stroke="#0284c7" strokeWidth="1.5" />

          {/* Ponto / Farol de Alerta no Topo */}
          <circle cx="50" cy="16" r="3.5" fill="#ffffff" />
          <circle cx="50" cy="16" r="7" stroke="rgba(251, 191, 36, 0.6)" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
