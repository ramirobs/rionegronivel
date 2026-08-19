import { fetchHistoricalData } from './src/lib/ana-api';
import { cleanRiverData, getMaxByYear } from './src/lib/data-processing';
import { calculateGumbel, generateReturnPeriodTable } from './src/lib/statistics';

async function main() {
  console.log('Fetching...');
  const rawHistorical = await fetchHistoricalData('65100000', '1');
  console.log('Raw count:', rawHistorical.length);
  const cleanData = cleanRiverData(rawHistorical);
  console.log('Clean count:', cleanData.length);
  const annualMax = getMaxByYear(cleanData);
  console.log('Annual Max count:', annualMax.length);
  console.log('Top 10 Annual Max:', annualMax.slice(0, 10));
  
  const gumbel = calculateGumbel(annualMax);
  console.log('Gumbel:', gumbel);
  const table = generateReturnPeriodTable(annualMax);
  console.log('Table:', table);
}
main();
