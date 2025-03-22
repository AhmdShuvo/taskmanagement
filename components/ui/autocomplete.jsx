import * as React from "react";
import { Check, ChevronsUpDown, Loader2, User, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";

const Autocomplete = React.forwardRef(
  ({ 
    label = "item",
    placeholder = "Search...",
    className, 
    children, 
    labelClass,
    loading = false,
    onSearch,
    onScrollEnd,
    renderEmpty,
    renderLoading,
    renderSelectedItem,
    hasMore = false,
    selectedValue = null,
    onSelect,
    noItemsMessage = "No items found",
    triggerPlaceholder = "Select...",
    useGridLayout = false,
    gridCols = 2,
    ...props 
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleSearch = (value) => {
      setSearchQuery(value);
      onSearch?.(value);
    };

    const handleSelect = (value) => {
      onSelect?.(value);
      setOpen(false);
    };

    const handleScroll = (e) => {
      const element = e.target;
      const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
      
      if (isAtBottom && hasMore && !loading) {
        onScrollEnd?.();
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            onClick={() => setOpen(!open)}
          >
            {selectedValue ? (
              renderSelectedItem ? 
                renderSelectedItem(selectedValue) : 
                selectedValue.label || selectedValue.toString()
            ) : (
              <span className="text-muted-foreground">{triggerPlaceholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0 shadow-lg border-0 rounded-lg overflow-hidden animate-in fade-in-0 zoom-in-95" 
          align="start"
          sideOffset={5}
        >
          <Command>
            <div className="flex items-center px-3 py-2 border-b bg-gradient-to-r from-primary/10 to-primary/5">
              <Search className="w-4 h-4 mr-2 text-primary" />
              <CommandInput 
                placeholder={placeholder || `Search ${label}...`} 
                value={searchQuery}
                onValueChange={handleSearch}
                className="h-9 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
              />
            </div>
            <CommandList 
              className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-visible py-2" 
              onScroll={handleScroll}
              style={{ overflowY: 'scroll' }}
            >
              {loading && !children && (
                renderLoading ? renderLoading() : (
                  <CommandLoading>
                    <div className="py-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Searching...</p>
                    </div>
                  </CommandLoading>
                )
              )}
              <CommandEmpty>
                {renderEmpty ? renderEmpty() : (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <User className="h-6 w-6 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{noItemsMessage}</p>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup 
                heading={
                  React.Children.count(children) > 0 && (
                    <div className="flex items-center gap-2 text-primary px-2 py-1 mb-2 sticky top-0 bg-white z-10">
                      <Icon icon="heroicons:users" className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
                      <span className="text-xs font-normal text-muted-foreground ml-auto">
                        {React.Children.count(children)} found
                      </span>
                    </div>
                  )
                }
              >
                {useGridLayout ? (
                  <div className={`grid grid-cols-1 sm:grid-cols-${gridCols} gap-2 px-2 pb-1`}>
                    {children}
                  </div>
                ) : (
                  children
                )}
              </CommandGroup>
              {loading && children && (
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-xs text-primary/70">Loading more items...</span>
                  </div>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
Autocomplete.displayName = "Autocomplete";

const AutocompleteItem = React.forwardRef(
  ({ children, value, onSelect, isSelected, className, icon, ...props }, ref) => {
    return (
      <CommandItem 
        ref={ref} 
        value={value.label || value.toString()}
        onSelect={() => onSelect?.(value)}
        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-[1.02] data-[selected=true]:bg-primary/10 hover:bg-primary/5", className)}
        {...props}
      >
        {icon}
        <div className="flex-1">{children}</div>
        {isSelected && <Check className="h-4 w-4 ml-auto text-primary" />}
      </CommandItem>
    );
  }
);
AutocompleteItem.displayName = "AutocompleteItem";

export { Autocomplete, AutocompleteItem };
