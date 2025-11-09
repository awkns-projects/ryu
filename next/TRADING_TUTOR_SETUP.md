# AI Trading Tutor - Setup Guide

## Overview

The AI Trading Tutor is a fully functional AI chatbot integrated into your Ryu application. It provides:

- 🔍 **Real-time web search** for market news and information
- 📊 **Live cryptocurrency prices** with market data
- 📈 **Technical analysis** including RSI, moving averages, and trend analysis
- 💡 **Trading education** and strategy explanations
- 💾 **Conversation memory** that persists across sessions

## Features

### 1. Web Search Tool
Searches the internet for real-time market information, news, and trading strategies. Sources are displayed with clickable links.

### 2. Chart Price Tool
Fetches current and historical price data from CoinGecko API (free, no API key required):
- Current price
- 24h, 7d, 30d, 1y price changes
- Market cap and volume
- 24h high/low
- All-time high/low

### 3. Technical Analysis Tool
Performs comprehensive technical analysis:
- RSI (Relative Strength Index)
- Moving Averages (7, 25, 99 periods)
- Support and Resistance levels
- Trend analysis (Bullish/Bearish/Neutral)
- Visual indicators with color coding

## Setup

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Optional: For enhanced web search capabilities
# If not provided, will use fallback search data
TAVILY_API_KEY=your_tavily_api_key_here

# Or alternatively, use any search API you prefer
SEARCH_API_KEY=your_search_api_key_here
```

### Getting a Tavily API Key (Recommended for Web Search)

1. Go to [https://tavily.com](https://tavily.com)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key
5. Add it to `.env.local` as `TAVILY_API_KEY`

**Free tier includes:** 1,000 API calls per month

### Alternative Search APIs

You can also use:
- **Google Custom Search API** - [Setup Guide](https://developers.google.com/custom-search/v1/overview)
- **Brave Search API** - [Setup Guide](https://brave.com/search/api/)
- **Serper API** - [Setup Guide](https://serper.dev/)

To use a different search API, modify the `webSearch` tool in `/app/api/trading-tutor/route.ts`.

## Usage

### Accessing the Tutor

1. Look for the pulsing circle in the bottom-right corner of your app
2. Click to open the chat interface
3. Ask any questions about trading, markets, or cryptocurrencies

### Example Questions

**Market Research:**
- "What's the latest news about Bitcoin?"
- "Search for information about the upcoming Fed meeting"
- "What are analysts saying about Ethereum?"

**Price Lookups:**
- "What's the current price of BTC?"
- "Show me SOL price statistics"
- "Get me the market data for HYPE"

**Technical Analysis:**
- "Analyze BTC chart"
- "What's the RSI for ETH?"
- "Perform technical analysis on SOL"

**Trading Education:**
- "Explain what RSI means"
- "How do I use moving averages?"
- "What's a good risk management strategy?"

## Features in Detail

### Conversation Memory
- All conversations are automatically saved to browser localStorage
- Chat history persists across page refreshes
- Click the trash icon to clear history

### Streaming Responses
- Real-time streaming of AI responses
- Tool calls are displayed as they execute
- Beautiful loading states for each tool

### Beautiful UI Components

**Search Results:**
- Clickable source links
- Snippet previews
- Domain highlighting
- Hover effects

**Price Data:**
- Gradient cards with market statistics
- Color-coded price changes (green/red)
- High/low ranges
- Market cap and volume

**Technical Analysis:**
- Visual trend indicators
- RSI with overbought/oversold signals
- Moving averages grid
- Support/resistance levels
- Interpretation summary

## File Structure

```
next/
├── app/
│   └── api/
│       └── trading-tutor/
│           └── route.ts          # API endpoint with AI tools
└── components/
    └── shader/
        └── pulsing-circle.tsx    # UI component
```

## Customization

### Adding More Cryptocurrencies

Edit the `symbolMap` in `/app/api/trading-tutor/route.ts`:

```typescript
const symbolMap: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  // Add more mappings here
  atom: "cosmos",
  avax: "avalanche-2",
};
```

### Changing the AI Model

The tutor uses the `chat-model` by default. To use a different model, modify the API route:

```typescript
model: myProvider.languageModel("gpt-4o"), // or any other model
```

### Adding More Tools

To add new capabilities, create additional tools in the API route:

```typescript
const newTool = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Tool implementation
    return { result: "data" };
  },
});

// Add to tools object
tools: {
  webSearch,
  getChartPrice,
  technicalAnalysis,
  newTool, // Your new tool
}
```

## API Rate Limits

### CoinGecko (Free Tier)
- 10-50 calls/minute (no API key required)
- If you need higher limits, get a CoinGecko API key

### Tavily Search (Free Tier)
- 1,000 searches/month
- Upgrade for more capacity

## Troubleshooting

### Search not working?
- Check if `TAVILY_API_KEY` is set in `.env.local`
- Without the API key, fallback search data will be used
- Consider signing up for a free Tavily account

### Price data not loading?
- CoinGecko API works without authentication
- Check if the cryptocurrency symbol is supported
- Add more symbol mappings if needed

### Chat history not saving?
- Check browser localStorage is enabled
- Clear browser cache and try again
- Open browser console to see any error messages

### AI not responding?
- Check your Vercel AI Gateway configuration
- Ensure you have credits/API keys for the AI models
- Check browser console for error messages

## Advanced Configuration

### Using Database for Persistence

Instead of localStorage, you can save conversations to a database:

1. Create a conversations table in your database
2. Modify the `useChat` hook to use an `id` parameter
3. Implement server-side message persistence
4. See `/app/api/chat/route.ts` for an example

### Adding Authentication

To restrict access to the tutor:

1. Add authentication check in `/app/api/trading-tutor/route.ts`:

```typescript
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Rest of the code...
}
```

## Performance Tips

1. **Rate Limiting**: Implement rate limiting to prevent API abuse
2. **Caching**: Cache frequently requested price data
3. **Lazy Loading**: Only load the tutor when the user opens it
4. **Error Handling**: Implement retry logic for failed API calls

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Test API endpoints directly
4. Review the code in `/app/api/trading-tutor/route.ts`

## Future Enhancements

Potential improvements:
- [ ] Add support for stock market data
- [ ] Include sentiment analysis
- [ ] Integrate with trading platforms
- [ ] Add voice input/output
- [ ] Multi-language support
- [ ] Export chat history
- [ ] Share analysis with others
- [ ] Create trading alerts
- [ ] Portfolio tracking
- [ ] Risk calculator

## License

This feature is part of the Ryu project and follows the same license.

