import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"
import { bulkUpsertMarks, getMarksLock } from "@/db/queries"
import { z } from "zod"

export const dynamic = "force-dynamic"

const marksEntrySchema = z.object({
  courseOfferingId: z.string().uuid(),
  marks: z.array(z.object({
    studentId: z.string().uuid(),
    isa: z.number().int().min(0).nullable(),
    mse1: z.number().int().min(0).nullable(),
    mse2: z.number().int().min(0).nullable(),
    ese: z.number().int().min(0).nullable(),
  })),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || user.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = marksEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { courseOfferingId, marks } = parsed.data

    // Check if marks are locked
    const allLock = await getMarksLock(courseOfferingId, "all")
    if (allLock?.isLocked && user.role !== "admin") {
      return NextResponse.json({ error: "Marks are locked" }, { status: 403 })
    }

    const entries = marks.map((m) => ({
      courseOfferingId,
      studentId: m.studentId,
      isa: m.isa,
      mse1: m.mse1,
      mse2: m.mse2,
      ese: m.ese,
    }))

    const result = await bulkUpsertMarks(entries)
    return NextResponse.json({ saved: result.length })
  } catch (err) {
    console.error("Failed to save marks:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
