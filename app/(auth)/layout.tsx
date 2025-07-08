import type React from "react"

// Este é o layout limpo, sem sidebar, para login e signup.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-teal/10 to-primary-dark-blue/10 p-4">
      {children}
    </div>
  )
}