import fs from 'fs';
import path from 'path';
import { cleanRiverData, aggregateByDay } from './src/lib/data-processing';
import { calculateHydrologicalForecast } from './src/lib/hydrological-forecast';
import type { DailyWeatherForecast } from './src/lib/weather-api';
import type { RiverDataPoint } from './src/lib/ana-api';

async function main() {
  console.log('Iniciando Validação Local do Modelo...');
  
  const filePath = path.join('..', 'dados_rio_negro_18_fev_a_18_ago_2026.xls');
  if (!fs.existsSync(filePath)) {
      console.error('Arquivo não encontrado:', filePath);
      return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extrair as linhas da tabela
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const colRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  
  let match;
  const rawData: RiverDataPoint[] = [];
  
  while ((match = rowRegex.exec(content)) !== null) {
      const rowContent = match[1];
      const cols: string[] = [];
      let colMatch;
      while ((colMatch = colRegex.exec(rowContent)) !== null) {
          cols.push(colMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      
      // Valida se a linha tem as colunas certas de dados e uma data no formato brasileiro
      if (cols.length >= 4 && cols[0].includes('/202')) {
          const dateStr = cols[0];
          // Converter DD/MM/YYYY HH:mm:ss para ISO
          const [datePart, timePart] = dateStr.split(' ');
          const [day, month, year] = datePart.split('/');
          const isoDate = `${year}-${month}-${day}T${timePart || '00:00:00'}`;
          
          const rain = parseFloat(cols[1].replace(',', '.'));
          const levelCm = parseFloat(cols[2].replace(',', '.'));
          const flow = parseFloat(cols[3].replace(',', '.'));
          
          if (!isNaN(levelCm) && levelCm > 0) {
              rawData.push({
                  date: isoDate,
                  level: Number((levelCm / 100).toFixed(2)),
                  flow: isNaN(flow) ? 0 : flow,
                  precipitation: isNaN(rain) ? 0 : rain
              });
          }
      }
  }

  console.log(`Dados brutos extraídos do Excel/HTML: ${rawData.length} registros.`);
  
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
  console.log('RESULTADOS DO BACKTESTING LOCAL (XLS)');
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
