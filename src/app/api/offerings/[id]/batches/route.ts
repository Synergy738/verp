import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"
import { createBatch, assignStudentToBatch } from "@/db/queries"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(20),
})

const assignSchema = z.object({
  batchId: z.string().uuid(),
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
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await createBatch({
      courseOfferingId: id,
      name: parsed.data.name,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    if (err?.code === "23505") {
      return NextResponse.json({ error: "Batch name already exists" }, { status: 409 })
    }
    console.error("Failed to create batch:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || user.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = assignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await assignStudentToBatch({
      batchId: parsed.data.batchId,
      studentId: parsed.data.studentId,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error("Failed to assign student to batch:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
