import {
  convertToModelMessages,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { type NextRequest } from "next/server";
import { myProvider } from "@/lib/ai/providers";
import { z } from "zod";

export const maxDuration = 60;

// Chart Price Tool
const getChartPrice = tool({
  description:
    "Get current and historical price data for cryptocurrencies. Use this to look up real-time prices, historical data, and market statistics.",
  parameters: z.object({
    symbol: z
      .string()
      .describe(
        "The cryptocurrency symbol (e.g., BTC, ETH, SOL, HYPE, BNB)"
      ),
    timeframe: z
      .enum(["1h", "24h", "7d", "30d", "1y"])
      .optional()
      .describe("The timeframe for historical data"),
  }),
  execute: async ({ symbol, timeframe = "24h" }) => {
    try {
      const coinId = symbol.toLowerCase();
      
      const symbolMap: Record<string, string> = {
        btc: "bitcoin",
        eth: "ethereum",
        sol: "solana",
        bnb: "binancecoin",
        ada: "cardano",
        xrp: "ripple",
        doge: "dogecoin",
        dot: "polkadot",
        matic: "matic-network",
        hype: "hyperliquid",
      };

      const geckoId = symbolMap[coinId] || coinId;

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price data");
      }

      const data = await response.json();

      const priceData = {
        symbol: symbol.toUpperCase(),
        name: data.name,
        currentPrice: data.market_data.current_price.usd,
        priceChange24h: data.market_data.price_change_percentage_24h,
        priceChange7d: data.market_data.price_change_percentage_7d,
        priceChange30d: data.market_data.price_change_percentage_30d,
        priceChange1y: data.market_data.price_change_percentage_1y,
        marketCap: data.market_data.market_cap.usd,
        volume24h: data.market_data.total_volume.usd,
        high24h: data.market_data.high_24h.usd,
        low24h: data.market_data.low_24h.usd,
        ath: data.market_data.ath.usd,
        athDate: data.market_data.ath_date.usd,
        atl: data.market_data.atl.usd,
        atlDate: data.market_data.atl_date.usd,
      };

      return priceData;
    } catch (error) {
      console.error("Price fetch error:", error);
      return {
        symbol: symbol.toUpperCase(),
        error: `Failed to fetch price data for ${symbol}. The symbol might not be supported or there was an API error.`,
      };
    }
  },
});

