import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

async function getPrice(symbol: string, type: 'forex'|'crypto'|'commodity') {
  try {
    let url = '';
    if(type === 'forex') {
      url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${symbol.slice(0,3)}&to_symbol=${symbol.slice(3)}&interval=60min&outputsize=compact&apikey=${ALPHA_KEY}`;
    } else if(type === 'crypto') {
      url = `https://www.alphavantage.co/query?function=CRYPTO_INTRADAY&symbol=BTC&market=USD&interval=60min&outputsize=compact&apikey=${ALPHA_KEY}`;
    } else {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=GLD&interval=60min&outputsize=compact&apikey=${ALPHA_KEY}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch(e) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if(req.method === 'OPTIONS') return res.status(200).end();

  try {
    const [eurusd, xauusd, btcusdt] = await Promise.all([
      getPrice('EURUSD', 'forex'),
      getPrice('XAUUSD', 'commodity'),
      getPrice('BTCUSDT', 'crypto'),
    ]);

    // Fiyat verilerini çıkar
    const prices: Record<string, any> = {};

    if(eurusd?.['Time Series FX (60min)']) {
      const times = Object.keys(eurusd['Time Series FX (60min)']).slice(0, 10);
      prices.EURUSD = times.map((t: string) => ({
        time: t,
        open: eurusd['Time Series FX (60min)'][t]['1. open'],
        high: eurusd['Time Series FX (60min)'][t]['2. high'],
        low: eurusd['Time Series FX (60min)'][t]['3. low'],
        close: eurusd['Time Series FX (60min)'][t]['4. close'],
      }));
    }

    if(btcusdt?.['Time Series Crypto (60min)']) {
      const times = Object.keys(btcusdt['Time Series Crypto (60min)']).slice(0, 10);
      prices.BTCUSDT = times.map((t: string) => ({
        time: t,
        open: btcusdt['Time Series Crypto (60min)'][t]['1. open'],
        high: btcusdt['Time Series Crypto (60min)'][t]['2. high'],
        low: btcusdt['Time Series Crypto (60min)'][t]['3. low'],
        close: btcusdt['Time Series Crypto (60min)'][t]['4. close'],
      }));
    }

    // AI analizi
    const prompt = `Sen bir EW + ICT uzmanısın. Aşağıdaki son 10 saatlik fiyat verilerini analiz et ve Türkçe olarak kısa bir rapor ver.

${JSON.stringify(prices, null, 2)}

Her parite için:
1. Mevcut trend yönü
2. Önemli seviyeler (destek/direnç)
3. Olası ICT setup (OB, FVG, Liquidity vb.)
4. Olası EW pozisyonu
5. ⚡ Dikkat: setup var mı? (Evet/Hayır)

Çok kısa ve net yaz. Her parite için max 5 satır.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await aiRes.json();
    const analysis = aiData.content?.[0]?.text || 'Analiz alınamadı';

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      prices,
      analysis
    });

  } catch(e) {
    return res.status(500).json({ error: 'Tarama hatası' });
  }
}
