"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, ChevronDown, Search, User } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { addUser } from "@/action/auth-action";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Checkbox } from "@/components/ui/checkbox";
import googleIcon from "@/public/images/auth/google.png";
import facebook from "@/public/images/auth/facebook.png";
import apple from "@/public/images/auth/apple.png";
import twitter from "@/public/images/auth/twitter.png";
import { SiteLogo } from "@/components/svg";
import { useMediaQuery } from "@/hooks/use-media-query";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Autocomplete, AutocompleteItem } from "@/components/ui/autocomplete";

const schema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Your email is invalid." }),
  password: z.string().min(4),
  seniorPerson: z.string().optional(), // Add seniorPerson field
});

const RegForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = useState("password");
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
  const togglePasswordType = () => {
    if (passwordType === "text") {
      setPasswordType("password");
    } else if (passwordType === "password") {
      setPasswordType("text");
    }
  };
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
  });
  const [isVisible, setIsVisible] = React.useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeout = useRef(null);

  const toggleVisibility = () => setIsVisible(!isVisible);

  // Fetch users for autocomplete with pagination
  const fetchUsers = useCallback(async (searchQuery = "", pageNum = 1, resetResults = false) => {
      try {
      setLoading(true);
      const response = await fetch(
        `/api/users/autocomplete?search=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=5`
      );

        if (response.ok) {
          const data = await response.json();
        if (resetResults) {
          setUsers(data.data);
        } else {
          setUsers(prev => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
        setPage(data.pagination.page);
      } else {
        console.error("Failed to fetch users:", response.status);
        toast.error("Failed to load users.");
        }
      } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial users when popover opens
  useEffect(() => {
    if (open) {
      // Reset users array when opening to ensure only 5 users are shown initially
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers("", 1, true);
    }
  }, [open, fetchUsers]);

  // Handle search query change with debounce
  const handleSearchChange = (value) => {
    setQuery(value);
    
    // Clear the previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Set a new timeout to delay the API call
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchUsers(value, 1, true);
    }, 300); // 300ms debounce
  };
  
  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Handle user selection
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setValue("seniorPerson", user.value);
    setOpen(false);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedUser(null);
    setValue("seniorPerson", undefined);
  };

  // Load more users when scrolling to bottom
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(query, page + 1, false);
    }
  };

  // Handle scroll event for infinite loading
  const handleScroll = (e) => {
    const element = e.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Check if scrolled to bottom (with a small threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (isAtBottom && hasMore && !loading) {
      handleLoadMore();
    }
  };

  const onSubmit = (data) => {
    startTransition(async () => {
      let response = await addUser(data);
      if (response?.status === "success") {
        toast.success(response?.message);
        reset();
        router.push("/");
      } else {
        toast.error(response?.message);
      }
    });
  };

  return (
    <div className="w-full">
      <Link href="/dashboard" className="inline-block">
        <SiteLogo className="h-10 w-10 2xl:w-14 2xl:h-14 text-primary" />
      </Link>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Hey, Hello 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Create account to start using Task Maneger
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 xl:mt-7">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2 font-medium text-default-600">
              Full Name{" "}
            </Label>
            <Input
              disabled={isPending}
              {...register("name")}
              type="text"
              id="name"
              className={cn("", {
                "border-destructive": errors.name,
              })}
              size={!isDesktop2xl ? "xl" : "lg"}
            />
            {errors.name && (
              <div className=" text-destructive mt-2 mb-4">
                {errors.name.message}
              </div>
            )}
          </div>
          <div>
            <Label
              htmlFor="email"
              className="mb-2 font-medium text-default-600"
            >
              Email{" "}
            </Label>
            <Input
              disabled={isPending}
              {...register("email")}
              type="email"
              id="email"
              className={cn("", {
                "border-destructive": errors.email,
              })}
              size={!isDesktop2xl ? "xl" : "lg"}
            />
            {errors.email && (
              <div className=" text-destructive mt-2 mb-4">
                {errors.email.message}
              </div>
            )}
          </div>
          <div>
            <Label
              htmlFor="password"
              className="mb-2 font-medium text-default-600"
            >
              Password{" "}
            </Label>
            <div className="relative">
              <Input
                type={passwordType}
                id="password"
                size={!isDesktop2xl ? "xl" : "lg"}
                disabled={isPending}
                {...register("password")}
                className={cn("", {
                  "border-destructive": errors.password,
                })}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
                onClick={togglePasswordType}
              >
                {passwordType === "password" ? (
                  <Icon
                    icon="heroicons:eye"
                    className="w-5 h-5 text-default-400"
                  />
                ) : (
                  <Icon
                    icon="heroicons:eye-slash"
                    className="w-5 h-5 text-default-400"
                  />
                )}
              </div>
            </div>
            {errors.password && (
              <div className=" text-destructive mt-2">
                {errors.password.message}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="seniorPerson" className="mb-2 font-medium text-default-600">
              Senior Person
            </Label>
            <Controller
              control={control}
              name="seniorPerson"
              render={({ field }) => (
                <Autocomplete
                  label="team members"
                  placeholder="Search team members..."
                  triggerPlaceholder="Select senior person..."
                  loading={loading}
                  selectedValue={selectedUser}
                  onSelect={handleSelectUser}
                  onSearch={handleSearchChange}
                  onScrollEnd={handleLoadMore}
                  hasMore={hasMore}
                  noItemsMessage="No matching users found"
                  useGridLayout={true}
                  gridCols={2}
                  renderEmpty={() => (
                    <div className="py-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <User className="h-6 w-6 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">No matching users found</p>
                    </div>
                  )}
                  renderLoading={() => (
                    <div className="py-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Searching for talents...</p>
                    </div>
                  )}
                  renderSelectedItem={(user) => (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-6 w-6 rounded-lg border shadow-sm">
                        <AvatarImage src={user.image} alt={user.label} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.label.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium leading-none mb-1">{user.label}</span>
                        {user.roles && (
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(user.roles) ? 
                              user.roles.map((role, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium leading-none">
                                  {role}
                                </span>
                              )) : 
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium leading-none">
                                {user.roles}
                              </span>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                >
                  {users.map((user) => (
                    <AutocompleteItem 
                      key={user.id} 
                      value={user}
                      isSelected={selectedUser && selectedUser.id === user.id}
                      className="rounded-lg p-2 cursor-pointer transition-all hover:scale-[1.02] data-[selected=true]:bg-primary/10 hover:bg-primary/5"
                      icon={
                        <Avatar className="h-8 w-8 rounded-lg border shadow-sm">
                          <AvatarImage src={user.image} alt={user.label} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.label.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      }
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none mb-1">{user.label}</span>
                        {user.roles && (
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(user.roles) ? 
                              user.roles.map((role, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium leading-none">
                                  {role}
                                </span>
                              )) : 
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium leading-none">
                                {user.roles}
                              </span>
                            }
                          </div>
                        )}
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              )}
            />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-1.5 mb-8">
          <Checkbox
            size="sm"
            className="border-default-300 mt-[1px]"
            id="terms"
          />
          <Label
            htmlFor="terms"
            className="text-sm text-default-600 cursor-pointer whitespace-nowrap"
          >
            You accept our Terms & Conditions
          </Label>
        </div>
        <Button
          className="w-full"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Registering..." : "Create an Account"}
        </Button>
      </form>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="rounded-full  border-default-300 hover:bg-transparent"
        >
          <Image src={googleIcon} alt="google icon" className="w-6 h-6" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="rounded-full border-default-300 hover:bg-transparent"
        >
          <Image src={facebook} alt="google icon" className="w-6 h-6" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="rounded-full  border-default-300 hover:bg-transparent"
        >
          <Image src={apple} alt="google icon" className="w-6 h-6" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="rounded-full  border-default-300 hover:bg-transparent"
        >
          <Image src={twitter} alt="google icon" className="w-6 h-6" />
        </Button>
      </div>
      <div className="mt-5 2xl:mt-8 text-center text-base text-default-600">
        Already Registered?{" "}
        <Link href="/auth/login" className="text-primary">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegForm;