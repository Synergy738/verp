"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn, signUp } from "@/lib/auth-client"
import { GraduationCapIcon, ShieldCheckIcon, BarChart3Icon, UsersIcon } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp.email({
          name,
          email,
          password,
        })
        if (error) {
          setError(error.message ?? "Sign up failed")
          return
        }
      } else {
        const { error } = await signIn.email({
          email,
          password,
        })
        if (error) {
          setError(error.message ?? "Invalid credentials")
          return
        }
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex min-h-svh", className)} {...props}>
      {/* Left: Branding Panel */}
      <div className="relative hidden w-[52%] overflow-hidden bg-blue lg:block">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue/20 via-transparent to-black/20" />

        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <GraduationCapIcon className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">EXCS</h1>
              <p className="text-xs font-medium text-white/60">College ERP</p>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
                College Management<br />
                <span className="text-white/70">Made Simple.</span>
              </h2>
              <p className="max-w-sm text-base leading-relaxed text-white/50">
                A unified platform for managing students, faculty, marks,
                attendance, and academic operations.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              <FeaturePill icon={<UsersIcon className="size-3.5" />} text="Student Management" />
              <FeaturePill icon={<BarChart3Icon className="size-3.5" />} text="SGPI Analytics" />
              <FeaturePill icon={<ShieldCheckIcon className="size-3.5" />} text="Role-Based Access" />
            </div>
          </div>

          {/* Bottom */}
          <p className="text-xs text-white/30">
            Electronics & Computer Science Department
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-card px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue">
              <GraduationCapIcon className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">EXCS</h1>
              <p className="text-xs text-muted-foreground">College ERP</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="mb-2 space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight">
                  {isSignUp ? "Create account" : "Welcome back"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isSignUp
                    ? "Enter your details to get started"
                    : "Sign in to access the dashboard"
                  }
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/8 px-3.5 py-2.5 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              {isSignUp && (
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  {!isSignUp && (
                    <a
                      href="#"
                      className="ml-auto text-xs font-medium text-blue underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full bg-blue text-blue-foreground hover:bg-blue/90 h-10 font-semibold"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </FieldSeparator>

              <Field>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError("")
                  }}
                >
                  {isSignUp ? "Sign In" : "Create Account"}
                </Button>
              </Field>

              <FieldDescription className="text-center text-xs">
                Contact IT admin for account access
              </FieldDescription>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  )
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur-sm">
      {icon}
      {text}
    </div>
  )
}
