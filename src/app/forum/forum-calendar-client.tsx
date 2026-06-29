"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarGrid, CalendarDayInfo } from "@/components/calendar-grid"

interface BlockedDateEntry {
  userId: string
  userName: string
  date: string
}

interface Props {
  currentUserId: string
  blockedDates: BlockedDateEntry[]
  initialMonth?: Date
}

export function ForumCalendarClient({ currentUserId, blockedDates, initialMonth }: Props) {
  const [month, setMonth] = useState(initialMonth ?? new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedDateInfo, setSelectedDateInfo] = useState<CalendarDayInfo | null>(null)

  return (
    <div className="space-y-4">
      <CalendarGrid
        mode="forum"
        currentUserId={currentUserId}
        blockedDates={blockedDates}
        month={month}
        onMonthChange={setMonth}
        selectedDates={selectedDates}
        onSelectionChange={setSelectedDates}
        readOnly
        onDateClick={(date, info) => {
          if (info.blockerNames && info.blockerNames.length > 0) {
            setSelectedDateInfo(info)
          } else {
            setSelectedDateInfo(null)
          }
        }}
      />

      {selectedDateInfo && selectedDateInfo.blockerNames && selectedDateInfo.blockerNames.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg md:absolute md:right-4 md:top-4 md:left-auto md:mx-0 md:w-72">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">
              {format(selectedDateInfo.date, "MMMM d, yyyy")}
            </h3>
            <button
              onClick={() => setSelectedDateInfo(null)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <p className="mb-2 text-sm text-slate-600">Blocked by:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            {selectedDateInfo.blockerNames.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
