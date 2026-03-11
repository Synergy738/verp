"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { computeMarks, type MarksInput, type CourseInfo } from "@/lib/sgpi"
import { LockIcon, UnlockIcon, DownloadIcon } from "lucide-react"

type StudentMarks = {
  studentId: string
  rollNumber: string
  firstName: string
  lastName: string
  division: string | null
  isa: number | null
  mse1: number | null
  mse2: number | null
  ese: number | null
}

type BatchInfo = {
  name: string
  studentIds: string[]
}

type Props = {
  offeringId: string
  courseType: string
  maxIsa: number
  maxMse: number
  maxEse: number
  maxTotal: number
  students: StudentMarks[]
  division: string | null
  facultyName: string
  isLocked: boolean
  batches: BatchInfo[]
}

export function MarksEntryClient({
  offeringId,
  courseType,
  maxIsa,
  maxMse,
  maxEse,
  maxTotal,
  students,
  division,
  facultyName,
  isLocked: initialLocked,
  batches,
}: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<StudentMarks[]>(students)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [locked, setLocked] = useState(initialLocked)
  const [locking, setLocking] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<string>("all")
  const hasMse = maxMse > 0

  const filteredRows = useMemo(() => {
    if (selectedBatch === "all") return rows
    const batch = batches.find((b) => b.name === selectedBatch)
    if (!batch) return rows
    const ids = new Set(batch.studentIds)
    return rows.filter((r) => ids.has(r.studentId))
  }, [rows, selectedBatch, batches])

  const updateField = useCallback((studentId: string, field: keyof StudentMarks, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r
        const num = value === "" ? null : parseInt(value, 10)
        if (num != null && isNaN(num)) return r
        return { ...r, [field]: num }
      })
    )
    setSaved(false)
    setSaveError(null)
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseOfferingId: offeringId,
          marks: rows.map((r) => ({
            studentId: r.studentId,
            isa: r.isa,
            mse1: r.mse1,
            mse2: r.mse2,
            ese: r.ese,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save")
      }
      setSaved(true)
      router.refresh()
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleLock() {
    setLocking(true)
    try {
      const res = await fetch(`/api/offerings/${offeringId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component: "all", lock: !locked }),
      })
      if (res.ok) {
        setLocked(!locked)
        router.refresh()
      }
    } finally {
      setLocking(false)
    }
  }

  function handleExportCsv() {
    const courseInfo: CourseInfo = { courseType, credits: 0, maxIsa, maxMse, maxEse, maxTotal }
    const headers = ["Roll No.", "Name", "ISA"]
    if (hasMse) headers.push("MSE-1", "MSE-2", "Final MSE")
    headers.push("ESE", "Total", "%", "GP", "Status")

    const csvRows = filteredRows.map((row) => {
      const computed = computeMarks(row, courseInfo)
      const cols: (string | number)[] = [
        row.rollNumber,
        `${row.firstName} ${row.lastName}`,
        row.isa ?? "",
      ]
      if (hasMse) {
        cols.push(row.mse1 ?? "", row.mse2 ?? "", computed.finalMse ?? "")
      }
      cols.push(
        row.ese ?? "",
        computed.percentage != null ? computed.total : "",
        computed.percentage ?? "",
        computed.gradePoint === "Fail" ? "Fail" : computed.gradePoint ?? "",
        computed.status ?? "",
      )
      return cols
    })

    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `marks-${offeringId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{facultyName}</span>
          {division && <Badge variant="outline">Div {division}</Badge>}
          <Badge variant="outline" className="capitalize">{courseType}</Badge>
          <span>{filteredRows.length} student(s)</span>
          {locked && (
            <Badge variant="outline" className="text-destructive gap-1">
              <LockIcon className="size-3" /> Locked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveError && <span className="text-sm text-destructive">{saveError}</span>}
          {saved && <span className="text-sm text-muted-foreground">Saved</span>}
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <DownloadIcon className="size-3.5 mr-1.5" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            disabled={locking}
          >
            {locked ? <><UnlockIcon className="size-3.5 mr-1.5" /> Unlock</> : <><LockIcon className="size-3.5 mr-1.5" /> Lock</>}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || rows.length === 0 || locked}
            className="bg-blue text-blue-foreground hover:bg-blue/90"
          >
            {saving ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>

      {batches.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Batch:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedBatch("all")}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                selectedBatch === "all"
                  ? "bg-blue text-blue-foreground border-blue"
                  : "hover:bg-muted"
              }`}
            >
              All
            </button>
            {batches.map((b) => (
              <button
                key={b.name}
                onClick={() => setSelectedBatch(b.name)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  selectedBatch === b.name
                    ? "bg-blue text-blue-foreground border-blue"
                    : "hover:bg-muted"
                }`}
              >
                {b.name} ({b.studentIds.length})
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students enrolled in this course offering.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[80px] text-center">ISA ({maxIsa})</TableHead>
                {hasMse && (
                  <>
                    <TableHead className="w-[80px] text-center">MSE-1 ({maxMse})</TableHead>
                    <TableHead className="w-[80px] text-center">MSE-2 ({maxMse})</TableHead>
                    <TableHead className="w-[80px] text-center">Final MSE</TableHead>
                  </>
                )}
                <TableHead className="w-[80px] text-center">ESE ({maxEse})</TableHead>
                <TableHead className="w-[70px] text-center">Total</TableHead>
                <TableHead className="w-[60px] text-center">%</TableHead>
                <TableHead className="w-[50px] text-center">GP</TableHead>
                <TableHead className="w-[60px] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, idx) => {
                const courseInfo: CourseInfo = { courseType, credits: 0, maxIsa, maxMse, maxEse, maxTotal }
                const computed = computeMarks(row, courseInfo)
                return (
                  <TableRow key={row.studentId}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{row.rollNumber}</TableCell>
                    <TableCell>{row.firstName} {row.lastName}</TableCell>
                    <TableCell>
                      <MarkInput
                        value={row.isa}
                        max={maxIsa}
                        disabled={locked}
                        onChange={(v) => updateField(row.studentId, "isa", v)}
                      />
                    </TableCell>
                    {hasMse && (
                      <>
                        <TableCell>
                          <MarkInput
                            value={row.mse1}
                            max={maxMse}
                            disabled={locked}
                            onChange={(v) => updateField(row.studentId, "mse1", v)}
                          />
                        </TableCell>
                        <TableCell>
                          <MarkInput
                            value={row.mse2}
                            max={maxMse}
                            disabled={locked}
                            onChange={(v) => updateField(row.studentId, "mse2", v)}
                          />
                        </TableCell>
                        <TableCell className="text-center text-sm tabular-nums">
                          {computed.finalMse ?? "-"}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <MarkInput
                        value={row.ese}
                        max={maxEse}
                        disabled={locked}
                        onChange={(v) => updateField(row.studentId, "ese", v)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium tabular-nums">
                      {computed.percentage != null ? computed.total : "-"}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {computed.percentage ?? "-"}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {computed.gradePoint ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {computed.status === "pass" && <Badge variant="outline" className="text-green-600">Pass</Badge>}
                      {computed.status === "fail" && <Badge variant="outline" className="text-destructive">Fail</Badge>}
                      {computed.status == null && <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function MarkInput({ value, max, disabled, onChange }: { value: number | null; max: number; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <Input
      type="number"
      min={0}
      max={max}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-8 w-[70px] text-center tabular-nums"
      placeholder="-"
    />
  )
}
