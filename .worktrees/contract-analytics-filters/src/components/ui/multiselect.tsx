import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface Option {
  label: string
  value: string
  disable?: boolean
  searchText?: string
  fieldMap?: Record<string, string>
}

interface MultiSelectProps {
  options: Option[]
  onValueChange: (value: Option[]) => void
  defaultValue?: Option[]
  placeholder?: string
  animation?: number
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
  commandProps?: React.ComponentPropsWithoutRef<typeof Command>
  value?: Option[]
  defaultOptions?: Option[]
  hideClearAllButton?: boolean
  hidePlaceholderWhenSelected?: boolean
  emptyIndicator?: React.ReactNode
  creatable?: boolean
  createLabel?: string
  enableMultiTermFilter?: boolean
  multiTermOperator?: "AND" | "OR"
  searchFieldsPriority?: string[]
}

const MultipleSelector = React.forwardRef<
  React.ElementRef<typeof Button>,
  MultiSelectProps
>((
  {
    options,
    onValueChange,
    value,
    defaultValue = [],
    placeholder = "Select options",
    animation = 0,
    maxCount = 3,
    modalPopover = false,
    className,
    commandProps,
    defaultOptions = [],
    hideClearAllButton = false,
    hidePlaceholderWhenSelected = false,
    emptyIndicator,
    creatable = false,
    createLabel = "Create",
    enableMultiTermFilter = false,
    multiTermOperator = "AND",
    searchFieldsPriority,
    ...props
  },
  ref
) => {
  const availableOptions = React.useMemo(
    () => (options.length > 0 ? options : defaultOptions),
    [options, defaultOptions]
  )

  const [selectedValues, setSelectedValues] = React.useState<Option[]>(
    value || defaultValue
  )
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    if (value) {
      setSelectedValues(value)
    }
  }, [value])

  const handleUnselect = React.useCallback(
    (option: Option) => {
      const newSelectedValues = selectedValues?.filter(
        (s) => s.value !== option.value
      )
      setSelectedValues(newSelectedValues)
      onValueChange(newSelectedValues)
    },
    [selectedValues, onValueChange]
  )

  const createOption = React.useCallback(
    (inputValue: string) => {
      if (!inputValue.trim()) return
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inputValue.trim())) {
        return // Don't create option if email is invalid
      }
      
      const newOption: Option = {
        label: inputValue?.trim?.(),
        value: inputValue?.trim?.()
      }
      
      // Check if option already exists
      const exists = [...availableOptions, ...selectedValues]?.some(
        option => option.value?.toLowerCase?.() === newOption?.value?.toLowerCase?.()
      )
      
      if (!exists) {
        const newSelectedValues = [...selectedValues, newOption]
        setSelectedValues(newSelectedValues)
        onValueChange(newSelectedValues)
        setInputValue("")
      }
    },
    [availableOptions, selectedValues, onValueChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = e.target as HTMLInputElement
      if (e.key === "Enter" && creatable && input.value?.trim?.()) {
        e.preventDefault()
        createOption(input.value)
        return
      }
      
      if (input.value === "") {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedValues.length > 0) {
            handleUnselect(selectedValues[selectedValues.length - 1])
          }
        }
        if (e.key === "Escape") {
          input.blur()
        }
      }
    },
    [selectedValues, handleUnselect, creatable, createOption]
  )

  const toggleOption = React.useCallback(
    (option: Option) => {
      const newSelectedValues = selectedValues?.some(
        (selectedValue) => selectedValue?.value === option?.value
      )
        ? selectedValues?.filter(
            (selectedValue) => selectedValue?.value !== option?.value
          )
        : [...selectedValues, option]
      setSelectedValues(newSelectedValues)
      onValueChange(newSelectedValues)
    },
    [selectedValues, onValueChange]
  )

  const handleClearAll = React.useCallback(() => {
    setSelectedValues([])
    onValueChange([])
  }, [onValueChange])

  const handleTogglePopover = React.useCallback(() => {
    setIsPopoverOpen((prev) => !prev)
  }, [])

  const clearExtraOptions = React.useCallback(() => {
    const newSelectedValues = selectedValues?.slice?.(0, maxCount)
    setSelectedValues(newSelectedValues)
    onValueChange(newSelectedValues)
  }, [selectedValues, maxCount, onValueChange])


  React.useEffect(() => {
    if (selectedValues.length > maxCount) {
      clearExtraOptions()
    }
  }, [selectedValues, maxCount, clearExtraOptions])

  const handleToggleOption = React.useCallback(
    (option: Option) => {
      if (option.disable) {
        return
      }
      if (animation > 0) {
        setIsAnimating(true)
        setTimeout(() => {
          setIsAnimating(false)
        }, animation)
      }
      toggleOption(option)
    },
    [animation, toggleOption]
  )

  const displayOptions = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    if (!enableMultiTermFilter || !query) return availableOptions

    const tokens = query.split(/\s+/).filter(Boolean)
    const hasPriority = Array.isArray(searchFieldsPriority) && searchFieldsPriority.length > 0

    // Build field texts based on priority list (only these fields are used)
    const getFieldTexts = (o: Option) => {
      if (!hasPriority) return []
      const texts: string[] = []
      for (const key of searchFieldsPriority!) {
        if (key === "label") {
          const v = o.label?.toLowerCase?.() ?? ""
          if (v) texts.push(v)
        } else if (key === "value") {
          const v = o.value?.toLowerCase?.() ?? ""
          if (v) texts.push(v)
        } else if (o.fieldMap && o.fieldMap[key]) {
          const v = o.fieldMap[key]?.toLowerCase?.() ?? ""
          if (v) texts.push(v)
        }
      }
      return texts
    }

    if (hasPriority) {
      // Match against any of the prioritized fields; item passes if any field matches
      const matchSingle = (fields: string[]) => fields.some((f) => f.includes(query))
      const matchToken = (fields: string[], t: string) => fields.some((f) => f.includes(t))

      return availableOptions.filter((o) => {
        const fields = getFieldTexts(o)
        if (fields.length === 0) return false
        if (tokens.length < 2) return matchSingle(fields)
        return multiTermOperator === "AND"
          ? tokens.every((t) => matchToken(fields, t))
          : tokens.some((t) => matchToken(fields, t))
      })
    }

    // Fallback: when no priority specified, match against label only
    const labelText = (o: Option) => o.label?.toLowerCase?.() ?? ""
    if (tokens.length < 2) {
      return availableOptions.filter((o) => labelText(o).includes(query))
    }
    return availableOptions.filter((o) =>
      multiTermOperator === "AND"
        ? tokens.every((t) => labelText(o).includes(t))
        : tokens.some((t) => labelText(o).includes(t)),
    )
  }, [availableOptions, inputValue, enableMultiTermFilter, multiTermOperator, searchFieldsPriority])

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
      modal={modalPopover}
    >
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          {...props}
          onClick={handleTogglePopover}
          className={cn(
            "flex h-auto min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-gray-600  dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:ring-gray-400",
            className
          )}
          variant="outline"
        >
          {selectedValues.length > 0 ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-wrap items-center">
                {selectedValues?.slice?.(0, maxCount)?.map?.((option) => {
                  const animationStyle = isAnimating
                    ? { animationDuration: `${animation}ms` }
                    : {}
                  return (
                    <Badge
                      key={option.value}
                      className={cn(
                        "data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground",
                        "data-[fixed]:bg-muted-foreground data-[fixed]:text-muted data-[fixed]:hover:bg-muted-foreground",
                        "dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                      )}
                      style={animationStyle}
                    >
                      {option.label}
                      <button
                        className={cn(
                          "ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          (option as any).fixed &&
                            "hidden"
                        )}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(option)
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={() => handleUnselect(option)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200" />
                      </button>
                    </Badge>
                  )
                })}
                {selectedValues.length > maxCount && (
                  <Badge
                    className={cn(
                      "bg-transparent text-foreground border-foreground/1 hover:bg-transparent dark:text-gray-200 dark:border-gray-600"
                    )}
                  >
                    {`+ ${selectedValues.length - maxCount} more`}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleClearAll()
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={handleClearAll}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200" />
                    </button>
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                {!hideClearAllButton && (
                  <div>
                    <button
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleClearAll()
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={handleClearAll}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200" />
                    </button>
                  </div>
                )}
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 dark:text-gray-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full mx-auto">
              <span className="text-sm text-muted-foreground mx-3 dark:text-gray-400">
                {placeholder}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 dark:text-gray-400" />
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-full  dark:border-gray-600"
        align="start"
        onEscapeKeyDown={() => setIsPopoverOpen(false)}
      >
        <Command
          {...commandProps}
          shouldFilter={enableMultiTermFilter ? false : commandProps?.shouldFilter}
          onKeyDown={handleKeyDown}
          className="!w-full"
        >
          <CommandInput 
            placeholder={hidePlaceholderWhenSelected && selectedValues.length > 0 ? "" : "Search..."} 
            className="dark:text-gray-100 dark:placeholder:text-gray-400" 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {emptyIndicator ?? "No results found"}
            </CommandEmpty>
            <CommandGroup>
              {creatable && inputValue.trim() && 
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue.trim()) &&
                !availableOptions.some(option => 
                  option.value.toLowerCase() === inputValue.trim().toLowerCase()
                ) && !selectedValues?.some?.(option => 
                  option.value.toLowerCase() === inputValue.trim().toLowerCase()
                ) && (
                <CommandItem
                  onSelect={() => createOption(inputValue)}
                  className="cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
                  <span className="text-blue-600 dark:text-blue-400">{createLabel} "{inputValue.trim()}"</span>
                </CommandItem>
              )}
              {displayOptions.map((option) => {
                const isSelected = selectedValues?.some?.(
                  (selectedValue) => selectedValue.value === option.value
                )
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggleOption(option)}
                    style={{
                      pointerEvents: "auto",
                      opacity: option.disable ? 0.5 : 1,
                    }}
                    className="cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 dark:text-gray-200",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})

MultipleSelector.displayName = "MultipleSelector"

export default MultipleSelector
export { MultipleSelector }
