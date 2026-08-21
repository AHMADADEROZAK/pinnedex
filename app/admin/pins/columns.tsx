"use client"

import { useState } from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ExternalLink, Loader2, Trash2 } from "lucide-react"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { deletePost } from "@/features/community/actions/community"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type PinRow = {
  id: string
  author: string
  email: string
  content: string
  likes: number
  comments: number
  txSignature?: string
  date: string
  postUrl: string
}

function DeletePinButton({ row }: { row: PinRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleDelete = async () => {
    if (busy) return
    setBusy(true)
    await deletePost(row.id)
    setBusy(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Delete pin"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this pin?</AlertDialogTitle>
            <AlertDialogDescription>
              This pin and all of its comments will be permanently deleted. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={busy}
              className="bg-red-600 hover:bg-red-700"
            >
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const pinColumns: LegacyColumnDef<PinRow>[] = [
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      const { author, email } = row.original
      return (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{author}</span>
          <span className="truncate text-xs text-muted-foreground">
            @{email.split("@")[0]}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => {
      const content = row.original.content
      return (
        <span
          className="line-clamp-2 max-w-xs text-sm text-foreground/90"
          title={content}
        >
          {content}
        </span>
      )
    },
  },
  {
    accessorKey: "likes",
    header: "Likes",
    cell: ({ row }) => <span>{row.getValue("likes") as number}</span>,
  },
  {
    accessorKey: "comments",
    header: "Comments",
    cell: ({ row }) => <span>{row.getValue("comments") as number}</span>,
  },
  {
    accessorKey: "txSignature",
    header: "Tx",
    cell: ({ row }) => {
      const sig = row.getValue("txSignature") as string | undefined
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {sig ? `${sig.slice(0, 8)}...` : "-"}
        </span>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.getValue("date") as string}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const pin = row.original
      return (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            nativeButton={false}
            aria-label="View pin"
            render={<Link href={pin.postUrl} target="_blank" />}
          >
            <ExternalLink className="size-4" />
          </Button>
          <DeletePinButton row={pin} />
        </div>
      )
    },
  },
]

export function PinsTable({ data }: { data: PinRow[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <DataTable columns={pinColumns as any} data={data} />
}
