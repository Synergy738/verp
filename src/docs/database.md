# Database Schema Documentation

## Overview

VERP uses PostgreSQL with Drizzle ORM for database management. This guide documents all tables, relationships, migrations, and query patterns.

---

## ER Diagram

```
┌─────────────────┐
│     user        │
├─────────────────┤
│ id (PK)         │
│ email (UQ)      │
│ name            │
│ emailVerified   │
│ createdAt       │
└────┬────────────┘
     │
     ├─────────────────┬──────────────┬──────────────────┐
     │                 │              │                  │
     ▼                 ▼              ▼                  ▼
┌──────────┐     ┌────────┐     ┌──────────┐      ┌──────────┐
│ session  │     │ account│     │ student  │      │ faculty  │
└──────────┘     └────────┘     └────┬─────┘      └────┬─────┘
                                      │                │
           ┌──────────────────────────┤                │
           │                          │                │
           ▼                          ▼                ▼
    ┌────────────────┐        ┌──────────────┐   ┌──────────────┐
    │  department    │        │ student_     │   │ course_      │
    │                │        │ enrollments  │   │ offerings    │
    └────────┬───────┘        └──────────────┘   └─────┬────────┘
             │                                          │
             ▼                                          │
    ┌──────────────┐                                    │
    │   courses    │◄───────────────────────────────────┘
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │  semesters       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  academic_years  │
    └──────────────────┘

┌──────────────────────────┐
│  course_offerings        │
├──────────────────────────┤
│ Contains: batches        │
│           enrollments    │
│           marks          │
│           marks_locks    │
└──────────────────────────┘

┌─────────────────────────┐
│  role_definitions       │
├─────────────────────────┤
│ └─ user_roles (many)    │
└─────────────────────────┘

┌──────────────────┐
│  audit_logs      │
│  (log everything)│
└──────────────────┘
```

---

## Table Reference

### Auth Tables

#### user
Core user account table (managed by Better Auth).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | Unique user ID |
| `name` | text | NOT NULL | Full name |
| `email` | text | NOT NULL, UNIQUE | User email |
| `emailVerified` | boolean | NOT NULL | Email verification status |
| `image` | text | | Profile image URL |
| `createdAt` | timestamp | NOT NULL | Account creation |
| `updatedAt` | timestamp | NOT NULL | Last update |

**Relationships:** 1 user → many sessions, accounts, roles

---

#### session
User session tokens for authentication.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | Session ID |
| `expiresAt` | timestamp | NOT NULL | Expiration time |
| `token` | text | NOT NULL, UNIQUE | Session token |
| `userId` | text | FK→user.id (CASCADE) | Associated user |
| `ipAddress` | text | | Client IP |
| `userAgent` | text | | Client user agent |
| `createdAt` | timestamp | NOT NULL | Creation time |
| `updatedAt` | timestamp | NOT NULL | Last update |

**Note:** Cascade deletes when user is deleted.

---

#### account
OAuth/provider accounts (supports multiple auth methods).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | Account ID |
| `accountId` | text | NOT NULL | Provider account ID |
| `providerId` | text | NOT NULL | Auth provider name |
| `userId` | text | FK→user.id (CASCADE) | Associated user |
| `accessToken` | text | | OAuth token |
| `refreshToken` | text | | Refresh token |
| `password` | text | | Hashed password (email auth) |
| `accessTokenExpiresAt` | timestamp | | Token expiration |
| `createdAt` | timestamp | NOT NULL | Creation time |

---

#### verification
Email verification and password reset codes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | Verification ID |
| `identifier` | text | NOT NULL | Email being verified |
| `value` | text | NOT NULL | Verification code/token |
| `expiresAt` | timestamp | NOT NULL | Code expiration |
| `createdAt` | timestamp | | Creation time |

---

### User Tables

#### departments
Academic departments.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | serial | PK | Department ID |
| `name` | text | NOT NULL, UNIQUE | Department name |
| `code` | text | NOT NULL, UNIQUE | Department code (CS, EC, etc.) |
| `description` | text | | Department details |
| `headOfDepartment` | text | | HOD name |
| `isActive` | boolean | DEFAULT true | Soft delete flag |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Indexes:** name, code

---

