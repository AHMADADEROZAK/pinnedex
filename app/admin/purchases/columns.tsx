"use client"

import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { ExternalLink } from "lucide-react"

import { DataTable } from "@/components/ui/data-table"

export type PurchaseRow = {
  wallet: string
  tokens: number
  sol: string
  status: string
  txSignature: string
  txUrl: string
  date: string
}

export const purchaseColumns: LegacyColumnDef<PurchaseRow>[] = [
  {
    accessorKey: "wallet",
    header: "Wallet",
    cell: ({ row }) => (
      <span className="font-mono">{row.getValue("wallet") as string}</span>
    ),
  },
  {
    accessorKey: "tokens",
    header: "Tokens",
    cell: ({ row }) => {
      const value = row.getValue("tokens") as number
      return value.toLocaleString()
    },
  },
  {
    accessorKey: "sol",
    header: "SOL",
    cell: ({ row }) => (
      <span className="font-mono">{row.getValue("sol") as string}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const color =
        status === "verified"
          ? "text-emerald-600"
          : status === "rejected"
            ? "text-red-600"
            : "text-amber-600"
      return <span className={color}>{status}</span>
    },
  },
  {
    accessorKey: "txSignature",
    header: "Tx",
    cell: ({ row }) => {
      const sig = row.getValue("txSignature") as string
      const url = row.original.txUrl
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          <span className="font-mono text-xs">{sig.slice(0, 8)}...</span>
        </a>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.getValue("date") as string}</span>
    ),
  },
]

export function PurchasesTable({ data }: { data: PurchaseRow[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <DataTable columns={purchaseColumns as any} data={data} />
}
