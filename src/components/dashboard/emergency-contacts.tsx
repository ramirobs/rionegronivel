'use client';

import { Phone, Shield, ExternalLink, MapPin } from 'lucide-react';

export default function EmergencyContacts() {
  const contacts = [
    {
      name: 'Defesa Civil Nacional / Emergências',
      number: '199',
      tel: 'tel:199',
      desc: 'Plantão 24h para emergências hidrológicas e desastres.',
      highlight: true,
    },
    {
      name: 'Corpo de Bombeiros',
      number: '193',
      tel: 'tel:193',
      desc: 'Resgate, evacuação de ilhados e salvamento aquático.',
      highlight: true,
    },
    {
      name: 'Defesa Civil — Mafra (SC)',
      number: '(47) 3641-4000',
      tel: 'tel:4736414000',
      desc: 'Prefeitura de Mafra / Atendimento a abrigados.',
      highlight: false,
    },
    {
      name: 'Defesa Civil — Rio Negro (PR)',
      number: '(47) 3642-3280',
      tel: 'tel:4736423280',
      desc: 'Prefeitura de Rio Negro / Ação social e abrigos.',
      highlight: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Telefones Úteis e Emergência</h3>
          <p className="text-xs text-slate-500 font-medium">
            Canais diretos de socorro e apoio para Rio Negro (PR) e Mafra (SC)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {contacts.map((c, i) => (
          <a
            key={i}
            href={c.tel}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-sm ${
              c.highlight
                ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50 text-rose-950'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-900'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {c.name}
                </span>
                <Phone className={`h-4 w-4 ${c.highlight ? 'text-rose-600' : 'text-slate-400'}`} />
              </div>
              <span
                className={`text-xl font-black block mt-2 ${
                  c.highlight ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {c.number}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
              {c.desc}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
