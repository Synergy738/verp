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

type AuditLogEntry = {
  id: string
  action: string
  actorName: string
  targetType: string
  targetId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  "marks.save": "text-blue",
  "marks.lock": "text-orange-500",
  "marks.unlock": "text-green-600",
  "enrollment.add": "text-green-600",
  "enrollment.remove": "text-destructive",
  "offering.assign_faculty": "text-purple-500",
  "batch.create": "text-blue",
  "batch.assign_student": "text-blue",
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
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterAction("all")}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              filterAction === "all" ? "bg-blue text-blue-foreground border-blue" : "hover:bg-muted"
            }`}
          >
            All
          </button>
          {actionTypes.map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                filterAction === action
                  ? "bg-blue text-blue-foreground border-blue"
                  : "hover:bg-muted"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} entries</p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead className="w-[160px]">Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
                      className={`text-xs ${ACTION_COLORS[log.action] ?? ""}`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.actorName}</TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">{log.targetType}</span>
                    {log.targetId && (
                      <span className="ml-1 font-mono text-[10px]">
                        {log.targetId.slice(0, 8)}...
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
