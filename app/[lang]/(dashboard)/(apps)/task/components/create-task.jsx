"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CalendarDays, Loader2 } from "lucide-react";
import Select from "react-select";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useUser from "@/hooks/userUser";
import axios from 'axios'; // Import axios
import { format } from 'date-fns';

const statuses = [
  { value: "open", label: "Open" },
  { value: "in progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
const priorities = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const styles = {
  option: (provided) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const formSchema = z.object({
  title: z.string().min(2, { message: "Task title must be at least 2 characters." }),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.date().nullable().optional(), // Mark as nullable and optional
  assignedTo: z.array(z.string()).optional(),
});

const CreateTask = ({ open, onClose }) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]); //To recive users
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      priority: "medium",
      status: "open",
      assignedTo: [],
      dueDate: null,
    },
  });

    const [openDate, setOPenDate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null)
    const toggleOpenDate = useCallback(() => setOPenDate((prev) => !prev), []);

   const watchDate = watch('dueDate') ? new Date(watch('dueDate')) : null;
   const formattedDate = selectedDate ? format(selectedDate, "PPP") : "";
  useEffect(() => {
          const fetchUsers = async () => {
              try {
                const response = await axios.get('/api/users');
                console.log(response,"api erspose  user");
                
                if (response.status === 200) {
                  console.log(response.data.data,"response.data")
                    setUserOptions(response.data?.data?.map(user => ({
                        value: user._id,
                        label: user.name,
                    })));
                } else {
                    toast.error("Failed to load users from API");
                }
              } catch (error) {
                  console.error("Error fetching users:", error);
                  toast.error("Error fetching users from server.");
              }
          };

        fetchUsers();
        console.log(userOptions, " userlist")
        // I added a condition to test in loop time, and can see you the data
    },[])


  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/tasks', {
            ...data,
            dueDate: data.dueDate ? data.dueDate.toISOString() : null,
            assignedTo: data.assignedTo || [],
            createdBy: user?.id, // Use optional chaining to avoid errors
        });

      if (response.status === 201) {
        toast.success("Task created successfully!");
        onClose();
        reset();
      } else {
        toast.error(response.data.message || "Task creation failed.");
      }
    } catch (error) {
      console.error("Task creation error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

   return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="pt-5">
        <SheetHeader className="flex-row items-center justify-between mb-4">
          <span className="text-lg font-semibold text-default-900">Create Task</span>
        </SheetHeader>
        <form className="h-full flex flex-col justify-between" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="mb-1.5 text-default-600">Board Title</Label>
              <Input id="title" placeholder="Board Title" {...register("title")} />
                {errors.title && (
                    <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
                )}
            </div>
            <div>
              <Label htmlFor="assignedTo" className="mb-1.5 text-default-600">Assigned To</Label>
              <Controller
                control={control}
                name="assignedTo"
                render={({ field }) => (
                  <Select
                    className="react-select"
                    classNamePrefix="select"
                    options={userOptions}
                    styles={styles}
                    isMulti
                    value={userOptions.filter(option => field.value?.includes(option.value))}
                    onChange={value => field.onChange(value?.map(v => v.value) || [])} // Handle multiple select values
                  />
                )}
              />
            </div>

            <div>
              <Label
                htmlFor="status"
                className="mb-1.5 text-default-600">
                Status
              </Label>
              <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      className="react-select"
                      classNamePrefix="select"
                      options={statuses}
                      styles={styles}
                      value={statuses.find(option => option.value === field.value)}
                      onChange={value => field.onChange(value?.value || '')} // Handle single select value

                    />
                  )}
              />
            </div>
            <div>
              <Label
                htmlFor="priority"
                className="mb-1.5 text-default-600">
                Priority
              </Label>
              <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      className="react-select"
                      classNamePrefix="select"
                      options={priorities}
                      styles={styles}
                      value={priorities.find(option => option.value === field.value)}
                      onChange={value => field.onChange(value?.value || '')} // Handle single select value
                    />
                  )}
              />
            </div>

            <div>
              <Label
                htmlFor="dueDate"
                className="mb-1.5 text-default-600">
                Due Date
              </Label>
                  <div className="relative">
                      <Controller
                          control={control}
                          name="dueDate"
                          defaultValue={null}
                          render={({ field }) => (
                              <>
                                  <Input
                                      placeholder="Select Date"
                                      value={formattedDate}

                                  />
                                  <CalendarDays
                                      className="w-4 h-4 text-default-400 absolute top-1/2 right-2 -translate-y-1/2"
                                      onClick={toggleOpenDate}
                                  />
                                  <Sheet
                                     open={openDate}
                                    onOpenChange={toggleOpenDate}
                                    >
                                    <SheetContent>
                                      <Calendar
                                          mode="single"
                                          selected={selectedDate}
                                          onSelect={(date) => {
                                            setValue('dueDate', date)
                                            setSelectedDate(date);
                                            toggleOpenDate()
                                            }}

                                          disabled={isLoading}
                                          className="border border-default-200 rounded-md shadow-sm"
                                      />
                                      </SheetContent>
                                  </Sheet>
                              </>
                          )}
                      />


                  </div>
            </div>
          </div>
          <SheetFooter className="pb-10">
            <SheetClose>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateTask;