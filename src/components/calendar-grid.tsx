"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "./icons"

export type CalendarMode = "personal" | "forum"

export interface CalendarDayInfo {
  date: Date
  blockedByCurrentUser: boolean
  blockedByOthers: boolean
  blockerNames?: string[]
  isCommonFree?: boolean
  isFree: boolean
}

interface CalendarGridProps {
  mode: CalendarMode
  currentUserId: string
  blockedDates: { userId: string; userName: string; date: string }[]
  month: Date
  onMonthChange: (date: Date) => void
  selectedDates: Date[]
  onSelectionChange: (dates: Date[]) => void
  onDateClick?: (date: Date, info: CalendarDayInfo) => void
  readOnly?: boolean
}

export function CalendarGrid({
  mode,
  currentUserId,
  blockedDates,
  month,
  onMonthChange,
  selectedDates,
  onSelectionChange,
  onDateClick,
  readOnly = false,
}: CalendarGridProps) {
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const hasDragged = useRef(false)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const blockedIndex = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string }[]>()
    for (const bd of blockedDates) {
      const list = map.get(bd.date) || []
      list.push({ userId: bd.userId, userName: bd.userName })
      map.set(bd.date, list)
    }
    return map
  }, [blockedDates])

  const getDayInfo = useCallback(
    (date: Date): CalendarDayInfo => {
      const dateKey = format(date, "yyyy-MM-dd")
      const blockers = blockedIndex.get(dateKey) || []
      const blockedByCurrentUser = blockers.some((b) => b.userId === currentUserId)
      const blockedByOthers = blockers.some((b) => b.userId !== currentUserId)
      const isCommonFree = mode === "forum" && blockers.length === 0
      const isFree =
        isSameMonth(date, month) &&
        !isBefore(date, startOfDay(new Date())) &&
        blockers.length === 0
      return {
        date,
        blockedByCurrentUser,
        blockedByOthers,
        blockerNames: blockers.map((b) => b.userName),
        isCommonFree,
        isFree,
      }
    },
    [blockedIndex, currentUserId, mode, month]
  )

  const isSelected = useCallback(
    (date: Date) => selectedDates.some((d) => isSameDay(d, date)),
    [selectedDates]
  )

  const toggleDate = useCallback(
    (date: Date) => {
      if (readOnly) return
      if (isSelected(date)) {
        onSelectionChange(selectedDates.filter((d) => !isSameDay(d, date)))
      } else {
        onSelectionChange([...selectedDates, date])
      }
    },
    [onSelectionChange, readOnly, selectedDates, isSelected]
  )

  const canInteract = useCallback(
    (date: Date) =>
      !readOnly &&
      isSameMonth(date, month) &&
      !isBefore(date, startOfDay(new Date())),
    [readOnly, month]
  )

  const handleMouseDown = (date: Date) => {
    if (!canInteract(date)) return
    setIsDragging(true)
    setDragStart(date)
    setDragEnd(date)
    hasDragged.current = false
  }

  const handleMouseEnter = (date: Date) => {
    if (!isDragging || !canInteract(date)) return
    setDragEnd(date)
    if (dragStart && !isSameDay(date, dragStart)) {
      hasDragged.current = true
    }
  }

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false)
      return
    }

    if (hasDragged.current) {
      // Range selection: add all dates in the dragged range to the existing selection
      const range = eachDayOfInterval({
        start: isBefore(dragStart, dragEnd) ? dragStart : dragEnd,
        end: isBefore(dragStart, dragEnd) ? dragEnd : dragStart,
      }).filter((d) => canInteract(d))

      const merged = [...selectedDates]
      for (const d of range) {
        if (!merged.some((existing) => isSameDay(existing, d))) {
          merged.push(d)
        }
      }
      onSelectionChange(merged)
    }

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  const handleClick = (date: Date, info: CalendarDayInfo) => {
    if (hasDragged.current) {
      hasDragged.current = false
      return
    }

    if (onDateClick) {
      onDateClick(date, info)
      return
    }

    if (canInteract(date)) {
      toggleDate(date)
    }
  }

  const dayClasses = (date: Date, info: CalendarDayInfo) => {
    const today = isSameDay(date, new Date())
    const past = isBefore(date, startOfDay(new Date()))
    const selected = isSelected(date)
    const outOfMonth = !isSameMonth(date, month)
    const base =
      "relative flex h-12 flex-col items-center justify-center rounded-lg border text-sm transition select-none md:h-16"
    let classes = base

    if (outOfMonth) {
      classes += " border-transparent text-slate-300"
    } else if (past) {
      classes += " border-slate-100 bg-slate-50 text-slate-400"
    } else if (selected) {
      classes += " border-primary-600 bg-primary-100 text-primary-900"
    } else if (mode === "forum" && (info.blockerNames?.length ?? 0) > 0) {
      classes += " border-amber-300 bg-amber-100 text-amber-900"
    } else if (info.blockedByCurrentUser) {
      classes += " border-red-300 bg-red-100 text-red-900"
    } else if (info.isFree) {
      classes += " border-green-300 bg-green-100 text-green-900"
    } else {
      classes += " border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }

    if (today) {
      classes += " ring-2 ring-primary-600 ring-offset-1"
    }

    return classes
  }

  const dragHighlighted = useCallback(
    (date: Date) => {
      if (!isDragging || !dragStart || !dragEnd) return false
      if (!isSameMonth(date, month)) return false
      const range = eachDayOfInterval({
        start: isBefore(dragStart, dragEnd) ? dragStart : dragEnd,
        end: isBefore(dragStart, dragEnd) ? dragEnd : dragStart,
      })
      return range.some((d) => isSameDay(d, date))
    },
    [isDragging, dragStart, dragEnd, month]
  )

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 md:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-1 md:gap-2"
        onMouseLeave={() => {
          if (isDragging) handleMouseUp()
        }}
      >
        {days.map((date) => {
          const info = getDayInfo(date)
          const past = isBefore(date, startOfDay(new Date()))
          const outOfMonth = !isSameMonth(date, month)
          const dragActive = dragHighlighted(date)
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={past || outOfMonth}
              onMouseDown={() => handleMouseDown(date)}
              onMouseEnter={() => handleMouseEnter(date)}
              onMouseUp={handleMouseUp}
              onClick={() => handleClick(date, info)}
              className={dayClasses(date, info) + (dragActive ? " bg-primary-50" : "")}
            >
              <span className="font-medium">{format(date, "d")}</span>
              {mode === "forum" && info.blockerNames && info.blockerNames.length > 0 && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-green-100 border border-green-300" />
          <span className="text-slate-600">Free date</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-amber-100 border border-amber-300" />
          <span className="text-slate-600">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-red-100 border border-red-300" />
          <span className="text-slate-600">Blocked by you</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-primary-100 border border-primary-600" />
          <span className="text-slate-600">Selected</span>
        </div>
      </div>
    </div>
  )
}
