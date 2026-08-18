'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Locate,
  Info,
  Sliders,
  Radio,
} from 'lucide-react';
import { FLOOD_ZONES, CRITICAL_POINTS, type CriticalPoint, type FloodZone } from '@/data/flood-map-data';

interface FloodMapClientProps {
  currentLevel: number;
}

export default function FloodMapClient({ currentLevel }: FloodMapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Estados
  const [simulatedLevel, setSimulatedLevel] = useState<number>(currentLevel || 5.99);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<CriticalPoint | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Cota efetivamente ativa no mapa
  const effectiveLevel = isLiveMode ? (currentLevel || 5.99) : simulatedLevel;

  // 1. Inicialização do Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Coordenadas Centrais de Rio Negro e Mafra
    const initialLat = -26.111;
    const initialLng = -49.805;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false,
    });

    // Camada Base Inicial (OpenStreetMap)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 19,
    });

    streetLayer.addTo(map);

    // Controles de Zoom no Canto Superior Direito
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Grupos de Camadas para Mancha e Marcadores
    const layersGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    layersGroupRef.current = layersGroup;
    markersGroupRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Alternador de Camada Base (Ruas vs Satélite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove camadas de tiles existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapType === 'streets') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    } else {
      // Satélite de Alta Resolução da Esri
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri World Imagery',
          maxZoom: 18,
        }
      ).addTo(map);
    }
  }, [mapType]);

  // 3. Renderização Dinâmica das Manchas de Inundação e Marcadores baseados em effectiveLevel
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !layersGroup || !markersGroup) return;

    layersGroup.clearLayers();
    markersGroup.clearLayers();

    // A. Renderiza Polígonos de Inundação das faixas ativas
    FLOOD_ZONES.forEach((zone: FloodZone) => {
      if (effectiveLevel >= zone.minLevel) {
        zone.polygons.forEach((polyCoords) => {
          const polygon = L.polygon(polyCoords, {
            color: zone.strokeColor,
            weight: 2,
            opacity: 0.8,
            fillColor: zone.color,
            fillOpacity: zone.fillOpacity,
          });

          polygon.bindTooltip(
            `<strong>${zone.name}</strong><br/>Cota: a partir de ${zone.minLevel.toFixed(2)}m`,
            { sticky: true }
          );

          polygon.addTo(layersGroup);
        });
      }
    });

    // B. Renderiza Marcadores dos Pontos Críticos
    CRITICAL_POINTS.forEach((point: CriticalPoint) => {
      const isFlooded = effectiveLevel >= point.floodThreshold;
      const isBridge = point.type === 'bridge';
      const isStation = point.type === 'station';

      // Criação de Ícone HTML Customizado
      let iconColor = isFlooded ? '#ef4444' : '#10b981';
      if (isStation) {
        iconColor = '#0284c7';
      }

      const customHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background-color: ${iconColor};
          color: white;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${isBridge ? '🌉' : isStation ? '📏' : '📍'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(point.coordinates, { icon: customIcon });

      const diff = point.floodThreshold - effectiveLevel;
      const diffText =
        diff > 0
          ? `<span style="color: #10b981; font-weight: bold;">+${(diff * 100).toFixed(0)} cm de margem segura</span>`
          : `<span style="color: #ef4444; font-weight: bold;">🚨 Água ${(Math.abs(diff) * 100).toFixed(0)} cm acima da cota</span>`;

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 220px; font-size: 12px; color: #1e293b;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">
            ${point.city}
          </div>
          <h4 style="font-size: 14px; font-weight: 800; margin: 2px 0 6px 0; color: #0f172a;">
            ${point.name}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">
            ${point.description}
          </p>
          <div style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
            <div><strong>Cota Crítica:</strong> ${point.floodThreshold.toFixed(2)} m</div>
            <div><strong>Status Atual (${effectiveLevel.toFixed(2)}m):</strong> ${diffText}</div>
          </div>
          ${point.statusNotes ? `<div style="font-size: 11px; color: #64748b; font-style: italic;">${point.statusNotes}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedPoint(point);
      });

      marker.addTo(markersGroup);
    });
  }, [effectiveLevel]);

  // 4. Geolocalização do Usuário (GPS)
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        const map = mapInstanceRef.current;
        if (!map) return;

        map.flyTo([latitude, longitude], 15, { duration: 1.5 });

        // Marcador do Usuário
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        const userHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 24px; height: 24px; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: relative; width: 14px; height: 14px; background: #2563eb; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></span>
          </div>
        `;

        const userIcon = L.divIcon({
          html: userHtml,
          className: 'user-gps-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([latitude, longitude], { icon: userIcon })
          .bindPopup('<strong>📍 Sua Localização Atual</strong><br/>Posição identificada via GPS do seu aparelho.')
          .addTo(map);

        userMarkerRef.current = marker;
      },
      () => {
        setIsLocating(false);
        alert('Não foi possível obter a sua localização. Verifique as permissões de GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cenários Rápidos de Nível
  const quickScenarios = [
    { label: 'Nível Agora', level: currentLevel || 5.99, isLive: true },
    { label: 'Alerta Inicial (7.0m)', level: 7.0, isLive: false },
    { label: 'Ponte Metálica (8.5m)', level: 8.5, isLive: false },
    { label: 'Cheia 2023 (11.2m)', level: 11.2, isLive: false },
    { label: 'Cheia 1983 (14.5m)', level: 14.5, isLive: false },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de Controle de Cota e Simulação */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Simulador de Mancha de Inundação
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Arraste a cota para visualizar o avanço das águas sobre as ruas e pontes
              </p>
            </div>
          </div>

          {/* Modo Ao Vivo vs Simulação */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLiveMode(true);
                setSimulatedLevel(currentLevel || 5.99);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLiveMode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${isLiveMode ? 'animate-pulse' : ''}`} />
              <span>Nível em Tempo Real ({currentLevel.toFixed(2)}m)</span>
            </button>
          </div>
        </div>

        {/* Slider Interativo de Nível */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Cota Selecionada no Mapa:</span>
            <span className="text-xl font-black text-blue-600 tracking-tight">
              {effectiveLevel.toFixed(2)} <span className="text-sm font-semibold text-slate-400">m</span>
            </span>
          </div>

          <input
            type="range"
            min="4.0"
            max="15.0"
            step="0.1"
            value={effectiveLevel}
            onChange={(e) => {
              setIsLiveMode(false);
              setSimulatedLevel(parseFloat(e.target.value));
            }}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Marcadores de Referência abaixo do slider */}
          <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-1">
            <span>4.0m (Normal)</span>
            <span>7.0m (Alerta)</span>
            <span>8.5m (Ponte)</span>
            <span>11.2m (2023)</span>
            <span>14.5m (1983)</span>
          </div>
        </div>

        {/* Botões de Cenários Pré-Definidos */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1">Cenários Rápidos:</span>
          {quickScenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsLiveMode(sc.isLive);
                setSimulatedLevel(sc.level);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                Math.abs(effectiveLevel - sc.level) < 0.05
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contêiner Principal do Mapa Leaflet */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md h-[550px] sm:h-[620px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Botões Flutuantes de Ação no Mapa */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {/* Alternador de Camadas (Ruas / Satélite) */}
          <button
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 shadow-md text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Alternar entre visualização de Ruas e Satélite"
          >
            <Layers className="h-4 w-4 text-blue-600" />
            <span>{mapType === 'streets' ? 'Satélite' : 'Ruas'}</span>
          </button>

          {/* Botão de Localização GPS */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 shadow-md text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Ver onde estou no mapa"
          >
            <Locate className={`h-4 w-4 ${isLocating ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
            <span>{isLocating ? 'Buscando GPS...' : 'Onde Estou'}</span>
          </button>
        </div>

        {/* Legenda de Risco Retrátil no Canto Inferior Esquerdo */}
        <div className="absolute bottom-3 left-3 z-20 max-w-[280px] sm:max-w-xs">
          {showLegend ? (
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span>Legenda da Mancha</span>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Recolher legenda"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#0284c7] opacity-80 shrink-0" />
                  <span><strong>6,5m a 7,5m:</strong> Várzeas & Passa Três</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#f59e0b] opacity-80 shrink-0" />
                  <span><strong>7,5m a 9,0m:</strong> Vila Argentina & Ivete</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#f97316] opacity-80 shrink-0" />
                  <span><strong>9,0m a 11,0m:</strong> Centro & Pontes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#ef4444] opacity-80 shrink-0" />
                  <span><strong>&gt; 11,0m:</strong> Cheia Extrema (2023/1983)</span>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-slate-500 font-medium border-t border-slate-100">
                Toque nos marcadores 🌉 para ver a cota de cada ponte.
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLegend(true)}
              className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <span>Ver Legenda</span>
            </button>
          )}
        </div>

        {/* Resumo do Ponto Selecionado no Topo Direito */}
        {selectedPoint && (
          <div className="absolute top-3 right-12 z-20 max-w-[260px] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-bold text-slate-900 pb-1">
              <span className="truncate">{selectedPoint.name}</span>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 ml-2"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">{selectedPoint.description}</p>
            <div className="mt-2 text-[11px] font-bold">
              Cota Limite: <span className="text-blue-600">{selectedPoint.floodThreshold.toFixed(2)}m</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabela Rápida de Status das Pontes de RioMafra */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Status das Pontes de Ligação (Rio Negro ⇄ Mafra) na Cota de {effectiveLevel.toFixed(2)}m:
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CRITICAL_POINTS.filter((p) => p.type === 'bridge').map((bridge) => {
            const isBlocked = effectiveLevel >= bridge.floodThreshold;
            const margin = bridge.floodThreshold - effectiveLevel;

            return (
              <div
                key={bridge.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isBlocked
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="truncate">{bridge.name.split('(')[0]}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isBlocked ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isBlocked ? 'INTERDITADA' : 'ABERTA'}
                  </span>
                </div>
                <div className="text-[11px] font-medium mt-1.5 opacity-90">
                  Cota limite: <strong>{bridge.floodThreshold.toFixed(2)} m</strong>
                </div>
                <div className="text-[11px] font-bold mt-0.5">
                  {margin > 0 ? (
                    <span className="text-emerald-700">Margem segura: +{(margin * 100).toFixed(0)} cm</span>
                  ) : (
                    <span className="text-rose-700">Água {(Math.abs(margin) * 100).toFixed(0)} cm acima</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