#### students
Student records.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Unique student ID |
| `authUserId` | text | FK→user.id (SET NULL), UNIQUE | Linked auth account |
| `firstName` | text | NOT NULL | First name |
| `lastName` | text | NOT NULL | Last name |
| `rollNumber` | text | NOT NULL, UNIQUE | Student roll number |
| `email` | text | NOT NULL, UNIQUE | Student email |
| `department` | text | NOT NULL | Department name |
| `division` | text | | Class division (A, B, C) |
| `year` | text | NOT NULL | Academic year (1st, 2nd, etc.) |
| `semester` | text | | Current semester |
| `phoneNo` | text | | Contact number |
| `dateOfBirth` | timestamp | | DOB |
| `gender` | text | | M/F/Other |
| `address` | text | | Residential address |
| `guardianName` | text | | Parent/guardian name |
| `guardianPhone` | text | | Guardian contact |
| `profilePic` | text | | Profile photo URL |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Indexes:** authUserId, department, year, isActive, email, rollNumber

---

#### faculty
Faculty/instructor records.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Unique faculty ID |
| `authUserId` | text | FK→user.id (SET NULL), UNIQUE | Linked auth account |
| `firstName` | text | NOT NULL | First name |
| `lastName` | text | NOT NULL | Last name |
| `employeeId` | text | NOT NULL, UNIQUE | Employee ID |
| `email` | text | NOT NULL, UNIQUE | Faculty email |
| `department` | text | NOT NULL | Department name |
| `designation` | text | | Job title |
| `phoneNo` | text | | Contact number |
| `qualification` | text | | Educational background |
| `specialization` | text | | Area of expertise |
| `profilePic` | text | | Profile photo URL |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Indexes:** authUserId, department, isActive

---

### Academic Structure

#### academic_years
Academic calendar years.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | serial | PK | Year ID |
| `name` | text | NOT NULL, UNIQUE | Year name (2025-2026) |
| `startDate` | timestamp | NOT NULL | Year start date |
| `endDate` | timestamp | NOT NULL | Year end date |
| `isCurrent` | boolean | DEFAULT false | Current academic year |
| `isActive` | boolean | DEFAULT true | Available for use |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Note:** Only one year should have isCurrent = true

---

#### semesters
Semesters within academic years.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | serial | PK | Semester ID |
| `academicYearId` | integer | FK→academic_years.id (RESTRICT) | Parent year |
| `number` | integer | NOT NULL | Semester number (1, 2, 3, 4) |
| `isCurrent` | boolean | DEFAULT false | Current semester |
| `isActive` | boolean | DEFAULT true | Available for use |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(academicYearId, number) - one semester per number per year

**Indexes:** academicYearId, isCurrent

---

### Courses & Offerings

#### courses
Course definitions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Course ID |
| `courseCode` | text | NOT NULL, UNIQUE | Code (CS201, EC301) |
| `courseName` | text | NOT NULL | Full course name |
| `departmentId` | integer | FK→departments.id (RESTRICT) | Offering dept |
| `courseType` | text | NOT NULL | theory/practical/lab |
| `credits` | integer | NOT NULL | Credit units |
| `maxIsa` | integer | NOT NULL | Max ISA marks |
| `maxMse` | integer | DEFAULT 0 | Max MSE marks |
| `maxEse` | integer | NOT NULL | Max ESE marks |
| `maxTotal` | integer | NOT NULL | Total max marks |
| `parentCourseId` | uuid | FK→courses.id (SET NULL) | Parent if sub-course |
| `description` | text | | Course details |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Indexes:** departmentId, courseType, isActive

---

#### course_offerings
Specific course instances in a semester.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Offering ID |
| `courseId` | uuid | FK→courses.id (RESTRICT) | Offered course |
| `semesterId` | integer | FK→semesters.id (RESTRICT) | Semester |
| `facultyId` | uuid | FK→faculty.id (SET NULL) | Assigned instructor |
| `division` | text | | Division (A, B, C) |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(courseId, semesterId, division)

**Indexes:** courseId, semesterId, facultyId

---

#### batches
Practical batch divisions within offerings.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Batch ID |
| `courseOfferingId` | uuid | FK→course_offerings.id (CASCADE) | Parent offering |
| `name` | text | NOT NULL | Batch name (B1, B2) |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(courseOfferingId, name)

---

#### batch_assignments
Student assignments to batches.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Assignment ID |
| `batchId` | uuid | FK→batches.id (CASCADE) | Target batch |
| `studentId` | uuid | FK→students.id (CASCADE) | Student |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(batchId, studentId)

---

#### student_enrollments
Student enrollment in course offerings.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Enrollment ID |
| `courseOfferingId` | uuid | FK→course_offerings.id (CASCADE) | Offering |
| `studentId` | uuid | FK→students.id (CASCADE) | Student |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(courseOfferingId, studentId)

