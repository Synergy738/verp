import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserRoles } from "@/db/queries/roles"
import { getFacultyByAuthUserId } from "@/db/queries/faculty"
import { getStudentByAuthUserId } from "@/db/queries/students"

export type SessionUser = {
  id: string
  name: string
  email: string
  image: string | null
  role: "admin" | "faculty" | "student"
  facultyId: string | null
  studentId: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const userId = session.user.id
  const roles = await getUserRoles(userId)
  const roleNames = roles.map((r) => r.roleDefinition.roleName)

  let role: "admin" | "faculty" | "student" = "student"
  if (roleNames.includes("admin")) role = "admin"
  else if (roleNames.includes("faculty")) role = "faculty"

  let facultyId: string | null = null
  let studentId: string | null = null

  if (role === "faculty" || role === "admin") {
    const fac = await getFacultyByAuthUserId(userId)
    facultyId = fac?.id ?? null
  }

  if (role === "student") {
    const stu = await getStudentByAuthUserId(userId)
    studentId = stu?.id ?? null
  }

  return {
    id: userId,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
    role,
    facultyId,
    studentId,
  }
}
