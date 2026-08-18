// ============================================================================
// DADOS GEOESPACIAIS: MANCHA DE INUNDAÇÃO & PONTOS CRÍTICOS (RIO NEGRO / MAFRA)
// ============================================================================

export interface FloodZone {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  fillOpacity: number;
  strokeColor: string;
  severity: 'normal' | 'attention' | 'alert' | 'emergency' | 'catastrophic';
  description: string;
  affectedAreas: string[];
  // Coordenadas dos polígonos [lat, lng][]
  polygons: [number, number][][];
}

export interface CriticalPoint {
  id: string;
  name: string;
  type: 'bridge' | 'neighborhood' | 'station' | 'shelter';
  city: 'Rio Negro (PR)' | 'Mafra (SC)' | 'Intermunicipal';
  coordinates: [number, number];
  floodThreshold: number; // Em metros
  description: string;
  evacuationLevel?: number;
  statusNotes?: string;
}

// ----------------------------------------------------------------------------
// 1. PONTOS DE INTERESSE CRÍTICOS GEORREFERENCIADOS
// ----------------------------------------------------------------------------
export const CRITICAL_POINTS: CriticalPoint[] = [
  {
    id: 'ana-station',
    name: 'Estação Fluviométrica ANA (65100001)',
    type: 'station',
    city: 'Intermunicipal',
    coordinates: [-26.1085, -49.8028],
    floodThreshold: 5.0,
    description: 'Estação oficial de telemetria da Agência Nacional de Águas.',
    statusNotes: 'Referência oficial de medição de nível e vazão de RioMafra.',
  },
  {
    id: 'ponte-metalica',
    name: 'Ponte Metálica (Dr. Diniz Assis Henning)',
    type: 'bridge',
    city: 'Intermunicipal',
    coordinates: [-26.1082, -49.8032],
    floodThreshold: 8.5,
    description: 'Ligação histórica central entre Rio Negro e Mafra.',
    statusNotes: 'Acesso e cabeceiras são bloqueados pela água a partir de 8,50m.',
  },
  {
    id: 'ponte-rodrigo-ajuz',
    name: 'Ponte Rodrigo Ajuz (Centro)',
    type: 'bridge',
    city: 'Intermunicipal',
    coordinates: [-26.1128, -49.7985],
    floodThreshold: 11.0,
    description: 'Ponte de concreto da Rua Cel. Ary Rauen.',
    statusNotes: 'Ponte mais alta da área central; interdição ocorre acima de 11,00m.',
  },
  {
    id: 'ponte-severiano-maia',
    name: 'Ponte Cel. Severiano Maia (Vila Nova)',
    type: 'bridge',
    city: 'Intermunicipal',
    coordinates: [-26.1012, -49.8162],
    floodThreshold: 10.5,
    description: 'Ligação entre o Bairro Estação Nova (RN) e Vila Nova (Mafra).',
    statusNotes: 'Acessos começam a ser inundados com 10,50m.',
  },
  {
    id: 'ponte-br116',
    name: 'Ponte Interestadual BR-116',
    type: 'bridge',
    city: 'Intermunicipal',
    coordinates: [-26.128, -49.782],
    floodThreshold: 15.0,
    description: 'Rodovia Federal BR-116 (Auto Pista Planalto Sul).',
    statusNotes: 'Cota de passagem elevada; trânsito livre mesmo em cheias extremas.',
  },
  // Bairros Rio Negro (PR)
  {
    id: 'rn-passa-tres',
    name: 'Bairro Passa Três',
    type: 'neighborhood',
    city: 'Rio Negro (PR)',
    coordinates: [-26.118, -49.789],
    floodThreshold: 6.5,
    description: 'Área baixa ribeirinha na entrada de Rio Negro.',
    evacuationLevel: 7.0,
    statusNotes: 'Primeiras áreas a serem atingidas pelo transbordamento do leito.',
  },
  {
    id: 'rn-rua-sao-joao',
    name: 'Rua São João / Volta Grande',
    type: 'neighborhood',
    city: 'Rio Negro (PR)',
    coordinates: [-26.1095, -49.794],
    floodThreshold: 6.8,
    description: 'Região densamente povoada no Bairro Volta Grande.',
    evacuationLevel: 7.2,
    statusNotes: 'Água invade calçadas e garagens a partir de 6,80m.',
  },
  {
    id: 'rn-estacao-nova',
    name: 'Bairro Estação Nova',
    type: 'neighborhood',
    city: 'Rio Negro (PR)',
    coordinates: [-26.103, -49.808],
    floodThreshold: 8.2,
    description: 'Região próxima à antiga ferrovia e áreas baixas da estação.',
    evacuationLevel: 8.8,
  },
  {
    id: 'rn-centro',
    name: 'Centro Histórico / Praça João Pessoa',
    type: 'neighborhood',
    city: 'Rio Negro (PR)',
    coordinates: [-26.106, -49.801],
    floodThreshold: 10.2,
    description: 'Área comercial central e Praça João Pessoa.',
    evacuationLevel: 10.5,
    statusNotes: 'Atingido somente em enchentes graves (como 2023 e 1983).',
  },
  // Bairros Mafra (SC)
  {
    id: 'mafra-vila-argentina',
    name: 'Vila Argentina (Rua Nicolau Bley Neto)',
    type: 'neighborhood',
    city: 'Mafra (SC)',
    coordinates: [-26.111, -49.807],
    floodThreshold: 7.2,
    description: 'Bairro histórico com áreas de várzea.',
    evacuationLevel: 7.5,
    statusNotes: 'Atinge residências e acessos na baixada a partir de 7,20m.',
  },
  {
    id: 'mafra-vila-ivete',
    name: 'Vila Ivete (Baixada)',
    type: 'neighborhood',
    city: 'Mafra (SC)',
    coordinates: [-26.119, -49.814],
    floodThreshold: 7.6,
    description: 'Região residencial no setor sul de Mafra.',
    evacuationLevel: 8.0,
  },
  {
    id: 'mafra-centro-frederico-heyse',
    name: 'Av. Prefeito Frederico Heyse / Centro',
    type: 'neighborhood',
    city: 'Mafra (SC)',
    coordinates: [-26.112, -49.804],
    floodThreshold: 8.8,
    description: 'Avenida de ligação e comércios no centro de Mafra.',
    evacuationLevel: 9.2,
    statusNotes: 'Água invade a pista e comércios a partir de 8,80m.',
  },
  {
    id: 'mafra-buenos-aires',
    name: 'Bairro Buenos Aires / Campo do Gado',
    type: 'neighborhood',
    city: 'Mafra (SC)',
    coordinates: [-26.104, -49.813],
    floodThreshold: 8.0,
    description: 'Região ribeirinha na curva norte do rio.',
    evacuationLevel: 8.5,
  },
];

