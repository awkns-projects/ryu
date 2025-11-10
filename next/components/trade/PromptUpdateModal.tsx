"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileText } from "lucide-react"

interface PromptUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  currentPrompt: string
  onSuccess?: () => void
}

export function PromptUpdateModal({
  isOpen,
  onClose,
  agentId,
  currentPrompt,
  onSuccess,
}: PromptUpdateModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setPrompt(currentPrompt)
  }, [currentPrompt])

  const handleUpdate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('No auth token')

      const response = await fetch(`/api/go/trade/update-prompt/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          custom_prompt: prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update prompt')
      }

      alert('Prompt updated successfully!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to update prompt:', error)
      alert('Failed to update prompt')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-black border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Update AI Prompt
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Modify your agent's trading strategy and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-2 block">
              Custom Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              placeholder="Enter custom trading strategy prompt..."
              className="bg-white/5 border-white/20 text-white resize-none"
            />
            <p className="text-xs text-white/50 mt-2">
              💡 Tip: Be specific about risk management, position sizing, and market conditions
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !prompt.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Prompt'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

