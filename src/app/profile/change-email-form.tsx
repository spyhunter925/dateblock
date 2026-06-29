"use client"

import { useState } from "react"
import { changeEmail } from "./actions"

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [result, setResult] = useState<{ success?: boolean; message: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setResult(null)

    const newEmail = formData.get("newEmail") as string
    const currentPassword = formData.get("currentPassword") as string

    try {
      const res = await changeEmail(newEmail, currentPassword)
      setResult(res)
    } catch {
      setResult({ message: "Something went wrong. Please try again." })
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {result && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            result.success
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
      <div>
        <label htmlFor="newEmail" className="block text-sm font-medium text-slate-700">
          Current email
        </label>
        <p className="mt-1 text-sm text-slate-500">{currentEmail}</p>
      </div>
      <div>
        <label htmlFor="newEmail" className="block text-sm font-medium text-slate-700">
          New email
        </label>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary-600 px-5 py-2.5 text-white hover:bg-primary-700 disabled:bg-slate-300 transition"
      >
        {pending ? "Updating..." : "Change email"}
      </button>
    </form>
  )
}