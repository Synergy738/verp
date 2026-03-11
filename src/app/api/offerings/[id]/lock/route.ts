import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"
import { lockMarks, unlockMarks, getMarksLock } from "@/db/queries"
import { z } from "zod"

const schema = z.object({
  component: z.enum(["isa", "mse", "ese", "all"]),
  lock: z.boolean(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user || (user.role !== "admin" && user.role !== "faculty")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { component, lock } = parsed.data
    if (lock) {
      await lockMarks(id, component, user.id)
    } else {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Only admins can unlock marks" }, { status: 403 })
      }
      await unlockMarks(id, component, user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Failed to toggle lock:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const locks = await Promise.all([
      getMarksLock(id, "isa"),
      getMarksLock(id, "mse"),
      getMarksLock(id, "ese"),
      getMarksLock(id, "all"),
    ])

    return NextResponse.json({
      isa: locks[0]?.isLocked ?? false,
      mse: locks[1]?.isLocked ?? false,
      ese: locks[2]?.isLocked ?? false,
      all: locks[3]?.isLocked ?? false,
    })
  } catch (err) {
    console.error("Failed to get lock status:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
