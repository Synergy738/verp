/**
 * API Response Helpers
 *
 * Standard response format for REST API routes.
 */

import { NextResponse } from "next/server"
import { getErrorMessage } from "./error-utils"

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status })
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Wrap a route handler with standardized error catching.
 * Catches unexpected errors and returns sanitized messages.
 */
export function withApiHandler(fn: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await fn(request, context)
    } catch (err) {
      console.error("[API Error]", err)
      return apiError(getErrorMessage(err, "Internal server error"), 500)
    }
  }
}
