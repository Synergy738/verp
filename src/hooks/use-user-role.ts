"use client"

import { useState, useEffect, useSyncExternalStore } from "react"

type UserRole = "admin" | "faculty" | "student"

type UserRoleData = {
  role: UserRole
  facultyId: string | null
  studentId: string | null
  loading: boolean
}

let cachedData: UserRoleData = {
  role: "admin",
  facultyId: null,
  studentId: null,
  loading: true,
}
let listeners: (() => void)[] = []

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot() {
  return cachedData
}

function getServerSnapshot() {
  return cachedData
}

let fetched = false

function fetchRole() {
  if (fetched) return
  fetched = true
  fetch("/api/me")
    .then((res) => {
      if (!res.ok) throw new Error("Unauthorized")
      return res.json()
    })
    .then((user) => {
      cachedData = {
        role: user.role,
        facultyId: user.facultyId,
        studentId: user.studentId,
        loading: false,
      }
      listeners.forEach((l) => l())
    })
    .catch(() => {
      cachedData = { ...cachedData, loading: false }
      listeners.forEach((l) => l())
    })
}

export function useUserRole(): UserRoleData {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    fetchRole()
  }, [])

  return data
}
