// ============================================================
// Nível Rio Negro — Constantes e Configuração
// ============================================================

// ----- Estações da Bacia do Rio Negro -----

export const STATIONS = {
  // Estação principal — Fluviométrica (nível + vazão)
  RIO_NEGRO_FLUV: {
    code: '65100001',
    name: 'Rio Negro',
    river: 'Rio Negro',
    type: 'fluviometric' as const,
    lat: -26.1114,
    lon: -49.8044,
    city: 'Rio Negro',
    state: 'PR',
  },
  // Estações pluviométricas na bacia
  RIO_NEGRO_PLUV: {
    code: '02649006',
    name: 'Rio Negro',
    river: 'Rio Negro',
    type: 'pluviometric' as const,
    lat: -26.10,
    lon: -49.80,
    city: 'Rio Negro',
    state: 'PR',
  },
} as const;

export const PRIMARY_STATION = STATIONS.RIO_NEGRO_FLUV;

// ----- Limiares de Risco (metros) -----

export const RISK_THRESHOLDS = {
  NORMAL: 5.0,     // < 5.0m → Verde
  ATTENTION: 5.0,  // >= 5.0m → Amarelo
  ALERT: 6.0,      // >= 6.0m → Laranja
  EMERGENCY: 7.0,  // >= 7.0m → Vermelho (enchente)
} as const;

export type RiskLevel = 'normal' | 'attention' | 'alert' | 'emergency';

export interface RiskConfig {
  level: RiskLevel;
  label: string;
  labelPt: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  description: string;
}

export const RISK_LEVELS: Record<RiskLevel, RiskConfig> = {
  normal: {
    level: 'normal',
    label: 'Normal',
    labelPt: 'Normal',
    color: '#22C55E',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    emoji: '🟢',
    description: 'Nível do rio dentro da faixa normal. Sem risco.',
  },
  attention: {
    level: 'attention',
    label: 'Attention',
    labelPt: 'Atenção',
    color: '#EAB308',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    emoji: '🟡',
    description: 'Nível elevado. Monitoramento ativo recomendado.',
  },
  alert: {
    level: 'alert',
    label: 'Alert',
    labelPt: 'Alerta',
    color: '#F97316',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    emoji: '🟠',
    description: 'Risco de alagamento em áreas baixas de Mafra e Rio Negro.',
  },
  emergency: {
    level: 'emergency',
    label: 'Emergency',
    labelPt: 'Emergência',
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    emoji: '🔴',
    description: 'Enchente confirmada. Áreas ribeirinhas alagadas.',
  },
} as const;

// ----- Configuração de Atualização -----

export const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
export const REVALIDATE_SECONDS = 1800; // ISR: 30 minutos

export const ANA_BASE_URL_REST = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas';
export const ANA_BASE_URL_SOAP = 'http://telemetriaws1.ana.gov.br/ServiceANA.asmx';

export const ANA_ENDPOINTS = {
  // Novos endpoints REST
  AUTH: `${ANA_BASE_URL_REST}/OAUth/v1`,
  INVENTORY_REST: `${ANA_BASE_URL_REST}/HidroInventarioEstacoes/v1`,
  TELEMETRIC_ADOPTED: `${ANA_BASE_URL_REST}/HidroinfoanaSerieTelemetricaAdotada/v1`,
  TELEMETRIC_DETAILED: `${ANA_BASE_URL_REST}/HidroinfoanaSerieTelemetricaDetalhada/v1`,

  // Antigos endpoints SOAP (Legado)
  INVENTORY_SOAP: `${ANA_BASE_URL_SOAP}/HidroInventario`,
  HISTORICAL_SOAP: `${ANA_BASE_URL_SOAP}/HidroSerieHistorica`,
  TELEMETRIC_SOAP: `${ANA_BASE_URL_SOAP}/DadosHidrometeorologicos`,
  TELEMETRIC_STATIONS_SOAP: `${ANA_BASE_URL_SOAP}/ListaEstacoesTelemetricas`,
} as const;

// ----- Dados do SNIRH (fallback) -----

export const SNIRH_BASE_URL = 'https://www.snirh.gov.br/hidrotelemetria';

export const SNIRH_STATION = {
  estCodigo: '260649480',
  codEstacao: '65100001',
  idEstacao: '260649480',
} as const;

// ----- Tipos Re-exportados -----

export type { RiverDataPoint, AnaDataType } from './ana-api';
export type { TrendDirection, TrendResult, DailyAggregatedData, AnnualMax } from './data-processing';
export type { GumbelParameters, ReturnPeriodRow, SummaryStatistics } from './statistics';

