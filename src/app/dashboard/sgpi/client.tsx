"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { computeMarks, computeSgpi, type MarksInput, type CourseInfo } from "@/lib/sgpi"
import { DownloadIcon, FileSpreadsheetIcon, SearchIcon } from "lucide-react"
import { exportSgpiXlsx } from "@/lib/xlsx-export"

type StudentMarksEntry = {
  courseCode: string
  courseName: string
  courseType: string
  credits: number
  maxIsa: number
  maxMse: number
  maxEse: number
  maxTotal: number
  isa: number | null
  mse1: number | null
  mse2: number | null
  ese: number | null
}

type StudentSgpiData = {
  studentId: string
  rollNumber: string
  firstName: string
  lastName: string
  division: string | null
  marks: StudentMarksEntry[]
}

export function SgpiClient({
  students,
  semesterLabel,
}: {
  students: StudentSgpiData[]
  semesterLabel: string
}) {
  const [search, setSearch] = useState("")

  const filtered = students.filter((s) =>
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  function handleExportCsv() {
    const headers = ["Roll No.", "Name", "Division", "Credits", "CGP", "SGPI", "Status"]
    const csvRows = filtered.map((student) => {
      const entries = student.marks.map((m) => ({
        marks: { isa: m.isa, mse1: m.mse1, mse2: m.mse2, ese: m.ese } as MarksInput,
        course: {
          courseType: m.courseType, credits: m.credits,
          maxIsa: m.maxIsa, maxMse: m.maxMse, maxEse: m.maxEse, maxTotal: m.maxTotal,
        } as CourseInfo,
      }))
      const sgpi = computeSgpi(entries)
      return [
        student.rollNumber,
        `${student.firstName} ${student.lastName}`,
        student.division ?? "",
        sgpi.totalCredits,
        sgpi.totalCreditPoints,
        sgpi.sgpi ?? "",
        sgpi.hasFail ? "Fail" : sgpi.sgpi != null ? "Pass" : "",
      ]
    })

    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sgpi-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportXlsx() {
    const base64 = await exportSgpiXlsx({
      semesterLabel,
      students: filtered.map((s) => ({
        rollNumber: s.rollNumber,
        name: `${s.firstName} ${s.lastName}`,
        division: s.division,
        courses: s.marks,
      })),
    })
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sgpi-report.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">{semesterLabel}</p>
          <Badge variant="secondary" className="tabular-nums text-xs">{filtered.length} students</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <DownloadIcon className="size-3.5 mr-1.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXlsx}>
            <FileSpreadsheetIcon className="size-3.5 mr-1.5" /> Excel
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Roll No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[60px] text-center">Div</TableHead>
              <TableHead className="w-[80px] text-center">Credits</TableHead>
              <TableHead className="w-[80px] text-center">CGP</TableHead>
              <TableHead className="w-[80px] text-center">SGPI</TableHead>
              <TableHead className="w-[80px] text-center">Status</TableHead>
              <TableHead className="w-[80px] text-center">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No results.</TableCell>
              </TableRow>
            ) : (
              filtered.map((student, idx) => {
                const entries = student.marks.map((m) => ({
                  marks: { isa: m.isa, mse1: m.mse1, mse2: m.mse2, ese: m.ese } as MarksInput,
                  course: {
                    courseType: m.courseType,
                    credits: m.credits,
                    maxIsa: m.maxIsa,
                    maxMse: m.maxMse,
                    maxEse: m.maxEse,
                    maxTotal: m.maxTotal,
                  } as CourseInfo,
                }))
                const sgpi = computeSgpi(entries)

                return (
                  <TableRow key={student.studentId}>
                    <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{student.rollNumber}</TableCell>
                    <TableCell className="font-medium text-sm">{student.firstName} {student.lastName}</TableCell>
                    <TableCell className="text-center">
                      {student.division ? <Badge variant="secondary" className="text-xs">{student.division}</Badge> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{sgpi.totalCredits}</TableCell>
                    <TableCell className="text-center tabular-nums">{sgpi.totalCreditPoints}</TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">
                      {sgpi.sgpi ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {sgpi.hasFail
                        ? <Badge variant="outline" className="text-destructive border-red-200 bg-red-50 text-xs">Fail</Badge>
                        : sgpi.sgpi != null
                          ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">Pass</Badge>
                          : <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <StudentDetailDialog student={student} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StudentDetailDialog({ student }: { student: StudentSgpiData }) {
  return (
    <Dialog>
      <DialogTrigger render={<button className="text-xs font-medium text-blue underline-offset-2 hover:underline" />}>
        View
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {student.firstName} {student.lastName}
            <Badge variant="outline" className="font-mono text-xs font-normal">{student.rollNumber}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-center">Cr</TableHead>
                <TableHead className="text-center">ISA</TableHead>
                <TableHead className="text-center">MSE</TableHead>
                <TableHead className="text-center">ESE</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-center">GP</TableHead>
                <TableHead className="text-center">C*GP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.marks.map((m) => {
                const courseInfo: CourseInfo = {
                  courseType: m.courseType,
                  credits: m.credits,
                  maxIsa: m.maxIsa,
                  maxMse: m.maxMse,
                  maxEse: m.maxEse,
                  maxTotal: m.maxTotal,
                }
                const computed = computeMarks(
                  { isa: m.isa, mse1: m.mse1, mse2: m.mse2, ese: m.ese },
                  courseInfo,
                )
                return (
                  <TableRow key={m.courseCode}>
                    <TableCell className="font-mono text-xs">{m.courseCode}</TableCell>
                    <TableCell className="text-sm">{m.courseName}</TableCell>
                    <TableCell className="text-center tabular-nums">{m.credits}</TableCell>
                    <TableCell className="text-center tabular-nums">{m.isa ?? "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">{computed.finalMse ?? "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">{m.ese ?? "-"}</TableCell>
                    <TableCell className="text-center tabular-nums font-semibold">{computed.percentage != null ? computed.total : "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">{computed.percentage ?? "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {computed.gradePoint === "Fail"
                        ? <span className="font-medium text-destructive">Fail</span>
                        : computed.gradePoint ?? "-"
                      }
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {computed.creditPoints ?? "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {student.marks.length > 0 && (
          <SgpiSummary marks={student.marks} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SgpiSummary({ marks }: { marks: StudentMarksEntry[] }) {
  const entries = marks.map((m) => ({
    marks: { isa: m.isa, mse1: m.mse1, mse2: m.mse2, ese: m.ese } as MarksInput,
    course: {
      courseType: m.courseType,
      credits: m.credits,
      maxIsa: m.maxIsa,
      maxMse: m.maxMse,
      maxEse: m.maxEse,
      maxTotal: m.maxTotal,
    } as CourseInfo,
  }))
  const sgpi = computeSgpi(entries)

  return (
    <div className="flex items-center justify-end gap-6 rounded-lg border bg-muted/50 p-3 text-sm">
      <div>
        <span className="text-muted-foreground">Credits: </span>
        <span className="font-semibold tabular-nums">{sgpi.totalCredits}</span>
      </div>
      <div>
        <span className="text-muted-foreground">CGP: </span>
        <span className="font-semibold tabular-nums">{sgpi.totalCreditPoints}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">SGPI:</span>
        <span className="text-xl font-bold tabular-nums text-blue">{sgpi.sgpi ?? "-"}</span>
      </div>
    </div>
  )
}
