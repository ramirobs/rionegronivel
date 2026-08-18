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
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0f172a 100%)',
          borderRadius: '24%',
          position: 'relative',
          overflow: 'hidden',
          padding: '24px',
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(56, 189, 248, 0) 70%)',
          }}
        />

        {/* Soft bottom glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-15%',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0) 70%)',
          }}
        />

        {/* Outer squircle highlight ring */}
        <div
          style={{
            position: 'absolute',
            inset: '12px',
            borderRadius: '22%',
            border: '2px solid rgba(255, 255, 255, 0.18)',
          }}
        />

        {/* Central Icon Illustration (Water Droplet + Dynamic River Waves + Telemetry Pulse) */}
        <svg
          width="320"
          height="320"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glowing Droplet Shape */}
          <path
            d="M50 8C50 8 18 48 18 68C18 85.6731 32.3269 92 50 92C67.6731 92 82 85.6731 82 68C82 48 50 8 50 8Z"
            fill="url(#dropletGrad)"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="2.5"
          />

          {/* Deep River Wave Layer */}
          <path
            d="M20 72C28 65 38 65 48 71C58 77 68 77 80 70V84C74 89 62 92 50 92C38 92 26 89 20 84V72Z"
            fill="#0369a1"
            opacity="0.75"
          />

          {/* Front Dynamic River Surge Wave */}
          <path
            d="M21 78C30 73 40 73 50 78C60 83 70 83 79 77V81C72 88 61 92 50 92C39 92 28 88 21 81V78Z"
            fill="#38bdf8"
          />

          {/* Crest Highlight Curve */}
          <path
            d="M21 78C30 73 40 73 50 78C60 83 70 83 79 77"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Top Telemetry Alert Pulse Dot */}
          <circle cx="50" cy="40" r="5.5" fill="#ffffff" />
          <circle cx="50" cy="40" r="10" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
          <circle cx="50" cy="40" r="15" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Gradients definitions */}
          <defs>
            <linearGradient id="dropletGrad" x1="50" y1="8" x2="50" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
