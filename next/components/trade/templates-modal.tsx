"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromptTemplate {
  name: string
  content?: string
  description?: string
  image?: string
}

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  templates: PromptTemplate[]
  onSelectTemplate: (template: PromptTemplate) => void
  t: (key: string) => string
}

export function TemplatesModal({
  isOpen,
  onClose,
  isLoading,
  templates,
  onSelectTemplate,
  t,
}: TemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">{t('purchasedTemplates')}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t('purchasedTemplatesDescription')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-white/40 mb-4" />
            <p className="text-white/60">{t('loadingTemplates')}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('noTemplates')}</h3>
            <p className="text-white/60 text-center max-w-md">
              {t('noTemplatesDescription')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {templates.map((template) => (
              <div
                key={template.name}
                className="group relative p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ring-1 ring-white/20 shadow-lg">
                    {template.image ? (
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">📋</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-white/90 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-white/60 line-clamp-2">
                      {template.description || 'No description available'}
                    </p>
                  </div>
                </div>

                {template.content && (
                  <div className="mb-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-white/50 font-mono line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => {
                    onSelectTemplate(template)
                    onClose()
                  }}
                  className="w-full bg-white text-black hover:bg-white/90 font-medium"
                >
                  {t('useTemplate')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

