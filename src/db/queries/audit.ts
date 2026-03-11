import { eq, and, desc, gte } from "drizzle-orm"
import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { user } from "@/db/schema"

export async function createAuditLog(data: {
  action: string
  actorId: string
  targetType: string
  targetId?: string
  details?: Record<string, unknown>
}) {
  const [result] = await db
    .insert(auditLogs)
    .values({
      action: data.action,
      actorId: data.actorId,
      targetType: data.targetType,
      targetId: data.targetId ?? null,
      details: data.details ?? null,
    })
    .returning()
  return result
}

export async function getAuditLogs(params?: {
  limit?: number
  offset?: number
  actionFilter?: string
  since?: string
}) {
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const conditions = []
  if (params?.actionFilter && params.actionFilter !== "all") {
    conditions.push(eq(auditLogs.action, params.actionFilter))
  }
  if (params?.since) {
    conditions.push(gte(auditLogs.createdAt, new Date(params.since)))
  }

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorId: auditLogs.actorId,
      actorName: user.name,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  return rows
}

export async function getAuditActionTypes() {
  const rows = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs)
    .orderBy(auditLogs.action)
  return rows.map((r) => r.action)
}