// ----------------------------------------------------------------------------
// 2. FAIXAS DE MANCHA DE INUNDAÇÃO (POLÍGONOS GEOESPACIAIS DE RIO NEGRO / MAFRA)
// ----------------------------------------------------------------------------
export const FLOOD_ZONES: FloodZone[] = [
  {
    id: 'zone-1',
    name: 'Faixa 1: Várzea & Primeiras Áreas Baixas (6,50m a 7,50m)',
    minLevel: 6.5,
    maxLevel: 7.5,
    color: '#0284c7', // Sky / Cyan Blue
    strokeColor: '#0369a1',
    fillOpacity: 0.45,
    severity: 'attention',
    description: 'Transbordamento do leito regular atingindo várzeas, Passa Três e baixada da Rua São João.',
    affectedAreas: ['Passa Três (RN)', 'Rua São João baixa (RN)', 'Baixada da Vila Argentina (Mafra)'],
    polygons: [
      // Polígono da Faixa 1 (Leito estendido e várzeas imediatas)
      [
        [-26.132, -49.778],
        [-26.126, -49.784],
        [-26.121, -49.788],
        [-26.117, -49.791],
        [-26.113, -49.796],
        [-26.109, -49.801],
        [-26.107, -49.804],
        [-26.104, -49.809],
        [-26.101, -49.814],
        [-26.098, -49.821],
        [-26.095, -49.828],
        // Margem Oposta (Mafra)
        [-26.097, -49.829],
        [-26.102, -49.822],
        [-26.106, -49.816],
        [-26.109, -49.811],
        [-26.112, -49.807],
        [-26.115, -49.803],
        [-26.118, -49.798],
        [-26.122, -49.793],
        [-26.127, -49.789],
        [-26.133, -49.783],
      ],
      // Braço adicional Passa Três
      [
        [-26.119, -49.787],
        [-26.116, -49.789],
        [-26.118, -49.793],
        [-26.121, -49.791],
      ],
    ],
  },
  {
    id: 'zone-2',
    name: 'Faixa 2: Alagamento Residencial Médio (7,50m a 9,00m)',
    minLevel: 7.5,
    maxLevel: 9.0,
    color: '#f59e0b', // Amber / Gold
    strokeColor: '#d97706',
    fillOpacity: 0.5,
    severity: 'alert',
    description: 'Inundação em ruas pavimentadas, Vila Argentina, Vila Ivete Baixa e bloqueio de acesso à Ponte Metálica.',
    affectedAreas: [
      'Vila Argentina (Mafra)',
      'Vila Ivete Baixa (Mafra)',
      'Rua São João (RN)',
      'Acesso Ponte Metálica',
      'Av. Frederico Heyse parcial (Mafra)',
    ],
    polygons: [
      [
        [-26.135, -49.774],
        [-26.128, -49.781],
        [-26.122, -49.786],
        [-26.116, -49.789],
        [-26.111, -49.793],
        [-26.107, -49.798],
        [-26.104, -49.804],
        [-26.101, -49.811],
        [-26.097, -49.819],
        [-26.092, -49.831],
        // Margem de Mafra expandida
        [-26.096, -49.833],
        [-26.103, -49.824],
        [-26.108, -49.818],
        [-26.113, -49.812],
        [-26.117, -49.808],
        [-26.121, -49.803],
        [-26.126, -49.797],
        [-26.131, -49.791],
        [-26.136, -49.782],
      ],
      // Envoltória Vila Argentina / Rua Nicolau Bley Neto
      [
        [-26.109, -49.805],
        [-26.112, -49.806],
        [-26.114, -49.81],
        [-26.111, -49.809],
      ],
    ],
  },
  {
    id: 'zone-3',
    name: 'Faixa 3: Enchente Severa Urbana (9,00m a 11,00m)',
    minLevel: 9.0,
    maxLevel: 11.0,
    color: '#f97316', // Orange
    strokeColor: '#ea580c',
    fillOpacity: 0.55,
    severity: 'emergency',
    description: 'Inundação do centro comercial, interdição de pontes urbanas e evacuação em massa dos bairros baixos.',
    affectedAreas: [
      'Centro de Mafra (Av. Frederico Heyse)',
      'Bairro Volta Grande / RN',
      'Ponte Cel. Severiano Maia',
      'Bairro Buenos Aires (Mafra)',
      'Estação Nova (RN)',
    ],
    polygons: [
      [
        [-26.138, -49.771],
        [-26.13, -49.778],
        [-26.123, -49.784],
        [-26.115, -49.787],
        [-26.109, -49.791],
        [-26.104, -49.796],
        [-26.1, -49.803],
        [-26.096, -49.812],
        [-26.091, -49.822],
        [-26.088, -49.835],
        // Margem de Mafra
        [-26.093, -49.838],
        [-26.101, -49.827],
        [-26.107, -49.821],
        [-26.114, -49.815],
        [-26.12, -49.81],
        [-26.126, -49.805],
        [-26.132, -49.798],
        [-26.137, -49.789],
        [-26.141, -49.779],
      ],
      // Área comercial de Mafra
      [
        [-26.11, -49.802],
        [-26.114, -49.804],
        [-26.116, -49.807],
        [-26.112, -49.805],
      ],
    ],
  },
  {
    id: 'zone-4',
    name: 'Faixa 4: Cheia Extrema / Catastrófica (Acima de 11,00m)',
    minLevel: 11.0,
    maxLevel: 15.0,
    color: '#ef4444', // Red / Rose
    strokeColor: '#dc2626',
    fillOpacity: 0.6,
    severity: 'catastrophic',
    description: 'Nível histórico comparável a Outubro/2023 (11,20m) e Julho/1983 (14,57m). Inundação da Praça João Pessoa e centros históricos.',
    affectedAreas: [
      'Praça João Pessoa (Centro Rio Negro)',
      'Rua 7 de Setembro (RN)',
      'Centro Histórico de Mafra',
      'Ponte Rodrigo Ajuz submersa',
      'Isolamento viário total intermunicipal',
    ],
    polygons: [
      [
        [-26.142, -49.768],
        [-26.133, -49.775],
        [-26.125, -49.781],
        [-26.114, -49.784],
        [-26.107, -49.788],
        [-26.101, -49.793],
        [-26.096, -49.8],
        [-26.091, -49.811],
        [-26.086, -49.824],
        [-26.082, -49.839],
        // Margem de Mafra
        [-26.089, -49.843],
        [-26.098, -49.831],
        [-26.105, -49.824],
        [-26.113, -49.818],
        [-26.121, -49.813],
        [-26.128, -49.808],
        [-26.136, -49.8],
        [-26.142, -49.791],
        [-26.147, -49.777],
      ],
      // Inundação total Praça João Pessoa (RN)
      [
        [-26.104, -49.798],
        [-26.107, -49.801],
        [-26.109, -49.803],
        [-26.105, -49.8],
      ],
    ],
  },
];