---

### Marks & Assessment

#### marks
Student marks in courses.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Mark ID |
| `courseOfferingId` | uuid | FK→course_offerings.id (RESTRICT) | Offering |
| `studentId` | uuid | FK→students.id (CASCADE) | Student |
| `isa` | integer | | In-Semester Assessment marks (nullable) |
| `mse1` | integer | | Mid-Semester Exam marks (nullable) |
| `mse2` | integer | | Alternative MSE marks (nullable) |
| `ese` | integer | | End-Semester Exam marks (nullable) |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(courseOfferingId, studentId)

**Note:** Values must be within course's max marks

---

#### marks_locks
Lock status for mark components.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Lock record ID |
| `courseOfferingId` | uuid | FK→course_offerings.id (CASCADE) | Offering |
| `component` | text | NOT NULL | isa/mse/ese/all |
| `isLocked` | boolean | DEFAULT false | Lock status |
| `lockedBy` | text | FK→user.id (SET NULL) | Who locked |
| `lockedAt` | timestamp | | When locked |
| `unlockedBy` | text | FK→user.id (SET NULL) | Who unlocked |
| `unlockedAt` | timestamp | | When unlocked |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(courseOfferingId, component)

---

### Roles & Audit

#### role_definitions
Role templates with permissions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Role ID |
| `roleName` | text | NOT NULL, UNIQUE | admin, faculty, student |
| `displayName` | text | NOT NULL | Human-readable name |
| `description` | text | | Role description |
| `permissions` | jsonb | DEFAULT {} | Permissions JSON object |
| `hierarchyLevel` | integer | DEFAULT 0 | Role priority level |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

---

#### user_roles
User role assignments.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Assignment ID |
| `userId` | text | FK→user.id (CASCADE) | User |
| `roleDefinitionId` | uuid | FK→role_definitions.id (CASCADE) | Role |
| `assignedBy` | text | FK→user.id (SET NULL) | Who assigned |
| `assignedAt` | timestamp | NOT NULL | Assignment time |
| `expiresAt` | timestamp | | Expiration (if temp) |
| `isActive` | boolean | DEFAULT true | Active status |
| `createdAt` | timestamp | NOT NULL | Creation time |

**Constraint:** UNIQUE(userId, roleDefinitionId)

**Note:** A user can have multiple roles

---

#### audit_logs
Audit trail of all actions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | Log entry ID |
| `action` | text | NOT NULL | Action type (marks.save, enrollment.add) |
| `actorId` | text | FK→user.id | User performing action |
| `targetType` | text | NOT NULL | Resource type (courseOffering, student) |
| `targetId` | text | | Resource ID |
| `details` | jsonb | | Additional context (JSON) |
| `createdAt` | timestamp | NOT NULL | When action occurred |

**Indexes:** action, actorId, (targetType, targetId), createdAt

**Note:** Immutable after creation (append-only)

---

## Migration System

### How Migrations Work

VERP uses Drizzle ORM migrations stored as SQL files in `src/db/migrations/`.

Each migration:
- Is named with a timestamp: `0000_initial_schema.sql`
- Contains SQL to modify the database
- Is run in order (oldest first)
- Can only be run forward (no rollback)

### Migration Commands

```bash
# Push schema changes to database
npm run db:push

# Run pending SQL migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Generate new migration from schema changes
npm run db:generate

# View database in Drizzle Studio (GUI)
npm run db:studio
```

### Workflow for Adding a New Table

1. **Define the table** in `src/db/schema/*.ts`:
   ```typescript
   export const myTable = pgTable("my_table", {
     id: uuid("id").primaryKey().defaultRandom(),
     name: text("name").notNull(),
     createdAt: timestamp("created_at").notNull().defaultNow(),
   })
   ```

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review the SQL** in `src/db/migrations/` to ensure it's correct

4. **Run the migration**:
   ```bash
   npm run db:migrate
   ```

### Workflow for Modifying a Table

1. **Update schema definition** in `src/db/schema/*.ts`

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review and apply**:
   ```bash
   npm run db:migrate
   ```

### Important Notes

- Use `npm run db:push` for development (auto-generates and runs)
- Use `npm run db:migrate` for production (runs pre-generated migrations)
- Drizzle prevents breaking changes (will error instead of corrupt data)
- Always test migrations in a dev database first

---

## Common Queries

### Query Layer Organization

