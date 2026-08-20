async function getLast() {
  const url = 'http://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=65100001&dataInicio=18/08/2026&dataFim=';
  try {
    const res = await fetch(url);
    const xml = await res.text();
    
    const regex = /<DadosHidrometereologicos[^>]*>([\s\S]*?)<\/DadosHidrometereologicos>/gi;
    let match;
    const records = [];
    
    while ((match = regex.exec(xml)) !== null) {
      const block = match[1];
      const dateMatch = /<DataHora[^>]*>([\s\S]*?)<\/DataHora>/i.exec(block);
      const levelMatch = /<Nivel[^>]*>([\s\S]*?)<\/Nivel>/i.exec(block);
      
      if (dateMatch && levelMatch) {
        records.push({
          date: new Date(dateMatch[1].trim()),
          level: parseFloat(levelMatch[1].trim()) / 100
        });
      }
    }
    
    records.sort((a, b) => a.date - b.date);
    
    console.log("Últimas medições da estação 65100001 (Rio Negro):");
    const last5 = records.slice(-5);
    for (const r of last5) {
      console.log(`- Data/Hora: ${r.date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | Nível: ${r.level.toFixed(2)} m`);
    }
    
  } catch(e) {
    console.error(e);
  }
}
getLast();
