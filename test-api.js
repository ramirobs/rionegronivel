const ANA_AUTH_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/OAUth/v1';
const ANA_DATA_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1';

async function testApi() {
  console.log('Testando autenticação...');
  const user = '00445484004';
  const pass = '_k7zxxci';

  try {
    const authRes = await fetch(ANA_AUTH_URL, {
      method: 'GET',
      headers: {
        'Identificador': user,
        'Senha': pass,
        'Accept': 'application/json'
      }
    });

    console.log('Status Auth:', authRes.status);
    
    if (!authRes.ok) {
      console.error('Falha na autenticação');
      return;
    }

    const authData = await authRes.json();
    const token = authData.items?.[0]?.tokenautenticacao;
    
    if (!token) {
      console.error('Token não retornado', authData);
      return;
    }

    console.log('Token obtido com sucesso! Buscando dados...');

    const url = new URL(ANA_DATA_URL);
    url.searchParams.set('CodigoDaEstacao', '65100001');
    url.searchParams.set('TipoFiltroData', 'DATA_LEITURA');
    url.searchParams.set('RangeIntervaloDeBusca', 'DIAS_30');

    const dataRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Status Dados:', dataRes.status);
    
    if (!dataRes.ok) {
      console.error('Falha ao buscar dados');
      return;
    }

    const data = await dataRes.json();
    console.log(`Sucesso! Recebidos ${data.items?.length || 0} registros.`);
    if (data.items?.length > 0) {
      console.log('Amostra do registro mais recente:', data.items[data.items.length - 1]);
    }

  } catch (err) {
    console.error('Erro no teste:', err);
  }
}

testApi();
