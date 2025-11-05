import * as React from "react"

import { format, parse } from "date-fns"

import { enUS } from "date-fns/locale"

import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import { Calendar } from "@/components/ui/calendar"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholderText?: string;
  showTime?: boolean; // New prop to control time display
  disabled?: boolean; // New prop to disable the date picker
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholderText = "Select a date",
  showTime = false, // Default to false for backward compatibility
  disabled = false, // Default to false for backward compatibility
}: DatePickerProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(
    date ? (showTime ? format(date, "dd/MM/yyyy HH:mm") : format(date, "dd/MM/yyyy")) : ""
  )
  const [currentYear, setCurrentYear] = React.useState(date ? date.getFullYear() : new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = React.useState(date ? date.getMonth() : new Date().getMonth())

  // Time state
  const [selectedHour, setSelectedHour] = React.useState(date ? date.getHours() : 12)
  const [selectedMinute, setSelectedMinute] = React.useState(date ? date.getMinutes() : 0)

  // Sync input field when date changes (via calendar)
  React.useEffect(() => {
    if (date) {
      const formatString = showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"
      setInputValue(format(date, formatString))
      setCurrentYear(date.getFullYear())
      setCurrentMonth(date.getMonth())
      setSelectedHour(date.getHours())
      setSelectedMinute(date.getMinutes())
    }
  }, [date, showTime])

  // Handle manual typing in the button
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // On blur (or Enter), try to parse typed date
  const handleInputBlur = () => {
    let parsedDate: Date | undefined;
    let parsedTime = { hour: 12, minute: 0 }
    if (showTime) {
      // Parse date and time: dd/MM/yyyy HH:mm
      if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(inputValue)) {
        const [datePart, timePart] = inputValue.split(' ')
        parsedDate = parse(datePart, "dd/MM/yyyy", new Date())
        const [hour, minute] = timePart.split(':').map(Number)
        parsedTime = { hour, minute }
      }
      // Parse date and time: ddMMyyyyHHmm
      else if (/^\d{12}$/.test(inputValue)) {
        const day = inputValue.slice(0, 2)
        const month = inputValue.slice(2, 4)
        const year = inputValue.slice(4, 8)
        const hour = inputValue.slice(8, 10)
        const minute = inputValue.slice(10, 12)
        const formatted = `${day}/${month}/${year} ${hour}:${minute}`
        parsedDate = parse(formatted, "dd/MM/yyyy HH:mm", new Date())
        parsedTime = { hour: parseInt(hour), minute: parseInt(minute) }
      }
    } else {
      // Original date-only parsing logic
      if (/^\d{8}$/.test(inputValue)) {
        const day = inputValue.slice(0, 2)
        const month = inputValue.slice(2, 4)
        const year = inputValue.slice(4, 8)
        const formatted = `${day}/${month}/${year}`
        parsedDate = parse(formatted, "dd/MM/yyyy", new Date())
      }
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputValue)) {
        parsedDate = parse(inputValue, "dd/MM/yyyy", new Date())
      }
      else if (/^\d{2}\/\d{2}\/\d{2}$/.test(inputValue)) {
        parsedDate = parse(inputValue, "dd/MM/yyyy", new Date())
      }
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear()
      const month = parsedDate.getMonth()
      const day = parsedDate.getDate()
      const localDate = new Date(year, month, day, parsedTime.hour, parsedTime.minute, 0, 0)
      setDate(localDate)
      const formatString = showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"
      setInputValue(format(localDate, formatString))
    } else {
      setInputValue("")
    }
    setIsEditing(false)
  }

  // Handle calendar selection
  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (selectedDay) {
      const year = selectedDay.getFullYear()
      const month = selectedDay.getMonth()
      const day = selectedDay.getDate()
      const localDate = new Date(year, month, day, selectedHour, selectedMinute, 0, 0)
      setDate(localDate)
    } else {
      setDate(undefined)
    }
  }

  // Handle time change
  const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
    if (type === 'hour') {
      setSelectedHour(value)
    } else {
      setSelectedMinute(value)
    }
    // Update the date with new time
    if (date) {
      const newDate = new Date(date)
      if (type === 'hour') {
        newDate.setHours(value)
      } else {
        newDate.setMinutes(value)
      }
      setDate(newDate)
    }
  }

  // Handle year change
  const handleYearChange = (year: string) => {
    const newYear = parseInt(year)
    setCurrentYear(newYear)
    if (date) {
      const newDate = new Date(date)
      newDate.setFullYear(newYear)
      setDate(newDate)
    }
  }

  // Handle month change
  const handleMonthChange = (month: string) => {
    const newMonth = parseInt(month)
    setCurrentMonth(newMonth)
    if (date) {
      const newDate = new Date(date)
      newDate.setMonth(newMonth)
      setDate(newDate)
    }
  }

  // Generate time options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  // Generate year options from 1900 to 3000
  const yearOptions = Array.from({ length: 1101 }, (_, i) => 1900 + i)

  const monthOptions = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal relative",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onClick={() => !disabled && setIsEditing(true)}
          disabled={disabled}
        >
          {isEditing && !disabled ? (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputBlur()
                }
              }}
              className="bg-transparent border-none outline-none w-full text-left"
              placeholder={showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"}
              autoFocus
              disabled={disabled}
            />
          ) : (
            <>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                showTime ? format(date, "dd/MM/yyyy HH:mm") : format(date, "dd/MM/yyyy", { locale: enUS })
              ) : (
                <span>{placeholderText}</span>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2"
        side="bottom"
        align="start"
        sideOffset={8}
        collisionPadding={8}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={enUS}
          month={new Date(currentYear, currentMonth)}
          onMonthChange={(month) => {
            setCurrentYear(month.getFullYear())
            setCurrentMonth(month.getMonth())
          }}
        />
        {/* Time Selection */}
        {showTime && (
          <div className="border-t pt-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time</span>
            </div>
            
            <div className="flex gap-2 items-center justify-center">
              {/* Hour */}
              <Select
                value={selectedHour.toString()}
                onValueChange={(value) => handleTimeChange('hour', parseInt(value))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              {/* Minute */}
              <Select
                value={selectedMinute.toString()}
                onValueChange={(value) => handleTimeChange('minute', parseInt(value))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

