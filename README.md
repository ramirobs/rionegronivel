# Nível Rio Negro

> App para monitorar perigos de enchente em RioMafra (Rio Negro - PR e Mafra - SC).

Monitoramento em tempo real do nível do Rio Negro utilizando dados telemétricos oficiais da Agência Nacional de Águas (ANA) e SNIRH, com classificação de risco, simulador hidrológico e contatos de emergência da Defesa Civil.

## Funcionalidades

- **Nível em Tempo Real**: Leitura contínua da estação fluviométrica da ANA (Estação 65100001).
- **Classificação de Risco**: Alertas visuais (Normal, Atenção, Alerta, Emergência/Enchente).
- **Régua de Inundação**: Marcos críticos das cidades de Rio Negro (PR) e Mafra (SC).
- **Simulador Hidrológico**: Estimativa de impacto com base no acumulado de chuvas.
- **Gráficos e Estatísticas**: Histórico de cotas, chuvas e cálculo do período de retorno (Gumbel).
- **PWA**: Instalável no celular e computador como aplicativo nativo.

## Executando localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).
