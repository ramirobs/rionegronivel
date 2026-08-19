const ANA_AUTH_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/OAUth/v1';
const ANA_DATA_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1';

async function checkLatest() {
  const user = '00445484004';
  const pass = '_k7zxxci';

  const authRes = await fetch(ANA_AUTH_URL, {
    method: 'GET',
    headers: { 'Identificador': user, 'Senha': pass, 'Accept': 'application/json' }
  });
  
  if (!authRes.ok) return console.log("Erro auth", authRes.status);
  
  const authData = await authRes.json();
  const token = authData.items.tokenautenticacao;

  const url = new URL(ANA_DATA_URL);
  url.searchParams.set('CodigoDaEstacao', '65100001');
  url.searchParams.set('TipoFiltroData', 'DATA_LEITURA');
  url.searchParams.set('RangeIntervaloDeBusca', 'DIAS_30');

  const dataRes = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });

  if (!dataRes.ok) return console.log("Erro dados", dataRes.status);

  const data = await dataRes.json();
  if (data.items && data.items.length > 0) {
    const sorted = data.items.sort((a,b) => new Date(a.Data_Hora_Medicao || a.Data_Atualizacao).getTime() - new Date(b.Data_Hora_Medicao || b.Data_Atualizacao).getTime());
    console.log("Últimos 3 registros:");
    console.log(sorted.slice(-3).map(i => `${i.Data_Hora_Medicao || i.Data_Atualizacao} -> Cota: ${i.Cota_Adotada}`));
  }
}
checkLatest();
