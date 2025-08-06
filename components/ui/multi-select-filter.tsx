"use client"

import * as React from "react"
import { Check, X, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[]
  selectedValues: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Selecione...",
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const isSelected = selectedValues.includes(value)
    if (isSelected) {
      onSelectionChange(selectedValues.filter((v) => v !== value))
    } else {
      onSelectionChange([...selectedValues, value])
    }
  }

  const handleClear = () => {
    onSelectionChange([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <div className="flex gap-1 flex-wrap items-center">
            {selectedValues.length > 0 ? (
              <>
                {selectedValues.slice(0, 2).map((value) => {
                  const label = options.find(opt => opt.value === value)?.label;
                  return <Badge variant="secondary" key={value}>{label}</Badge>;
                })}
                {selectedValues.length > 2 && (
                  <Badge variant="secondary">+{selectedValues.length - 2} a mais</Badge>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
          <CommandGroup>
            {selectedValues.length > 0 && (
                <div className="flex justify-end p-1 border-b">
                    <Button variant="link" size="sm" onClick={handleClear}>Limpar Seleção</Button>
                </div>
            )}
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}