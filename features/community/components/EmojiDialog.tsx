"use client"

import { useState, useEffect } from "react"
import { Smile, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

interface EmojiData {
  character: string
  group: string
  subGroup: string
  unicodeName: string
  slug: string
}

interface EmojiDialogProps {
  onSelect: (emoji: string) => void
}

const GROUP_LABELS: Record<string, string> = {
  "smileys-emotion": "Smileys",
  "people-body": "People",
  "animals-nature": "Animals",
  "food-drink": "Food",
  "travel-places": "Travel",
  "activities": "Activities",
  "objects": "Objects",
  "symbols": "Symbols",
  "flags": "Flags",
}

const ALL_GROUPS = [
  "smileys-emotion",
  "people-body",
  "animals-nature",
  "food-drink",
  "travel-places",
  "activities",
  "objects",
  "symbols",
  "flags",
]

export function EmojiDialog({ onSelect }: EmojiDialogProps) {
  const [open, setOpen] = useState(false)
  const [emojis, setEmojis] = useState<EmojiData[]>([])
  const [category, setCategory] = useState("smileys-emotion")

  const filtered = emojis.filter((e) => e.group === category)
  const loading = open && emojis.length === 0

  useEffect(() => {
    if (!open || emojis.length > 0) return
    fetch("/api/emojis")
      .then((r) => r.json())
      .then((data: EmojiData[]) => setEmojis(data))
      .catch(() => {})
  }, [open, emojis.length])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                >
                  <Smile className="size-4" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Add emoji</TooltipContent>
      </Tooltip>

      <AlertDialogContent size="default" className="overflow-hidden p-0 sm:max-w-md">
        <AlertDialogHeader className="space-y-0 border-b px-5 py-4 text-left">
          <div className="flex w-full items-center justify-between">
            <AlertDialogTitle>Emoji</AlertDialogTitle>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="border-b px-4 py-2">
              <Combobox
                value={category}
                onValueChange={(val) => { if (val) setCategory(val) }}
                items={ALL_GROUPS}
              >
                <ComboboxInput placeholder="Search category..." className="h-8 text-xs" />
                <ComboboxContent align="start" className="w-[180px]">
                  <ComboboxEmpty>No categories</ComboboxEmpty>
                  <ComboboxList>
                    {(g: string) => (
                      <ComboboxItem key={g} value={g} className="text-xs">
                        {GROUP_LABELS[g] ?? g}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="max-h-72 overflow-y-auto p-4">
              <div className="grid grid-cols-8 gap-1">
                {filtered.map((emoji) => (
                  <button
                    key={emoji.slug}
                    type="button"
                    onClick={() => {
                      onSelect(emoji.character)
                      setOpen(false)
                    }}
                    title={emoji.unicodeName}
                    className="flex size-10 items-center justify-center rounded-md text-xl transition-colors hover:bg-muted"
                  >
                    {emoji.character}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
