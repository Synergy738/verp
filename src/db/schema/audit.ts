import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import { user } from "./auth"

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    action: text("action").notNull(),
    actorId: text("actor_id").references(() => user.id),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_actor").on(table.actorId),
    index("idx_audit_logs_target").on(table.targetType, table.targetId),
    index("idx_audit_logs_created_at").on(table.createdAt),
  ]
)
