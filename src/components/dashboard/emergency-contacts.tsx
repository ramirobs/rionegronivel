import { Phone, Shield, Home, Backpack, CheckCircle2, AlertCircle, HeartHandshake } from 'lucide-react';

export default function EmergencyContacts() {
  const primaryHotlines = [
    {
      name: 'Corpo de Bombeiros',
      number: '193',
      tel: 'tel:193',
      desc: 'Resgate, evacuação de áreas alagadas e salvamento aquático.',
      badge: 'Plantão 24h',
      highlight: true,
    },
    {
      name: 'Defesa Civil Nacional',
      number: '199',
      tel: 'tel:199',
      desc: 'Emergências hidrológicas, desastres e chamados prioritários.',
      badge: 'Plantão 24h',
      highlight: true,
    },
    {
      name: 'SAMU (Urgências Médicas)',
      number: '192',
      tel: 'tel:192',
      desc: 'Atendimento médico pré-hospitalar e transporte de enfermos.',
      badge: 'Plantão 24h',
      highlight: false,
    },
    {
      name: 'Polícia Militar',
      number: '190',
      tel: 'tel:190',
      desc: 'Segurança pública, patrulhamento de áreas desocupadas e trânsito.',
      badge: 'Plantão 24h',
      highlight: false,
    },
  ];

  const localCivilDefense = [
    {
      city: 'Defesa Civil — Mafra (SC)',
      landline: '(47) 3641-4000',
      landlineTel: 'tel:4736414000',
      mobile: '(47) 99110-5345',
      mobileTel: 'tel:47991105345',
      desc: 'Prefeitura de Mafra / Atendimento a abrigados e transporte de mudanças.',
    },
    {
      city: 'Defesa Civil — Rio Negro (PR)',
      landline: '(47) 3642-3280',
      landlineTel: 'tel:4736423280',
      mobile: '(47) 99171-7788',
      mobileTel: 'tel:47991717788',
      desc: 'Prefeitura de Rio Negro / Ação social, caminhões de auxílio e abrigos.',
    },
  ];

  const officialShelters = [
    {
      city: 'Mafra (SC)',
      places: [
        { name: 'Ginásio de Esportes Wilson Buch', addr: 'Centro / Av. Cel. José Severiano Maia' },
        { name: 'EEB Barão de Antonina', addr: 'Rua Mathias Piechnick - Centro' },
        { name: 'Pavilhão São José', addr: 'Bairro Vila Nova' },
      ],
    },
    {
      city: 'Rio Negro (PR)',
      places: [
        { name: 'Ginásio de Esportes José Muller', addr: 'Bairro Estação Nova' },
        { name: 'Colégio Estadual Caetano Munhoz da Rocha', addr: 'Centro Histórico' },
        { name: 'Pavilhão São João Batista', addr: 'Bairro Campo Raso' },
      ],
    },
  ];

  const emergencyKit = [
    'Documentos pessoais e cartões do SUS em sacos plásticos impermeáveis',
    'Medicamentos de uso contínuo para no mínimo 7 dias e receitas médicas',
    'Garrafas de água mineral e alimentos não perecíveis (barras de cereal, biscoitos)',
    'Lanterna com pilhas reservas e carregador de celular com powerbank',
    'Muda de roupas secas, agasalhos, cobertores e calçados fechados',
    'Itens de higiene pessoal (papel higiênico, escova, pasta e sabonete)',
    'Coleira, guia, ração e medicação para seus animais de estimação',
  ];

  return (
    <div className="space-y-6">
      {/* 1. Telefones Diretos de Emergência (Hotlines) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Telefones Diretos de Socorro e Emergência</h3>
            <p className="text-xs text-slate-500 font-medium">
              Linhas gratuitas de discagem rápida com atendimento prioritário 24 horas por dia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {primaryHotlines.map((c, i) => (
            <a
              key={i}
              href={c.tel}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-sm ${
                c.highlight
                  ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50 text-rose-950'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    {c.name}
                  </span>
                  <Phone className={`h-4 w-4 ${c.highlight ? 'text-rose-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className={`text-2xl font-black ${c.highlight ? 'text-rose-700' : 'text-slate-900'}`}>
                    {c.number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                    {c.badge}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                {c.desc}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* 2. Plantões Municipais da Defesa Civil (Rio Negro e Mafra) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Plantões Municipais da Defesa Civil</h3>
            <p className="text-xs text-slate-500 font-medium">
              Contatos diretos das prefeituras para solicitação de caminhão de mudança e abrigo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localCivilDefense.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-600" />
                {item.city}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {item.desc}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={item.landlineTel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>Fixo: {item.landline}</span>
                </a>
                <a
                  href={item.mobileTel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Plantão: {item.mobile}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Abrigos Públicos Oficiais & Pontos de Acolhimento */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Abrigos Públicos Tradicionais de RioMafra</h3>
            <p className="text-xs text-slate-500 font-medium">
              Locais estruturados pelas prefeituras para receber famílias em situações de enchente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {officialShelters.map((group, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1.5">
                Abrigos em {group.city}
              </span>
              <ul className="space-y-2">
                {group.places.map((p, pIdx) => (
                  <li key={pIdx} className="text-xs flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">{p.name}</strong>
                      <span className="text-slate-500 text-[11px]">{p.addr}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Mochila de Emergência (O que levar ao sair de casa) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Backpack className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Mochila de Emergência — O que Levar</h3>
            <p className="text-xs text-slate-500 font-medium">
              Prepare com antecedência caso resida em área de risco de alagamento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {emergencyKit.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

