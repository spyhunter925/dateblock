"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { CalendarGrid } from "@/components/calendar-grid"
import { blockDates, unblockDates } from "./actions"

interface BlockedDateEntry {
  userId: string
  userName: string
  date: string
}

interface Props {
  userId: string
  userName: string
  forumName: string
  initialBlockedDates: BlockedDateEntry[]
  initialMonth?: Date
}

export function PersonalCalendarClient({
  userId,
  userName,
  forumName,
  initialBlockedDates,
  initialMonth,
}: Props) {
  const [month, setMonth] = useState(initialMonth ?? new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>(initialBlockedDates)
  const [lastAction, setLastAction] = useState<{ type: "block" | "unblock"; dates: string[] } | null>(null)
  const [showConfirm, setShowConfirm] = useState<"block" | "unblock" | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedKeys = selectedDates.map((d) => format(d, "yyyy-MM-dd"))

  const selectedBlockedCount = selectedKeys.filter((k) =>
    blockedDates.some((b) => b.date === k && b.userId === userId)
  ).length

  const selectedFreeCount = selectedKeys.length - selectedBlockedCount

  const handleBlock = async () => {
    if (selectedFreeCount === 0) return
    setShowConfirm("block")
  }

  const handleUnblock = async () => {
    if (selectedBlockedCount === 0) return
    setShowConfirm("unblock")
  }

  const confirmAction = () => {
    if (!showConfirm) return
    const dates = selectedKeys
    startTransition(async () => {
      try {
        if (showConfirm === "block") {
          await blockDates(dates)
          setBlockedDates((prev) => [
            ...prev,
            ...dates
              .filter((d) => !prev.some((p) => p.date === d && p.userId === userId))
              .map((d) => ({ userId, userName, date: d })),
          ])
          setLastAction({ type: "block", dates })
        } else {
          await unblockDates(dates)
          setBlockedDates((prev) => prev.filter((p) => !(p.userId === userId && dates.includes(p.date))))
          setLastAction({ type: "unblock", dates })
        }
        setSelectedDates([])
        setShowConfirm(null)
      } catch (e) {
        alert("Something went wrong. Please try again.")
      }
    })
  }

  const undo = () => {
    if (!lastAction) return
    startTransition(async () => {
      try {
        if (lastAction.type === "block") {
          await unblockDates(lastAction.dates)
          setBlockedDates((prev) =>
            prev.filter((p) => !(p.userId === userId && lastAction.dates.includes(p.date)))
          )
        } else {
          await blockDates(lastAction.dates)
          setBlockedDates((prev) => [
            ...prev,
            ...lastAction.dates
              .filter((d) => !prev.some((p) => p.date === d && p.userId === userId))
              .map((d) => ({ userId, userName, date: d })),
          ])
        }
        setLastAction(null)
      } catch {
        alert("Undo failed. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Calendar</h1>
          <p className="text-sm text-slate-600">Forum: {forumName}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/forum"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Forum Calendar
          </Link>
          <Link
            href="/members"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Members
          </Link>
        </div>
      </div>

      <CalendarGrid
        mode="personal"
        currentUserId={userId}
        blockedDates={blockedDates}
        month={month}
        onMonthChange={setMonth}
        selectedDates={selectedDates}
        onSelectionChange={setSelectedDates}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={handleBlock}
          disabled={selectedFreeCount === 0 || isPending}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-white hover:bg-primary-700 disabled:bg-slate-300 transition"
        >
          Block {selectedFreeCount > 0 ? selectedFreeCount : ""}
        </button>
        <button
          onClick={handleUnblock}
          disabled={selectedBlockedCount === 0 || isPending}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 hover:bg-slate-50 disabled:bg-slate-100 transition"
        >
          Unblock {selectedBlockedCount > 0 ? selectedBlockedCount : ""}
        </button>
        <button
          onClick={() => setSelectedDates([])}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 hover:bg-slate-50 transition"
        >
          Clear selection
        </button>
      </div>

      {lastAction && (
        <div className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-white shadow">
          <span className="text-sm">
            {lastAction.type === "block" ? "Dates blocked" : "Dates unblocked"}.
          </span>
          <button onClick={undo} disabled={isPending} className="text-sm font-medium underline hover:no-underline">
            Undo
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">
              {showConfirm === "block" ? "Block selected dates?" : "Unblock selected dates?"}
            </h3>
            <p className="mt-2 text-slate-600">
              {showConfirm === "block"
                ? `You are about to block ${selectedFreeCount} date(s).`
                : `You are about to unblock ${selectedBlockedCount} date(s).`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isPending}
                className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
