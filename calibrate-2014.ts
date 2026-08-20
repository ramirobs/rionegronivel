const data2014 = [
  { date: '2014-06-01', rain: 16.2, level: 1.45 },
  { date: '2014-06-02', rain: 0.0, level: 1.60 },
  { date: '2014-06-03', rain: 0.0, level: 1.47 },
  { date: '2014-06-04', rain: 0.0, level: 1.33 },
  { date: '2014-06-05', rain: 0.0, level: 1.23 },
  { date: '2014-06-06', rain: 44.1, level: 1.57 },
  { date: '2014-06-07', rain: 16.0, level: 3.29 },
  { date: '2014-06-08', rain: 224.8, level: 8.69 },
  { date: '2014-06-09', rain: 30.5, level: 11.65 },
  { date: '2014-06-10', rain: 10.3, level: 13.08 },
  { date: '2014-06-11', rain: 0.0, level: 13.53 },
  { date: '2014-06-12', rain: 0.0, level: 13.53 },
  { date: '2014-06-13', rain: 0.0, level: 13.60 },
  { date: '2014-06-14', rain: 0.0, level: 11.79 },
  { date: '2014-06-15', rain: 1.2, level: 11.05 },
  { date: '2014-06-16', rain: 0.0, level: 10.08 },
  { date: '2014-06-17', rain: 0.0, level: 8.95 },
  { date: '2014-06-18', rain: 12.7, level: 7.66 },
  { date: '2014-06-19', rain: 7.2, level: 6.53 },
  { date: '2014-06-20', rain: 0.3, level: 5.79 },
  { date: '2014-06-21', rain: 0.0, level: 4.88 },
  { date: '2014-06-22', rain: 0.0, level: 4.03 },
  { date: '2014-06-23', rain: 0.0, level: 3.31 },
  { date: '2014-06-24', rain: 0.0, level: 2.98 },
  { date: '2014-06-25', rain: 0.0, level: 2.62 },
  { date: '2014-06-26', rain: 7.4, level: 2.51 },
  { date: '2014-06-27', rain: 17.4, level: 2.95 },
  { date: '2014-06-28', rain: 4.2, level: 3.62 },
  { date: '2014-06-29', rain: 22.5, level: 4.33 },
  { date: '2014-06-30', rain: 0.0, level: 5.22 },
];

function runTest(
    tag: string,
    RAIN_RESPONSE_COEFFICIENT: number,
    HYDROGRAPH_WEIGHTS: number[],
    BASELINE_RIVER_LEVEL: number,
    maxRecession: number,
    recessionFactor: number
) {
    let totalError = 0;
    let count = 0;
    let maxError = 0;
    let maxErrorDetails = '';

    for (let i = 0; i < data2014.length - 7; i++) {
        const today = data2014[i];
        const currentLevel = today.level;
        const recentRain24h = today.rain;
        
        let trendRate = 0;
        if (i > 0) {
            trendRate = (currentLevel - data2014[i-1].level) / 24;
        }

        const rainContributions = new Array(7).fill(0);

        if (recentRain24h > 5) {
            rainContributions[0] += recentRain24h * 0.4 * RAIN_RESPONSE_COEFFICIENT;
            rainContributions[1] += recentRain24h * 0.2 * RAIN_RESPONSE_COEFFICIENT;
        }

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const targetData = data2014[i + dayOffset];
            const rain = targetData.rain;
            const prob = 1.0; 
            const effectiveRain = rain * (0.4 + 0.6 * prob); // = rain * 1.0

            for (let w = 0; w < HYDROGRAPH_WEIGHTS.length; w++) {
                const affectedDay = dayOffset + w;
                if (affectedDay < 7) {
                    rainContributions[affectedDay] += effectiveRain * HYDROGRAPH_WEIGHTS[w] * RAIN_RESPONSE_COEFFICIENT;
                }
            }
        }

        let runningLevel = currentLevel;
        let predictedLevels = [currentLevel];

        for (let j = 1; j < 7; j++) {
            const excessAboveBase = Math.max(0, runningLevel - BASELINE_RIVER_LEVEL);
            const dailyRecession = excessAboveBase > 0 ? Math.min(maxRecession, excessAboveBase * recessionFactor + 0.04) : 0;
            const inflowRise = rainContributions[j];
            const inertia = j === 1 ? Math.max(-0.15, Math.min(0.25, trendRate * 12)) : 0;

            runningLevel = Math.max(BASELINE_RIVER_LEVEL - 0.5, runningLevel - dailyRecession + inflowRise + inertia);
            predictedLevels.push(runningLevel);
        }

        [1, 3, 5].forEach(horizon => {
            if (i + horizon < data2014.length) {
                const actual = data2014[i + horizon].level;
                const predicted = predictedLevels[horizon];
                totalError += Math.abs(actual - predicted);
                count++;
            }
        });
    }
    
    console.log(`[${tag}] MAE: ${(totalError/count).toFixed(3)} m`);
}

runTest("1. Original", 0.038, [0.20, 0.55, 0.20, 0.05], 3.80, 0.28, 0.09);
runTest("2. Drenagem Real (Desbloqueada)", 0.038, [0.20, 0.55, 0.20, 0.05], 1.63, 2.00, 0.18);
runTest("3. Drenagem + Pesos Ajustados", 0.035, [0.15, 0.50, 0.25, 0.10], 1.63, 2.00, 0.18);
runTest("4. Drenagem + Pesos + Inércia Maior", 0.032, [0.10, 0.40, 0.35, 0.15], 1.63, 1.80, 0.16);

