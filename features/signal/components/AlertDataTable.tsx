"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertRow,
  type AlertItem,
} from "@/features/signal/components/AlertRow";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 150, 200];
const DEFAULT_PAGE_SIZE = 25;

interface SignalDataTableProps {
  items: AlertItem[];
  showTime?: boolean;
}

export function SignalDataTable({
  items,
  showTime = false,
}: SignalDataTableProps) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(pageIndex, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = safePage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border">
        <Table wrapperClassName="max-h-[65vh]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="hover:bg-background">
              <TableHead className="w-10">Type</TableHead>
              <TableHead className="w-20">Chain</TableHead>
              <TableHead>Token</TableHead>
              <TableHead className="w-24">Link</TableHead>
              <TableHead className="w-20">Boost</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-24">24h Vol</TableHead>
              <TableHead className="w-24">MarketCap</TableHead>
              <TableHead className="w-24">Age</TableHead>
              {showTime && <TableHead className="w-40">Time</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((item) => (
              <AlertRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 px-2 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <p className="font-medium">Rows per page</p>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="h-8 w-[70px] rounded-md border bg-background px-2 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            Page {safePage + 1} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPageIndex(0)}
            disabled={safePage === 0}
            aria-label="Go to first page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Go to previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            aria-label="Go to next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPageIndex(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
            aria-label="Go to last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}