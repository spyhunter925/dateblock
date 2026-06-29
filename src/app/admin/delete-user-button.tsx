"use client"

import { useTransition } from "react"

interface Props {
  userId: string
  userName: string
  userEmail: string
  deleteAction: (userId: string) => Promise<void>
}

export function DeleteUserButton({
  userId,
  userName,
  userEmail,
  deleteAction,
}: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `Permanently delete ${userName} (${userEmail})? This cannot be undone.`
          )
        ) {
          return
        }
        startTransition(async () => {
          await deleteAction(userId)
        })
      }}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete user"}
    </button>
  )
}