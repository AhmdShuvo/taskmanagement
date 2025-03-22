"use client"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from 'date-fns';
import toast from "react-hot-toast";
import useCurrentUser from "@/hooks/useCurrentUser";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const statuses = [
  { value: "open", label: "Open", color: "#FFC107" },
  { value: "in progress", label: "In Progress", color: "#3B82F6" },
  { value: "completed", label: "Completed", color: "#10B981" },
];

const priorities = [
  { value: "high", label: "High", color: "#EF4444" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "low", label: "Low", color: "#10B981" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--background)',
    borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
    boxShadow: state.isFocused ? '0 0 0 1px var(--primary)' : null,
    '&:hover': {
      borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-hover)',
    },
    padding: '2px',
    borderRadius: '0.375rem',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'var(--primary)'
      : state.isFocused
      ? 'var(--accent)'
      : 'var(--background)',
    color: state.isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'var(--accent)',
    borderRadius: '0.25rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'var(--foreground)',
    fontSize: '0.75rem',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'var(--foreground)',
    '&:hover': {
      backgroundColor: 'var(--destructive)',
      color: 'white',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
    zIndex: 100,
    position: 'absolute',
  }),
  menuList: (provided) => ({
    ...provided,
    backgroundColor: 'var(--background)',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--muted-foreground)',
    fontSize: '0.875rem',
  }),
};

// Format options with colored indicators
const formatOptionLabel = ({ value, label, color }) => (
  <div className="flex items-center gap-2">
    <div
      style={{ backgroundColor: color }}
      className="w-3 h-3 rounded-full"
    ></div>
    <span>{label}</span>
  </div>
);

const formSchema = z.object({
  title: z.string().min(2, { message: "Task title must be at least 2 characters." }),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  assignedTo: z.array(z.string()).optional(),
});

const EditTask = ({ open, onClose, task, onTaskUpdated, canEditAssignments = false }) => {
  const { currentUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "open",
      assignedTo: [],
      dueDate: null,
    },
  });

  const selectedDate = watch('dueDate');
  const formattedDate = selectedDate ? format(selectedDate, "PPP") : "";

  // Load users, statuses, and priorities
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        
        // Fetch filtered users based on role and hierarchy
        const usersResponse = await fetch('/api/users/filtered', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUserOptions(usersData.data?.map(user => ({
            value: user._id,
            label: user.name || user.email,
            avatar: user.image
          })) || []);
        } else {
          toast.error("Failed to load users");
        }

        // Fetch statuses
        const statusesResponse = await fetch('/api/task-statuses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statusesResponse.ok) {
          const statusesData = await statusesResponse.json();
          setStatusOptions(statusesData.map(status => ({
            value: status.name,
            label: status.label,
            color: status.color
          })));
        } else {
          // Fallback to default statuses if API fails
          setStatusOptions(statuses);
        }

        // Fetch priorities
        const prioritiesResponse = await fetch('/api/task-priorities', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (prioritiesResponse.ok) {
          const prioritiesData = await prioritiesResponse.json();
          setPriorityOptions(prioritiesData.map(priority => ({
            value: priority.name,
            label: priority.label,
            color: priority.color
          })));
        } else {
          // Fallback to default priorities if API fails
          setPriorityOptions(priorities);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to default options
        setStatusOptions(statuses);
        setPriorityOptions(priorities);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Set form values when task changes
  useEffect(() => {
    if (task && open) {
      // Format the due date properly if it exists
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      
      // Set the form values
      reset({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        status: task.status || "open",
        assignedTo: task.assignedTo?.map(user => user._id) || [],
        dueDate: dueDate,
      });
    }
  }, [task, open, reset]);

  const onSubmit = async (data) => {
    if (!task?._id) {
      toast.error("No task to update");
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Task updated successfully!");
        onClose();
        if (onTaskUpdated) {
          onTaskUpdated(result);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Task update error:", error);
      toast.error("An error occurred while updating the task");
    } finally {
      setIsLoading(false);
    }
  };

  // Format user options with avatars
  const formatUserOptionLabel = ({ label, avatar }) => (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img src={avatar} alt={label} className="w-5 h-5 rounded-full" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
          {label.charAt(0)}
        </div>
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-5">
          <div className="text-xl font-semibold">Edit Task</div>
        </SheetHeader>
        
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="title" 
                placeholder="Enter task title" 
                className="mt-1.5"
                {...register("title")} 
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the task..."
                className="mt-1.5 min-h-24 resize-none"
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="priority" className="text-sm font-medium">
                Priority
              </Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      inputId="priority"
                      options={priorityOptions}
                      formatOptionLabel={formatOptionLabel}
                      styles={customSelectStyles}
                      className="react-select-container mt-1.5"
                      classNamePrefix="react-select"
                      value={priorityOptions.find(option => option.value === field.value)}
                      onChange={option => field.onChange(option.value)}
                      isSearchable={false}
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
              <Select
                      inputId="status"
                      options={statusOptions}
                      formatOptionLabel={formatOptionLabel}
                      styles={customSelectStyles}
                      className="react-select-container mt-1.5"
                      classNamePrefix="react-select"
                      value={statusOptions.find(option => option.value === field.value)}
                      onChange={option => field.onChange(option.value)}
                      isSearchable={false}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">
                Due Date
              </Label>
              <div className="relative mt-1.5">
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formattedDate || <span className="text-muted-foreground">Select a date</span>}
                          {selectedDate && (
                            <X
                              className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setValue('dueDate', null);
                              }}
                            />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePickerOpen(false);
                          }}
                          initialFocus
                          disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="assignedTo" className="text-sm font-medium">
                Assign To
                {!canEditAssignments && (
                  <span className="text-xs ml-2 text-muted-foreground">(Only Project Leads can change assignments)</span>
                )}
              </Label>
              <Controller
                control={control}
                name="assignedTo"
                render={({ field }) => (
                  <Select
                    inputId="assignedTo"
                    options={userOptions}
                    formatOptionLabel={formatUserOptionLabel}
                    styles={customSelectStyles}
                    className="react-select-container mt-1.5"
                    classNamePrefix="react-select"
                    isMulti
                    placeholder="Select team members..."
                    value={userOptions.filter(option => field.value?.includes(option.value))}
                    onChange={selected => field.onChange(selected?.map(option => option.value) || [])}
                    noOptionsMessage={() => "No users available"}
                    isDisabled={!canEditAssignments}
                  />
                )}
              />
            </div>
          </div>

          <SheetFooter className="pt-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Task"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditTask;

