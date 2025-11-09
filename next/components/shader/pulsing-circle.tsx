"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { PulsingBorder } from "@paper-design/shaders-react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, TrendingUp, ExternalLink, BarChart3, Globe, Loader2 } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from 'ai'
import ReactMarkdown from "react-markdown"

export default function PulsingCircle() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/trading-tutor',
    }),
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "👋 Welcome to your **AI Trading Tutor**!\n\nI'm here to help you understand trading and markets. I can:\n\n🔍 **Search** real-time market news and information\n📊 **Analyze** cryptocurrency prices and trends\n📈 **Perform** technical analysis on charts\n💡 **Explain** trading strategies and concepts\n\nWhat would you like to learn about today?"
      }
    ]
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const messageText = input.trim()
    setInput("")
    sendMessage({ text: messageText })
  }

  const renderToolCall = (toolName: string, args: any, result: any) => {
    if (toolName === "webSearch") {
      return (
        <div className="my-2 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Searching: {args.query}</span>
          </div>
          {result?.results && result.results.length > 0 && (
            <div className="space-y-2">
              {result.answer && (
                <div className="text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                  {result.answer}
                </div>
              )}
              <div className="space-y-1.5">
                {result.results.map((item: any, idx: number) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
                  >
                    <ExternalLink className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-white/60 line-clamp-2 mt-0.5">
                        {item.snippet}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (toolName === "getChartPrice") {
      return (
        <div className="my-2 bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Price Data for {args.symbol}</span>
          </div>
          {result?.error ? (
            <div className="text-xs text-red-400">{result.error}</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">
                {result.name} ({result.symbol})
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/50">Price:</span>
                  <span className="ml-1 text-white font-medium">${result.currentPrice?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-white/50">24h:</span>
                  <span className={`ml-1 font-medium ${result.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.priceChange24h?.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-white/50">Market Cap:</span>
                  <span className="ml-1 text-white">${(result.marketCap / 1e9).toFixed(2)}B</span>
                </div>
                <div>
                  <span className="text-white/50">Volume:</span>
                  <span className="ml-1 text-white">${(result.volume24h / 1e9).toFixed(2)}B</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (toolName === "technicalAnalysis") {
      return (
        <div className="my-2 bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Technical Analysis for {args.symbol}</span>
          </div>
          {result?.error ? (
            <div className="text-xs text-red-400">{result.error}</div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-white/80">{result.interpretation}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/50">RSI:</span>
                  <span className="ml-1 text-white">{result.technicalIndicators.rsi}</span>
                  <span className="ml-1 text-white/50">({result.technicalIndicators.rsiSignal})</span>
                </div>
                <div>
                  <span className="text-white/50">Trend:</span>
                  <span className={`ml-1 font-medium ${
                    result.technicalIndicators.trend === 'Bullish' ? 'text-green-400' :
                    result.technicalIndicators.trend === 'Bearish' ? 'text-red-400' : 'text-white/50'
                  }`}>
                    {result.technicalIndicators.trend}
                  </span>
                </div>
                <div>
                  <span className="text-white/50">Support:</span>
                  <span className="ml-1 text-white">${result.technicalIndicators.supportResistance.support}</span>
                </div>
                <div>
                  <span className="text-white/50">Resistance:</span>
                  <span className="ml-1 text-white">${result.technicalIndicators.supportResistance.resistance}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <>
      {/* Pulsing Circle Button with Rotating Text */}
      <motion.div
        className="fixed bottom-8 right-8 z-30 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Pulsing Border Circle */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ width: "80px", height: "80px" }}>
            <PulsingBorder
              colors={["#BEECFF", "#E77EDC", "#FF4C3E", "#00FF88", "#FFD700", "#FF6B35", "#8A2BE2"]}
              speed={1.5}
              roundness={2}
              thickness={0.15}
              softness={0.75}
              intensity={0.3}
              bloom={0.35}
              spots={4}
              spotSize={0.5}
              pulse={0.3}
              smoke={0.4}
              smokeSize={0.6}
              scale={0.7}
              width={80}
              height={80}
              style={{
                borderRadius: "50%",
              }}
            />
            {/* Logo in center */}
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={40} 
              height={40} 
              className="absolute z-10"
            />
          </div>

          {/* Rotating Text Around the Pulsing Border */}
          <motion.svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ transform: "scale(1.6)" }}
          >
            <defs>
              <path id="circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text className="text-sm fill-white/80" style={{ fontFamily: 'system-ui, -apple-system' }}>
              <textPath href="#circle" startOffset="0%">
                AI Trading Tutor • AI Trading Tutor • AI Trading Tutor • AI Trading Tutor •
              </textPath>
            </text>
          </motion.svg>
        </div>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed bottom-32 right-8 z-40 w-[380px] h-[480px] backdrop-blur-xl bg-black/70 border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Glass shine effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full relative flex items-center justify-center">
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    width={20} 
                    height={20}
                  />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">AI Trading Tutor</h3>
                  <p className="text-white/50 text-[11px] font-light">Real-time Market Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 h-[calc(100%-130px)] scrollbar-hide">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      message.role === "user"
                        ? "bg-white text-black shadow-sm"
                        : "bg-white/10 text-white/90 border border-white/20"
                    }`}
                  >
                    <div className="text-[13px] font-light leading-relaxed">
                      {message.parts?.map((part, partIndex) => {
                        if (part.type === 'text') {
                          return (
                            <div key={partIndex}>
                              <ReactMarkdown>{part.text}</ReactMarkdown>
                            </div>
                          )
                        }
                        if (part.type === 'tool-call') {
                          return (
                            <div key={partIndex}>
                              {renderToolCall(part.toolName, part.args, null)}
                            </div>
                          )
                        }
                        if (part.type === 'tool-result') {
                          return (
                            <div key={partIndex}>
                              {renderToolCall(part.toolName, {}, part.result)}
                            </div>
                          )
                        }
                        return null
                      })}
                      {!message.parts && message.content && (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 rounded-2xl px-3.5 py-2.5 border border-white/20">
                    <div className="flex gap-1.5">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                        className="w-1.5 h-1.5 bg-white/60 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-white/60 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-white/60 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  An error occurred. Please try again.
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-black/50 backdrop-blur-xl border-t border-white/10">
              <form onSubmit={handleFormSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about trading, markets, charts..."
                  disabled={isLoading}
                  className="w-full bg-white/10 border border-white/20 rounded-full pl-4 pr-11 py-2.5 text-white text-[13px] font-light placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/[0.15] transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-black rounded-full flex items-center justify-center transition-all duration-200 shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
