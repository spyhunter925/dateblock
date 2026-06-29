"use client"

import { useState } from "react"
import { CalendarGrid } from "@/components/calendar-grid"

interface BlockedDateEntry {
  userId: string
  userName: string
  date: string
}

interface Props {
  userId: string
  userName: string
  isCurrentUser: boolean
  blockedDates: BlockedDateEntry[]
  initialMonth?: Date
}

export function MemberCalendarClient({ userId, userName, isCurrentUser, blockedDates, initialMonth }: Props) {
  const [month, setMonth] = useState(initialMonth ?? new Date())

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold">
        {isCurrentUser ? "Your calendar" : `${userName}'s calendar`}
      </h2>
      <CalendarGrid
        mode="personal"
        currentUserId={userId}
        blockedDates={blockedDates}
        month={month}
        onMonthChange={setMonth}
        selectedDates={[]}
        onSelectionChange={() => {}}
        readOnly
      />
    </div>
  )
}
