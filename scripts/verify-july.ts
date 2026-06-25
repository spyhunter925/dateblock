import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
} from "date-fns"

const month = new Date(2026, 6, 1) // July 2026
const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
const days = eachDayOfInterval({ start, end })

console.log("Start:", format(start, "yyyy-MM-dd EEEE"))
console.log("End:", format(end, "yyyy-MM-dd EEEE"))
console.log("July 2026 grid:")
for (let i = 0; i < days.length; i += 7) {
  console.log(
    days.slice(i, i + 7).map((d) => `${format(d, "d")} (${format(d, "EEE")})`).join(" | ")
  )
}
