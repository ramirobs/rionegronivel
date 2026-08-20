import { fetchTelemetricData, fetchHistoricalData } from './src/lib/ana-api';
import { cleanRiverData, aggregateByDay } from './src/lib/data-processing';
import { calculateHydrologicalForecast } from './src/lib/hydrological-forecast';
import type { DailyWeatherForecast } from './src/lib/weather-api';

async function main() {
  console.log('Iniciando Validação do Modelo (Backtesting)...');
  
  console.log('Buscando dados da ANA (Telemetria)...');
  // Buscar um intervalo para pegar pelo menos a enchente de outubro/2023
  let rawData = await fetchTelemetricData('65100001', '01/09/2023', '31/12/2023');
  
  if (rawData.length === 0) {
      console.error('Telemetria não retornou dados (provavelmente por limite de data da nova API). Tentando histórico...');
      rawData = await fetchHistoricalData('65100001', '1', '01/09/2023', '31/12/2023');
  }

  if (rawData.length === 0) {
      console.error('Falha ao obter dados da ANA para validação.');
      return;
  }

  console.log(`Dados brutos obtidos: ${rawData.length} registros.`);
  
  const cleanData = cleanRiverData(rawData);
  const dailyData = aggregateByDay(cleanData);
  
  console.log(`Dados diários agregados: ${dailyData.length} dias válidos.`);
  if (dailyData.length < 10) {
      console.log('Dados insuficientes para backtesting.');
      return;
  }

  // Ordena cronologicamente
  dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const MAX_FORECAST_DAYS = 7;
  
  // Estruturas para guardar métricas por horizonte de previsão
  const horizons = [1, 3, 5, 7];
  const metrics = horizons.map(h => ({ horizon: h, totalError: 0, totalSquaredError: 0, count: 0 }));

  for (let i = 0; i < dailyData.length - MAX_FORECAST_DAYS; i++) {
    const currentDay = dailyData[i];
    const currentLevel = currentDay.avgLevel;
    const recentRain24h = currentDay.totalRain;
    
    // Inércia aproximada
    let trendRate = 0;
    if (i > 0) {
        const prevLevel = dailyData[i-1].avgLevel;
        trendRate = (currentLevel - prevLevel) / 24; 
    }

    // Previsão "perfeita" usando chuva real
    const forecastDaily: DailyWeatherForecast[] = [];
    for (let j = 0; j < MAX_FORECAST_DAYS; j++) {
        const futureDay = dailyData[i + j];
        forecastDaily.push({
            date: futureDay.date,
            dateFormatted: futureDay.date.split('-').slice(1).reverse().join('/'),
            dayOfWeek: 'Dia ' + j,
            weatherCode: 0,
            tempMax: 20,
            tempMin: 15,
            windSpeedMax: 10,
            precipitationSum: futureDay.totalRain || 0,
            precipitationProbability: 100,
            weatherDescription: '',
            weatherIcon: ''
        });
    }

    const projection = calculateHydrologicalForecast(currentLevel, trendRate, forecastDaily, recentRain24h);
    
    for (const metric of metrics) {
        const projIdx = metric.horizon; 
        
        if (projIdx < projection.projectedDays.length) {
            const predicted = projection.projectedDays[projIdx].expectedLevel;
            const actual = dailyData[i + projIdx].avgLevel;
            
            const err = Math.abs(actual - predicted);
            metric.totalError += err;
            metric.totalSquaredError += (err * err);
            metric.count++;
        }
    }
  }

  console.log('\n=========================================');
  console.log('RESULTADOS DO BACKTESTING DO MODELO');
  console.log('=========================================');
  
  for (const metric of metrics) {
      if (metric.count === 0) continue;
      const mae = metric.totalError / metric.count;
      const rmse = Math.sqrt(metric.totalSquaredError / metric.count);
      console.log(`\nHorizonte de +${metric.horizon} dias (${metric.count} amostras):`);
      console.log(`  MAE  (Erro Abs Médio) : ${mae.toFixed(3)} m`);
      console.log(`  RMSE (Raiz Erro Quad) : ${rmse.toFixed(3)} m`);
  }
  console.log('=========================================');
  
  if (metrics[0].count > 0) {
      const m1 = metrics[0].totalError / metrics[0].count;
      if (m1 < 0.20) {
          console.log('CONCLUSÃO: O modelo de curtíssimo prazo está EXCELENTE (< 20cm).');
      } else if (m1 < 0.40) {
          console.log('CONCLUSÃO: O modelo de curtíssimo prazo está BOM.');
      } else {
          console.log('CONCLUSÃO: O modelo precisa de calibração no curtíssimo prazo.');
      }
  }
}

main().catch(console.error);
