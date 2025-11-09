# AI Trading Tutor - Quick Start 🚀

## What's New?

Your pulsing circle button is now a **fully functional AI Trading Tutor** with real-time capabilities!

## ✨ Features

### 🔍 Web Search
Ask about market news and the AI will search the internet and show you sources with clickable links.

**Example:** *"What's the latest news about Bitcoin ETF?"*

### 📊 Live Price Data
Get real-time cryptocurrency prices with comprehensive market statistics.

**Example:** *"What's the current price of ETH?"*

### 📈 Technical Analysis
Perform chart analysis with RSI, moving averages, support/resistance, and trend identification.

**Example:** *"Analyze BTC chart"*

### 💡 Trading Education
Learn about trading concepts, strategies, and risk management.

**Example:** *"Explain what RSI means and how to use it"*

### 💾 Memory
All conversations are automatically saved and persist across sessions. Clear anytime with the trash icon.

## 🚀 Quick Setup

### 1. Optional: Add Search API Key

For enhanced web search, add to your `.env.local`:

```bash
TAVILY_API_KEY=your_key_here
```

Get a free key at [https://tavily.com](https://tavily.com) (1,000 searches/month free)

**Note:** The tutor works without this key, but search results will be limited.

### 2. Start Your Dev Server

```bash
npm run dev
```

### 3. Try It Out!

Look for the **pulsing circle** in the bottom-right corner → Click it → Start chatting!

## 📝 Example Conversations

```
You: What's the latest news about Ethereum?
AI: [Searches the web and shows recent news with sources]

You: What's the current price of BTC?
AI: [Shows real-time price, 24h change, volume, etc.]

You: Analyze SOL chart
AI: [Performs technical analysis with RSI, MAs, trend]

You: Explain support and resistance levels
AI: [Provides educational explanation]
```

## 🎨 UI Highlights

- **Glassmorphic design** with backdrop blur
- **Gradient cards** for price data
- **Color-coded indicators** (green for bullish, red for bearish)
- **Clickable source links** with hover effects
- **Smooth animations** with Framer Motion
- **Loading states** for each tool
- **Markdown support** for rich formatting

## 🛠️ Technical Details

### API Endpoint
- **URL:** `/api/trading-tutor`
- **Method:** POST
- **Streaming:** Server-Sent Events (SSE)

### Tools Implemented
1. `webSearch` - Tavily API for real-time web search
2. `getChartPrice` - CoinGecko API for price data (free, no key needed)
3. `technicalAnalysis` - Custom technical indicators calculation

### Storage
- **Client-side:** localStorage for chat history
- **Key:** `trading-tutor-messages`

## 📚 Files Changed/Created

```
next/
├── app/api/trading-tutor/
│   └── route.ts                    # NEW: AI API endpoint with tools
├── components/shader/
│   └── pulsing-circle.tsx          # UPDATED: Now uses AI SDK
├── TRADING_TUTOR_SETUP.md          # NEW: Detailed setup guide
└── TRADING_TUTOR_QUICK_START.md    # NEW: This file
```

## 🔧 Customization

### Add More Cryptocurrencies

Edit the `symbolMap` in `/app/api/trading-tutor/route.ts`

### Change AI Model

```typescript
model: myProvider.languageModel("gpt-4o"), // or another model
```

### Add More Tools

Create new tools in the API route and add to the `tools` object.

## 🐛 Troubleshooting

**Q: Search not working?**  
A: Add `TAVILY_API_KEY` to `.env.local` or it will use fallback data.

**Q: Price data not loading?**  
A: CoinGecko API should work without a key. Check the cryptocurrency symbol is supported.

**Q: Chat history not saving?**  
A: Ensure localStorage is enabled in your browser.

**Q: AI not responding?**  
A: Check your Vercel AI Gateway configuration and model access.

## 🎯 Next Steps

1. **Test the tutor** - Ask various questions to see all features
2. **Add your search API key** - For better web search results
3. **Customize the UI** - Match your brand colors
4. **Add more tools** - Extend functionality as needed

## 📖 Full Documentation

See `TRADING_TUTOR_SETUP.md` for comprehensive setup instructions, API details, and advanced configuration.

## 🎉 Enjoy!

Your AI Trading Tutor is ready to help users learn about trading and stay informed about market conditions!

