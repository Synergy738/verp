"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchIcon } from "lucide-react"

type AuditLogEntry = {
  id: string
  action: string
  actorName: string
  targetType: string
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

const ACTION_STYLES: Record<string, string> = {
  "marks.save": "text-blue border-blue/20 bg-blue/8",
  "marks.lock": "text-amber-600 border-amber-200 bg-amber-50",
  "marks.unlock": "text-emerald-600 border-emerald-200 bg-emerald-50",
  "enrollment.add": "text-emerald-600 border-emerald-200 bg-emerald-50",
  "enrollment.remove": "text-destructive border-red-200 bg-red-50",
  "offering.assign_faculty": "text-violet-600 border-violet-200 bg-violet-50",
  "batch.create": "text-blue border-blue/20 bg-blue/8",
  "batch.assign_student": "text-blue border-blue/20 bg-blue/8",
}

export function AuditLogClient({
  logs,
  actionTypes,
}: {
  logs: AuditLogEntry[]
  actionTypes: string[]
}) {
  const [search, setSearch] = useState("")
  const [filterAction, setFilterAction] = useState("all")

  const filtered = logs.filter((log) => {
    if (filterAction !== "all" && log.action !== filterAction) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetType.toLowerCase().includes(q) ||
        (log.targetId?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterAction("all")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filterAction === "all" ? "bg-blue text-blue-foreground shadow-sm" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            All
          </button>
          {actionTypes.map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filterAction === action
                  ? "bg-blue text-blue-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs font-medium text-muted-foreground tabular-nums">{filtered.length} entries</p>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead className="w-[180px]">Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${ACTION_STYLES[log.action] ?? ""}`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.actorName}</TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">{log.targetType}</span>
                    {log.targetId && (
                      <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        {log.targetId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-[200px] truncate">
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