// Technical Analysis Tool
const technicalAnalysis = tool({
  description:
    "Perform technical analysis on cryptocurrency charts including trend analysis, support/resistance levels, and trading indicators. Use this to provide insights on chart patterns and trading signals.",
  parameters: z.object({
    symbol: z
      .string()
      .describe("The cryptocurrency symbol to analyze (e.g., BTC, ETH)"),
    indicators: z
      .array(
        z.enum([
          "RSI",
          "MACD",
          "Moving Averages",
          "Bollinger Bands",
          "Support/Resistance",
          "Trend Analysis",
        ])
      )
      .optional()
      .describe("Specific technical indicators to analyze"),
  }),
  execute: async ({ symbol, indicators = [] }) => {
    try {
      const coinId = symbol.toLowerCase();
      const symbolMap: Record<string, string> = {
        btc: "bitcoin",
        eth: "ethereum",
        sol: "solana",
        bnb: "binancecoin",
        ada: "cardano",
        xrp: "ripple",
        doge: "dogecoin",
        dot: "polkadot",
        matic: "matic-network",
        hype: "hyperliquid",
      };

      const geckoId = symbolMap[coinId] || coinId;

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=30`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch OHLC data");
      }

      const ohlcData = await response.json();

      const closes = ohlcData.map((candle: number[]) => candle[4]);
      const highs = ohlcData.map((candle: number[]) => candle[2]);
      const lows = ohlcData.map((candle: number[]) => candle[3]);

      const calculateRSI = (prices: number[], period = 14) => {
        if (prices.length < period + 1) return null;

        let gains = 0;
        let losses = 0;

        for (let i = prices.length - period; i < prices.length; i++) {
          const change = prices[i] - prices[i - 1];
          if (change > 0) gains += change;
          else losses += Math.abs(change);
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);

        return rsi;
      };

      const calculateMA = (prices: number[], period: number) => {
        if (prices.length < period) return null;
        const slice = prices.slice(-period);
        return slice.reduce((a, b) => a + b, 0) / period;
      };

      const currentPrice = closes[closes.length - 1];
      const ma7 = calculateMA(closes, 7);
      const ma25 = calculateMA(closes, 25);
      const ma99 = calculateMA(closes, 99);
      const rsi = calculateRSI(closes);

      const recentHighs = highs.slice(-30);
      const recentLows = lows.slice(-30);
      const resistance = Math.max(...recentHighs);
      const support = Math.min(...recentLows);

      let trend = "Neutral";
      if (ma7 && ma25) {
        if (ma7 > ma25 && currentPrice > ma7) trend = "Bullish";
        else if (ma7 < ma25 && currentPrice < ma7) trend = "Bearish";
      }

      let rsiSignal = "Neutral";
      if (rsi) {
        if (rsi > 70) rsiSignal = "Overbought";
        else if (rsi < 30) rsiSignal = "Oversold";
      }

      return {
        symbol: symbol.toUpperCase(),
        currentPrice: currentPrice.toFixed(2),
        technicalIndicators: {
          rsi: rsi ? rsi.toFixed(2) : "N/A",
          rsiSignal,
          movingAverages: {
            ma7: ma7 ? ma7.toFixed(2) : "N/A",
            ma25: ma25 ? ma25.toFixed(2) : "N/A",
            ma99: ma99 ? ma99.toFixed(2) : "N/A",
          },
          supportResistance: {
            resistance: resistance.toFixed(2),
            support: support.toFixed(2),
          },
          trend,
        },
        interpretation: `${symbol.toUpperCase()} is currently showing a ${trend.toLowerCase()} trend. The RSI is ${rsiSignal.toLowerCase()} at ${rsi?.toFixed(2)}. Current price is ${currentPrice > (ma7 || 0) ? "above" : "below"} the 7-day MA.`,
      };
    } catch (error) {
      console.error("Technical analysis error:", error);
      return {
        symbol: symbol.toUpperCase(),
        error: `Failed to perform technical analysis for ${symbol}.`,
      };
    }
  },
});

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    console.log('Trading tutor - received', messages.length, 'messages');

    const result = streamText({
      model: myProvider.languageModel("chat-model"),
      system: `You are an expert trading tutor and market analyst specializing in cryptocurrency and financial markets. Your role is to:

1. **Educate**: Explain trading concepts, strategies, and market dynamics in clear, accessible language
2. **Analyze**: Provide data-driven insights using real-time market data and technical analysis
3. **Guide**: Help users understand risk management, position sizing, and trading psychology
4. **Research**: You have access to real-time web search through AI-powered search

**Your Capabilities:**
- AI-powered web search for real-time market news and information
- Live cryptocurrency price data and market statistics
- Technical analysis including RSI, moving averages, support/resistance, and trend analysis
- Knowledge of trading strategies, patterns, and indicators

**Important Guidelines:**
- Always cite sources when providing market data or news
- Emphasize risk management and responsible trading
- Acknowledge when information needs verification or is speculative
- Use technical analysis tools to support your analysis
- Stay current with market conditions by using the available tools
- Be educational and supportive, never pushy or guaranteeing returns

**When discussing trades:**
- Explain the reasoning behind analysis
- Discuss both bullish and bearish scenarios
- Highlight key support/resistance levels
- Consider risk/reward ratios
- Remind users that all trading involves risk

**Tool Usage:**
- Use getChartPrice for current prices and market data
- Use technicalAnalysis for chart analysis and indicators
- Use web search (built-in) when users ask about news, events, or current conditions

Remember: You're here to educate and inform, not to provide financial advice. Always encourage users to do their own research and never invest more than they can afford to lose.`,
      messages: convertToModelMessages(messages),
      maxSteps: 10,
      experimental_webSearch: true,
      tools: {
        getChartPrice,
        technicalAnalysis,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Trading tutor API error:", error);
    return Response.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