Queries are organized by domain in `src/db/queries/`:

```
src/db/queries/
├── academic.ts     # Academic year & semester queries
├── courses.ts      # Course and offering queries
├── marks.ts        # Marks entry and locking
├── students.ts     # Student management
├── faculty.ts      # Faculty management
├── enrollments.ts  # Enrollment queries
├── batches.ts      # Batch management
├── roles.ts        # Role and permission queries
└── audit.ts        # Audit log queries
```

### Example Query Patterns

**Get marks for a student:**
```typescript
const studentMarks = await db.query.marks.findMany({
  where: eq(marks.studentId, studentId),
  with: {
    courseOffering: { with: { course: true } }
  }
})
```

**Get course offering with all enrollments:**
```typescript
const offering = await db.query.courseOfferings.findFirst({
  where: eq(courseOfferings.id, offeringId),
  with: {
    course: true,
    faculty: true,
    enrollments: { with: { student: true } },
    marks: true
  }
})
```

**Check if marks are locked:**
```typescript
const lock = await db.query.marksLocks.findFirst({
  where: and(
    eq(marksLocks.courseOfferingId, offeringId),
    or(
      eq(marksLocks.component, "all"),
      eq(marksLocks.component, "isa")
    )
  )
})
```

---

## Drizzle ORM Patterns

### Quick Reference

**Select with relations:**
```typescript
const result = await db.query.tableName.findFirst({
  where: eq(table.id, id),
  with: {
    relatedTable: true  // includes the relationship
  }
})
```

**Filter with AND/OR:**
```typescript
import { and, or, eq, gt } from "drizzle-orm"

const results = await db.query.marks.findMany({
  where: and(
    eq(marks.studentId, studentId),
    gt(marks.isa, 10)
  )
})
```

**Insert with conflict handling:**
```typescript
await db.insert(marks).values({
  courseOfferingId,
  studentId,
  isa: 15
}).onConflictDoUpdate({
  target: [marks.courseOfferingId, marks.studentId],
  set: { isa: 15 }
})
```

**Transaction:**
```typescript
await db.transaction(async (tx) => {
  await tx.insert(studentEnrollments).values(...)
  await tx.insert(marks).values(...)
})
```

**Bulk operations:**
```typescript
await db.insert(marks).values([
  { courseOfferingId, studentId: id1, isa: 15 },
  { courseOfferingId, studentId: id2, isa: 12 },
])
```

### Connection Details

- **ORM**: Drizzle ORM (TypeScript-first)
- **Database**: PostgreSQL (Neon)
- **Pool**: `DATABASE_URL` for app queries
- **Direct**: `DIRECT_URL` for migrations only
- **Relations**: Automatic via `relations()` in `src/db/schema/relations.ts`

### Best Practices

1. **Always use relations**: Let Drizzle handle JOINs
2. **Type safety**: Drizzle catches SQL errors at compile time
3. **Parameterized queries**: Never concatenate user input
4. **Transactions for multi-table**: Use `db.transaction()` for consistency
5. **Indexes on foreign keys**: Already done in schema

---

## Key Constraints & Rules

### Cascades (auto cleanup)

- `session` → `user` (CASCADE) - Sessions deleted when user deleted
- `account` → `user` (CASCADE) - Accounts deleted when user deleted
- `student_enrollments` → `course_offerings` (CASCADE)
- `student_enrollments` → `students` (CASCADE)
- `marks` → `students` (CASCADE)
- `batches` → `course_offerings` (CASCADE)
- `batch_assignments` → `batches`, `students` (CASCADE)

### Restricts (prevent deletion)

- `courses` ← `departments` (RESTRICT) - Can't delete department with courses
- `course_offerings` ← `courses` (RESTRICT) - Can't delete course with offerings
- `course_offerings` ← `semesters` (RESTRICT) - Can't delete semester with offerings
- `marks` ← `course_offerings` (RESTRICT) - Can't delete offering with marks

### Unique Constraints

- `students.rollNumber` - Unique globally
- `faculty.employeeId` - Unique globally
- `courses.courseCode` - Unique globally
- `departments.name`, `departments.code` - Unique
- `semesters(academicYearId, number)` - Unique combo
- `course_offerings(courseId, semesterId, division)` - Unique combo
- `user_roles(userId, roleDefinitionId)` - Unique combo
- `marks(courseOfferingId, studentId)` - Unique combo

---

## See Also

- [API Documentation](./api.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [Drizzle Docs](https://orm.drizzle.team)
