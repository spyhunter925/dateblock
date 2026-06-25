"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"

export function NavBar({ userName, isAdmin }: { userName?: string | null; isAdmin?: boolean }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary-700">
          Dateblock
        </Link>
        <div className="flex items-center gap-4">
          {userName && (
            <Link
              href="/profile"
              className="hidden text-sm text-slate-600 hover:text-primary-600 md:inline"
            >
              {userName}
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-slate-700 hover:text-primary-600">
              Admin
            </Link>
          )}
          <Link href="/notifications" className="text-sm font-medium text-slate-700 hover:text-primary-600">
            Notifications
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-slate-700 hover:text-primary-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
