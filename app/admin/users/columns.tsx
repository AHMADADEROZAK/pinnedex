"use client"

import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { DataTable } from "@/components/ui/data-table"

export type UserRow = {
  name: string
  email: string
  role: string
  wallets: number
  purchases: number
  tokens: number
  joined: string
}

export const userColumns: LegacyColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <span className={role === "admin" ? "rounded bg-muted px-1.5 py-0.5 text-xs" : "text-muted-foreground"}>
          {role}
        </span>
      )
    },
  },
  {
    accessorKey: "wallets",
    header: "Wallets",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("wallets")}</span>
    ),
  },
  {
    accessorKey: "purchases",
    header: "Purchases",
    cell: ({ row }) => (
      <span className="text-right">{String(row.getValue("purchases"))}</span>
    ),
  },
  {
    accessorKey: "tokens",
    header: "Tokens",
    cell: ({ row }) => {
      const value = row.getValue("tokens") as number
      return <span className="text-right">{value.toLocaleString()}</span>
    },
  },
  {
    accessorKey: "joined",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.getValue("joined") as string}</span>
    ),
  },
]

export function UsersTable({ data }: { data: UserRow[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <DataTable columns={userColumns as any} data={data} />
}
