import { PageHeader } from "@/components/page-header"
import { SgpiClient } from "./client"
import { getCurrentSemester, getAllStudents } from "@/db/queries"
import { getAllMarksBySemester } from "@/db/queries"

export const dynamic = "force-dynamic"

export default async function SgpiPage() {
  const semester = await getCurrentSemester()
  if (!semester) {
    return (
      <>
        <PageHeader title="SGPI Calculator" parent="Academics" parentHref="/dashboard/sgpi" />
        <div className="p-4 lg:p-6">
          <p className="text-sm text-muted-foreground">No active semester found.</p>
        </div>
      </>
    )
  }

  const [students, allMarks] = await Promise.all([
    getAllStudents(),
    getAllMarksBySemester(semester.id),
  ])

  const marksByStudent = new Map<string, typeof allMarks>()
  for (const m of allMarks) {
    if (!marksByStudent.has(m.studentId)) marksByStudent.set(m.studentId, [])
    marksByStudent.get(m.studentId)!.push(m)
  }

  const studentSgpiData = students.map((student) => {
    const marks = marksByStudent.get(student.id) ?? []
    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      division: student.division,
      marks: marks.map((m) => ({
        courseCode: m.courseOffering.course.courseCode,
        courseName: m.courseOffering.course.courseName,
        courseType: m.courseOffering.course.courseType,
        credits: m.courseOffering.course.credits,
        maxIsa: m.courseOffering.course.maxIsa,
        maxMse: m.courseOffering.course.maxMse,
        maxEse: m.courseOffering.course.maxEse,
        maxTotal: m.courseOffering.course.maxTotal,
        isa: m.isa,
        mse1: m.mse1,
        mse2: m.mse2,
        ese: m.ese,
      })),
    }
  })

  return (
    <>
      <PageHeader title="SGPI Calculator" parent="Academics" parentHref="/dashboard/sgpi" />
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <SgpiClient
          students={studentSgpiData}
          semesterLabel={`Sem ${semester.number} (${semester.academicYear.name})`}
        />
      </div>
    </>
  )
}
