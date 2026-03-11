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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{semesterLabel}</p>
      </div>

      {theory.length > 0 && (
        <Section title="Theory" items={theory} />
      )}
      {practical.length > 0 && (
        <Section title="Practical" items={practical} />
      )}
      {project.length > 0 && (
        <Section title="Project" items={project} />
      )}

      {offerings.length === 0 && (
        <p className="text-sm text-muted-foreground">No course offerings found. Create offerings first.</p>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items: OfferingItem[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="grid gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
        {items.map((o) => (
          <Link key={o.id} href={`/dashboard/marks/${o.id}`}>
            <Card className="transition-colors hover:border-blue/30 hover:bg-muted/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    {o.course.courseCode}
                  </Badge>
                  {o.division && <Badge variant="secondary">Div {o.division}</Badge>}
                </div>
                <CardTitle className="text-sm font-medium mt-1.5">
                  {o.course.courseName}
                </CardTitle>
                <CardDescription>
                  {o.faculty
                    ? `${o.faculty.firstName} ${o.faculty.lastName}`
                    : "Unassigned"}
                  {" | "}
                  {o.course.credits} credit{o.course.credits !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>ISA: {o.course.maxIsa}</span>
                  {o.course.maxMse > 0 && <span>MSE: {o.course.maxMse}</span>}
                  <span>ESE: {o.course.maxEse}</span>
                  <span className="font-medium text-foreground">Total: {o.course.maxTotal}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
