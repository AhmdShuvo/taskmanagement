"use client";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, Eye, ArrowUpDown, Filter, Calendar, User, X, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify/react";
import { Grip, Menu } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import useUserRoles from "@/hooks/useUserRoles";

const statusColors = {
  open: "warning",
  'in progress': "info",
  completed: "success",
  blocked: "destructive",
};
const priorityColors = {
  high: "success",
  medium: "warning",
  low: "destructive",
};

const TaskTable = ({ data, openSheet }) => {
  const isDesktop = useMediaQuery("(max-width: 1280px)");
  const router = useRouter();
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const { isCEO, canManageTasks, isLoading: rolesLoading } = useUserRoles();
  
  // Filter states
  const [statusFilter, setStatusFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');
  const [dueDateFilter, setDueDateFilter] = React.useState('');
  const [assignedToFilter, setAssignedToFilter] = React.useState('');
  
  // Status and priority options
  const [statusOptions, setStatusOptions] = React.useState([]);
  const [priorityOptions, setPriorityOptions] = React.useState([]);
  const [userOptions, setUserOptions] = React.useState([]);
  
  // Fetch filter options
  React.useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch status options
        const statusResponse = await fetch('/api/task-statuses', { headers });
        if (statusResponse.ok) {
          const statuses = await statusResponse.json();
          setStatusOptions(statuses);
        }
        
        // Fetch priority options
        const priorityResponse = await fetch('/api/task-priorities', { headers });
        if (priorityResponse.ok) {
          const priorities = await priorityResponse.json();
          setPriorityOptions(priorities);
        }
        
        // Fetch user options
        const userResponse = await fetch('/api/users', { headers });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserOptions(userData.data || []);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    
    fetchFilterOptions();
  }, []);

  // Custom filter function for due dates
  const dueDateFilterFn = React.useCallback((row, columnId, value) => {
    if (!value) return true;
    
    const dueDate = row.original.dueDate;
    if (!dueDate) return value === 'none';
    
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isDateToday = date.toDateString() === today.toDateString();
    
    // Calculate this week's range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const isThisWeek = date >= startOfWeek && date <= endOfWeek;
    
    // Calculate this month's range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const isThisMonth = date >= startOfMonth && date <= endOfMonth;
    
    // Is overdue
    const isOverdue = date < today && !isDateToday;
    
    // Is upcoming (next 7 days but not today)
    const inOneWeek = new Date(today);
    inOneWeek.setDate(today.getDate() + 7);
    const isUpcoming = date > today && date <= inOneWeek && !isDateToday;
    
    switch (value) {
      case 'today': return isDateToday;
      case 'thisWeek': return isThisWeek;
      case 'thisMonth': return isThisMonth;
      case 'overdue': return isOverdue;
      case 'upcoming': return isUpcoming;
      case 'none': return false;
      default: return true;
    }
  }, []);
  
  // Custom filter function for assigned users
  const assignedToFilterFn = React.useCallback((row, columnId, value) => {
    if (!value) return true;
    
    const assignedUsers = row.original.assignedTo || [];
    if (value === 'unassigned') return assignedUsers.length === 0;
    
    return assignedUsers.some(user => user._id === value);
  }, []);

  // Apply filters
  React.useEffect(() => {
    if (statusFilter) {
      table.getColumn('status')?.setFilterValue(statusFilter);
    } else {
      table.getColumn('status')?.setFilterValue('');
    }
  }, [statusFilter]);

  React.useEffect(() => {
    if (priorityFilter) {
      table.getColumn('priority')?.setFilterValue(priorityFilter);
    } else {
      table.getColumn('priority')?.setFilterValue('');
    }
  }, [priorityFilter]);
  
  React.useEffect(() => {
    if (dueDateFilter) {
      table.getColumn('dueDate')?.setFilterValue(dueDateFilter);
    } else {
      table.getColumn('dueDate')?.setFilterValue('');
    }
  }, [dueDateFilter]);
  
  React.useEffect(() => {
    if (assignedToFilter) {
      table.getColumn('assignedTo')?.setFilterValue(assignedToFilter);
    } else {
      table.getColumn('assignedTo')?.setFilterValue('');
    }
  }, [assignedToFilter]);
  
  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setDueDateFilter('');
    setAssignedToFilter('');
    setColumnFilters([]);
  };

  // Apply role-based filtering to tasks
  const filteredData = React.useMemo(() => {
    if (rolesLoading) return [];
    
    // If user is CEO, show all tasks
    if (isCEO()) return data;
    
    // Otherwise, filter tasks based on client-side access check
    // This assumes the API has already done the initial filtering
    return data;
  }, [data, rolesLoading, isCEO]);

  const columns = [
    {
      accessorKey: "title",
      header: ({ table }) => (
        <div className="flex items-center gap-3 pl-4">
          <span className="text-default-800 font-semibold">Task Name</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-shrink-0 w-1.5 h-10" style={{ 
            backgroundColor: statusColors[row.original?.status] || '#d1d5db',
            borderRadius: '2px'
          }}></div>
          <div className="flex flex-col">
            <div className="text-sm font-medium text-default-800 capitalize max-w-[200px] truncate">
              {row.original?.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">
              {row.original?.description?.substring(0, 60)}{row.original?.description?.length > 60 ? '...' : ''}
            </div>
          </div>
        </div>
      ),
    },

    {
      accessorKey: "status",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-semibold"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const status = row.original?.status;
        const color = statusColors[status] || "default";
        return (
          <div>
            <Badge
              variant="soft"
              color={color}
              className="capitalize px-2.5 py-1 text-xs font-medium shadow-sm"
            >
              {status}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value ? row.getValue(id) === value : true;
      },
    },
    {
      accessorKey: "assignedTo",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="px-0 font-semibold"
          >
            Assigned To
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const assignedUsers = row.original.assignedTo;

        return (
          <div>
            {assignedUsers?.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden">
                {assignedUsers.slice(0, 3).map((user) => (
                  <TooltipProvider key={user._id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8 border-2 border-background rounded-full">
                      <AvatarImage src={user.image?.src} alt={user.name}/>
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{user.name?.charAt(0).toUpperCase()}{user.name?.split(' ')[1]?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {assignedUsers.length > 3 && (
                  <Avatar className="h-8 w-8 border-2 border-background rounded-full">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">+{assignedUsers.length - 3}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Unassigned</div>
            )}
          </div>
        );
      },
      filterFn: assignedToFilterFn,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-semibold"
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const priority = row.original?.priority;
        const color = priorityColors[priority] || "default";

        return (
          <Badge
            color={color}
            className="capitalize px-2.5 py-1 text-xs font-medium"
            variant="soft"
          >
            {priority}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value ? row.getValue(id) === value : true;
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-semibold"
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const dueDate = row.original?.dueDate;

        if (!dueDate) {
          return <div className="text-sm text-muted-foreground whitespace-nowrap">No Due Date</div>;
        }

        try {
          const date = new Date(dueDate);
          const today = new Date();
          // Define isToday before using it
          const isDateToday = date.toDateString() === today.toDateString();
          const isOverdue = date < today && !isDateToday;

          return (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-destructive' : isDateToday ? 'bg-warning' : 'bg-success'}`}></div>
              <div className={`text-sm whitespace-nowrap ${isOverdue ? 'text-destructive font-medium' : isDateToday ? 'text-warning-foreground font-medium' : 'text-muted-foreground'}`}>
                {format(date, 'MMM dd, yyyy')}
              </div>
            </div>
          );
        } catch (error) {
          console.error("Error formatting date:", error);
          return <div className="text-sm text-muted-foreground whitespace-nowrap">Invalid Date</div>;
        }
      },
      filterFn: dueDateFilterFn,
    },
  ];

  // Update the Actions column to conditionally show buttons based on role
  const actionsColumn = {
    id: "actions",
      header: "Actions",
      cell: ({ row }) => {
      // Hide action buttons for CEO role
      if (isCEO()) {
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/task/${row.original._id}`);
              }}
            >
              <span className="sr-only">View task</span>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      }
      
      // Show all action buttons for other roles
      return (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/task/${row.original._id}`);
            }}
          >
            <span className="sr-only">View task</span>
            <Eye className="h-4 w-4" />
          </Button>
          
          {canManageTasks() && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openSheet) openSheet(row.original); // Open edit sheet
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      );
    },
  };

  // Make sure the actions column is included
  const allColumns = React.useMemo(() => {
    const taskColumns = [...columns];
    
    // Find if actions column already exists and replace it
    const actionIndex = taskColumns.findIndex(col => col.id === 'actions');
    if (actionIndex >= 0) {
      taskColumns[actionIndex] = actionsColumn;
    } else {
      taskColumns.push(actionsColumn);
    }
    
    return taskColumns;
  }, [columns, isCEO, canManageTasks]);

  // Update table to use filteredData and allColumns
  const table = useReactTable({
    data: filteredData,
    columns: allColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Get status label by value
  const getStatusLabel = (value) => {
    const status = statusOptions.find(s => s.name === value);
    return status?.label || value;
  };
  
  // Get priority label by value
  const getPriorityLabel = (value) => {
    const priority = priorityOptions.find(p => p.name === value);
    return priority?.label || value;
  };
  
  // Get user name by ID
  const getUserName = (userId) => {
    const user = userOptions.find(u => u._id === userId);
    return user?.name || 'Unknown User';
  };
  
  // Get due date filter label
  const getDueDateLabel = (value) => {
    switch (value) {
      case 'today': return 'Due Today';
      case 'thisWeek': return 'Due This Week';
      case 'thisMonth': return 'Due This Month';
      case 'overdue': return 'Overdue';
      case 'upcoming': return 'Upcoming';
      case 'none': return 'No Due Date';
      default: return '';
    }
  };

  // Count active filters
  const activeFilterCount = [
    statusFilter, 
    priorityFilter, 
    dueDateFilter, 
    assignedToFilter
  ].filter(Boolean).length;

  return (
    <div className="w-full flex flex-col h-full">
      <CardHeader className="flex-none p-4 sm:p-6 flex-row flex-wrap mb-0 bg-card">
        <div className="flex-1 flex items-center gap-3 md:gap-4 flex-wrap">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-default-200 text-default-700 font-medium hover:bg-muted/80"
              >
                <Icon icon="heroicons:arrow-up-down" className="mr-2 h-4 w-4" />
                Sort <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 shadow-lg border-border/50">
              <DropdownMenuItem onClick={() => setSorting([{ id: 'title', desc: false }])}>
                <Icon icon="heroicons:document-text" className="mr-2 h-4 w-4" />
                Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSorting([{ id: 'title', desc: true }])}>
                <Icon icon="heroicons:document-text" className="mr-2 h-4 w-4" />
                Title (Z-A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSorting([{ id: 'dueDate', desc: false }])}>
                <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                Due Date (Oldest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSorting([{ id: 'dueDate', desc: true }])}>
                <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                Due Date (Newest)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSorting([{ id: 'priority', desc: false }])}>
                <Icon icon="heroicons:flag" className="mr-2 h-4 w-4" />
                Priority (Low-High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSorting([{ id: 'priority', desc: true }])}>
                <Icon icon="heroicons:flag" className="mr-2 h-4 w-4" />
                Priority (High-Low)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={statusFilter ? "default" : "outline"}
                className={`${statusFilter ? "bg-primary text-white" : "border-default-200 text-default-700 font-medium hover:bg-muted/80"}`}
              >
                <Icon icon="heroicons:tag" className="mr-2 h-4 w-4" />
                Status {statusFilter && `(${getStatusLabel(statusFilter)})`} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 shadow-lg border-border/50">
              <DropdownMenuItem onClick={() => setStatusFilter('')}>All Statuses</DropdownMenuItem>
              <DropdownMenuSeparator />
              {statusOptions.map(status => (
                <DropdownMenuItem 
                  key={status._id}
                  onClick={() => setStatusFilter(status.name)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span>{status.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={priorityFilter ? "default" : "outline"}
                className={`${priorityFilter ? "bg-primary text-white" : "border-default-200 text-default-700 font-medium hover:bg-muted/80"}`}
              >
                <Icon icon="heroicons:flag" className="mr-2 h-4 w-4" />
                Priority {priorityFilter && `(${getPriorityLabel(priorityFilter)})`} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 shadow-lg border-border/50">
              <DropdownMenuItem onClick={() => setPriorityFilter('')}>All Priorities</DropdownMenuItem>
              <DropdownMenuSeparator />
              {priorityOptions.map(priority => (
                <DropdownMenuItem 
                  key={priority._id}
                  onClick={() => setPriorityFilter(priority.name)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: priority.color }}
                    ></div>
                    <span>{priority.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Due Date Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={dueDateFilter ? "default" : "outline"}
                className={`${dueDateFilter ? "bg-primary" : "border-default-300 text-default-500"}`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Due Date {dueDateFilter && `(${getDueDateLabel(dueDateFilter)})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setDueDateFilter('')}>All Due Dates</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDueDateFilter('today')}>Due Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDueDateFilter('thisWeek')}>Due This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDueDateFilter('thisMonth')}>Due This Month</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDueDateFilter('overdue')}>Overdue</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDueDateFilter('upcoming')}>Upcoming</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDueDateFilter('none')}>No Due Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assigned To Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={assignedToFilter ? "default" : "outline"}
                className={`${assignedToFilter ? "bg-primary" : "border-default-300 text-default-500"}`}
              >
                <User className="mr-2 h-4 w-4" />
                Assigned {assignedToFilter && assignedToFilter === 'unassigned' 
                  ? '(Unassigned)' 
                  : assignedToFilter && `(${getUserName(assignedToFilter)})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setAssignedToFilter('')}>All Tasks</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignedToFilter('unassigned')}>Unassigned</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Team Members</DropdownMenuLabel>
              {userOptions.map(user => (
                <DropdownMenuItem 
                  key={user._id}
                  onClick={() => setAssignedToFilter(user._id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="bg-muted hover:bg-muted/80 text-default-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear Filters ({activeFilterCount})
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="w-full md:w-fit md:flex-none mt-3 md:mt-0">
          <div className="relative">
            <Search className="w-4 h-4 text-default-400 absolute top-1/2 ltr:left-3 rtl:right-3 -translate-y-1/2" />
            <Input
              placeholder="Search Tasks"
              className="ltr:pl-9 rtl:pr-9 h-10 border-default-200 bg-card"
              value={table.getColumn("title")?.getFilterValue() || ""}
              onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
              }
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 w-full">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup, index) => (
                <TableRow 
                  key={`task-headerGroup-${index}`} 
                  className="bg-card border-b border-t border-border"
                >
                  {headerGroup.headers.map((header, index) => {
                    return (
                      <TableHead
                        key={`task-header-${index}`}
                        className="text-sm font-semibold text-default-800 border-r border-l border-border px-4 py-4 last:border-r last:border-border first:border-l first:border-border bg-muted/20 text-center"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={`task-bodyGroup-${index}`}
                    data-state={row.getIsSelected() && "selected"}
                    className={`cursor-pointer transition-colors border-b border-border ${index % 2 === 0 ? 'bg-card' : 'bg-muted/5'} hover:bg-primary/5`}
                    onClick={() => router.push(`/task/${row.original._id}`)}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell
                        key={`task-cell-${cellIndex}`}
                        className="text-sm border-r border-l border-border p-4 first:border-l last:border-r"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-border">
                  <TableCell
                    colSpan={columns.length}
                    className="h-[400px] text-center border-r border-l border-border"
                  >
                    <div className="flex flex-col items-center justify-center p-8">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Icon icon="heroicons:clipboard-document" className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium text-default-800">No tasks found</p>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
                        Try clearing your filters or creating a new task to get started with task management
                      </p>
                      <Button 
                        className="mt-6"
                        variant="outline"
                        onClick={clearAllFilters}
                      >
                        <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Enhanced Pagination */}
        <div className="flex items-center justify-between p-5 border-t border-border bg-card">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Icon icon="heroicons:document-text" className="w-4 h-4" />
            {table.getFilteredRowModel().rows.length} of {data.length} task{data.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center">
            <div className="text-sm text-muted-foreground mr-4">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center rounded-md border border-border bg-card">
            <Button
                variant="ghost"
                size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
                className="h-8 px-3 text-default-600 rounded-none border-r border-border"
            >
                <Icon icon="heroicons:chevron-left" className="w-4 h-4 mr-1" />
                Prev
            </Button>
                  <Button
                variant="ghost"
                size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
                className="h-8 px-3 text-default-600 rounded-none"
            >
                Next
                <Icon icon="heroicons:chevron-right" className="w-4 h-4 ml-1" />
            </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default TaskTable;