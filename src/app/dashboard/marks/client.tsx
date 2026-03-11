"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BookOpenIcon, FlaskConicalIcon, FolderGit2Icon } from "lucide-react"

type OfferingItem = {
  id: string
  division: string | null
  course: {
    courseCode: string
    courseName: string
    courseType: string
    credits: number
    maxIsa: number
    maxMse: number
    maxEse: number
    maxTotal: number
  }
  faculty: { firstName: string; lastName: string } | null
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  theory: <BookOpenIcon className="size-3.5" />,
  practical: <FlaskConicalIcon className="size-3.5" />,
  project: <FolderGit2Icon className="size-3.5" />,
}

const TYPE_COLORS: Record<string, string> = {
  theory: "bg-blue/8 text-blue border-blue/20",
  practical: "bg-emerald-500/8 text-emerald-600 border-emerald-200",
  project: "bg-violet-500/8 text-violet-600 border-violet-200",
}

export function MarksOverviewClient({
  offerings,
  semesterLabel,
}: {
  offerings: OfferingItem[]
  semesterLabel: string
}) {
  const theory = offerings.filter((o) => o.course.courseType === "theory")
  const practical = offerings.filter((o) => o.course.courseType === "practical")
  const project = offerings.filter((o) => o.course.courseType === "project")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{semesterLabel}</p>
        <p className="text-sm text-muted-foreground">{offerings.length} course(s)</p>
      </div>

      {theory.length > 0 && (
        <Section title="Theory" count={theory.length} items={theory} />
      )}
      {practical.length > 0 && (
        <Section title="Practical" count={practical.length} items={practical} />
      )}
      {project.length > 0 && (
        <Section title="Project" count={project.length} items={project} />
      )}

      {offerings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <BookOpenIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No course offerings found</p>
          <p className="text-xs text-muted-foreground mt-1">Create offerings first to manage marks.</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, count, items }: { title: string; count: number; items: OfferingItem[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{title}</h2>
        <Badge variant="secondary" className="text-xs tabular-nums">{count}</Badge>
      </div>
      <div className="grid gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
        {items.map((o) => (
          <Link key={o.id} href={`/dashboard/marks/${o.id}`}>
            <Card className="group transition-all hover:border-blue/30 hover:shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    {o.course.courseCode}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {o.division && <Badge variant="secondary" className="text-xs">Div {o.division}</Badge>}
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${TYPE_COLORS[o.course.courseType] ?? ""}`}
                    >
                      {TYPE_ICONS[o.course.courseType]}
                      {o.course.courseType}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium mt-2 group-hover:text-blue transition-colors">
                  {o.course.courseName}
                </CardTitle>
                <CardDescription>
                  {o.faculty
                    ? `${o.faculty.firstName} ${o.faculty.lastName}`
                    : "Unassigned"}
                  {" · "}
                  {o.course.credits} credit{o.course.credits !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">ISA: {o.course.maxIsa}</span>
                  {o.course.maxMse > 0 && <span className="rounded bg-muted px-1.5 py-0.5">MSE: {o.course.maxMse}</span>}
                  <span className="rounded bg-muted px-1.5 py-0.5">ESE: {o.course.maxEse}</span>
                  <span className="rounded bg-blue/8 px-1.5 py-0.5 font-medium text-blue">Total: {o.course.maxTotal}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
