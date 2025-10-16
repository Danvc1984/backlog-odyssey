
"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "./scroll-area"

export type MultiSelectOption = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  className,
}: MultiSelectProps) {
  const handleSelect = (selectedValue: string) => {
    onValueChange(
      value.includes(selectedValue)
        ? value.filter(item => item !== selectedValue)
        : [...value, selectedValue]
    )
  }

  return (
    <div className={cn("border rounded-md p-2", className)}>
        <ScrollArea className="h-40">
            <div className="flex flex-col gap-2 p-2">
                {options.map(option => (
                <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm font-medium"
                >
                    <Checkbox
                    id={`genre-${option.value}`}
                    checked={value.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                    />
                    {option.label}
                </label>
                ))}
            </div>
        </ScrollArea>
    </div>
  )
}
