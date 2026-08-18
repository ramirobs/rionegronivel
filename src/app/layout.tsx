import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Nível Rio Negro",
  description:
    "App para monitorar perigos de enchente em RioMafra. Acompanhe o nível do Rio Negro em tempo real com dados da telemetria e alertas para Rio Negro (PR) e Mafra (SC).",
  keywords: [
    "enchente",
    "Rio Negro",
    "Mafra",
    "RioMafra",
    "nível do rio",
    "telemetria",
    "ANA",
    "SNIRH",
    "alerta",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nível Rio Negro",
  },
  openGraph: {
    title: "Nível Rio Negro",
    description: "App para monitorar perigos de enchente em RioMafra.",
    type: "website",
  },
};

import InstallPWABanner from "@/components/dashboard/install-pwa-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-slate-50">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white pb-safe">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 pt-safe">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/25 p-1.5">
                <svg
                  className="w-full h-full text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2.5C12 2.5 5 11.5 5 15.5C5 19.0899 8.13401 22 12 22C15.866 22 19 19.0899 19 15.5C19 11.5 12 2.5 12 2.5Z"
                    fill="currentColor"
                    fillOpacity="0.3"
                  />
                  <path
                    d="M12 2.5C12 2.5 5 11.5 5 15.5C5 19.0899 8.13401 22 12 22C15.866 22 19 19.0899 19 15.5C19 11.5 12 2.5 12 2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 16C8 14.5 10.5 14.5 12.5 16C14.5 17.5 17 17.5 18 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="9.5" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Nível Rio Negro
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    AO VIVO
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  App para monitorar perigos de enchente em RioMafra
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="hidden sm:inline">Telemetria ANA 65100001</span>
                <span className="sm:hidden text-[11px] font-bold">ANA 65100001</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 sm:py-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* Banner de Instalação PWA no Celular */}
        <InstallPWABanner />

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white mt-12 py-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
            <p>
              Dados transmitidos por telemetria via Agência Nacional de Águas (ANA) e SNIRH.
            </p>
            <p className="text-[11px] text-slate-400">
              Nível Rio Negro • App para monitorar perigos de enchente em RioMafra © 2026
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
