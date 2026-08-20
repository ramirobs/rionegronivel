# Documentação Metodológica: Simulador de Enchentes (Rio Negro e Mafra)

Esta documentação descreve a base científica, os modelos matemáticos e a lógica de negócios implementada na ferramenta de simulação e probabilidade de enchentes do sistema Hidro Alert, focada nas cidades-irmãs de Rio Negro (PR) e Mafra (SC).

## 1. Contexto e Extração de Dados

A base de dados do projeto provém dos registros oficiais da **Agência Nacional de Águas e Saneamento Básico (ANA)** e do **Sistema Nacional de Informações sobre Recursos Hídricos (SNIRH)**.

*   **Estação Base:** O modelo utiliza os dados da estação fluviométrica do Rio Negro. A série histórica combina registros da antiga estação convencional (Código ANEEL 65100000), instalada em 1930, e da atual estação telemétrica (Código ANEEL 65100001), cujas medições em tempo real alimentam o modelo contínuo.
*   **Processamento:** Os dados brutos são processados para extrair as **máximas anuais** (o maior nível atingido pelo rio em cada ano civil). Essa série de picos anuais é a premissa fundamental para a análise de valores extremos em hidrologia.

## 2. Modelo Estatístico: Distribuição de Gumbel

A ferramenta emprega a **Distribuição de Gumbel (Tipo I para Máximos)** para prever a probabilidade de eventos extremos. Trata-se do método padrão adotado na hidrologia brasileira para modelar vazões e cotas máximas e estimar os períodos de retorno.

### 2.1. Ajuste pelo Método dos Momentos
No arquivo `src/lib/statistics.ts`, os parâmetros da curva de Gumbel são ajustados a partir da série amostral utilizando o Método dos Momentos:
*   **Parâmetro de Escala (β):** Calculado como $\beta = \frac{s \times \sqrt{6}}{\pi}$, onde $s$ é o desvio padrão da amostra.
*   **Parâmetro de Localização/Posição (μ):** Calculado como $\mu = \bar{x} - \gamma \times \beta$, onde $\bar{x}$ é a média amostral e $\gamma$ é a constante de Euler-Mascheroni ($\approx 0.5772$).

### 2.2. Tempo de Retorno (TR) e Probabilidade
A partir da curva ajustada, o sistema usa a função quantil inversa para estimar a cota (altura do rio) correspondente a períodos de retorno fixos (2, 5, 10, 25, 50 e 100 anos).
*   **Probabilidade Anual (P):** A chance de uma cheia ser igualada ou superada em qualquer ano é dada por $P = \frac{1}{TR}$. Exemplo: Um TR de 25 anos significa uma chance de 4% de ocorrer naquele ano.

## 3. Calibração Regional e Tendência Recente (Mudança Climática e Urbanização)

Em hidrologia tradicional, utiliza-se a série histórica completa assumindo o princípio da **estacionariedade** (a ideia de que as condições médias e os extremos se mantêm consistentes ao longo das décadas).

Contudo, com base no estudo científico _"Inundações Urbanas no Aglomerado Rio Negro - Mafra: Contribuições à Compreensão da Dinâmica Hidrológica e dos Impactos na Gestão Urbana"_ (JOHN, 2021), a aplicação estrita do modelo estacionário em Rio Negro e Mafra **subestimava o risco real e atual de desastres**.

### O Pulo do Gato da Ferramenta
O estudo demonstrou que houve um severo **aumento na frequência das inundações** nas últimas décadas. Uma cheia que atingia a cota de restrição de 13,0 metros costumava ter um TR de 30 anos (baseado na série de 90 anos). Porém, ao isolar a série recente (1990-2020), o TR dessa mesma cheia caiu pela metade (15 anos). 

Para garantir que a ferramenta proteja e alerte os cidadãos com base no **risco real atual**, o simulador implementa um filtro ativo na API (`src/app/api/statistics/route.ts`):
*   O algoritmo de Gumbel **descarta as máximas anteriores a 1990** e ajusta a curva de probabilidade utilizando apenas a tendência climática dos últimos 30-35 anos. 
*   **Resultado Prático:** As estimativas de cotas para eventos raros geradas pelo simulador são ligeiramente mais altas, refletindo a dinâmica real da bacia intensificada pelas mudanças climáticas globais, impermeabilização do solo urbano e ocupação da planície de inundação ribeirinha.

## 4. Limiares de Alerta (Thresholds)
As faixas de segurança da interface foram baseadas no referencial bibliográfico local e nos planos de contingência da COMPDEC (Coordenadoria Municipal de Proteção e Defesa Civil):
*   **1,63 m:** Cota média histórica do rio.
*   **6,00 m:** Cota de Inundação (transbordamento da calha principal).
*   **6,90 m:** Cota de Alerta Defesa Civil (início dos alagamentos urbanos).
*   **10,00 m:** Linha *Non Aedificandi* (restrição de construção no Plano Diretor).
*   **13,00 m:** Limite sem restrição à ocupação (áreas consolidadas gravemente atingidas nas cheias).

## Referências
*   **ANA/SNIRH:** Sistema Nacional de Informações sobre Recursos Hídricos. Agência Nacional de Águas e Saneamento Básico, Brasil.
*   **JOHN, Micheli M. L. (2021).** _Inundações urbanas no aglomerado Rio Negro - Mafra: Contribuições à compreensão da dinâmica hidrológica e dos impactos na gestão urbana._ Dissertação de Mestrado, Universidade Tecnológica Federal do Paraná (UTFPR), Curitiba.
*   **TUCCI, C. E. M. (2005).** _Hidrologia: Ciência e Aplicação._ Porto Alegre: Editora da UFRGS/ABRH.
