import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"
import { enrollStudent, unenrollStudent } from "@/db/queries"
import { z } from "zod"

const schema = z.object({
  studentId: z.string().uuid(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || user.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await enrollStudent({
      courseOfferingId: id,
      studentId: parsed.data.studentId,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error("Failed to enroll student:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || user.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await unenrollStudent(id, parsed.data.studentId)
    if (!result) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Failed to unenroll student:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
