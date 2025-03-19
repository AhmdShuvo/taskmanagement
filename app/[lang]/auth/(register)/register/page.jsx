"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUploader from "./imageUploader";
import { Card } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Your email is invalid." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  roles: z.array(z.string()).min(1, { message: "Please select at least one role." }), // Roles must be an array of strings (Role IDs)
  image: z.string().optional(), // Base64 string for the image
  seniorPerson: z.string().optional(),
});

const RegForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]); // Store available roles from the backend
    const [seniorPersonOptions, setSeniorPersonOptions] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      roles: [], // Initialize roles as an empty array
      seniorPerson: '',
    },
  });

  useEffect(() => {
    // Fetch available roles from the backend
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');  // Use the correct API endpoint
        const data = await response.json();
        if (response.ok && data.success) {
          setAvailableRoles(data.data);  // Store the roles
        } else {
          console.error("Error fetching roles:", data.error);
          toast.error(data.error || "Failed to load roles.");
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast.error("Failed to load roles.");
      }
    };
   const fetchSeniorPersons = async () => {
        try {
            const response = await fetch('/api/users');  // Use the correct API endpoint

            if (response.ok) {
                const data = await response.json();
                setSeniorPersonOptions(data.data.map(user => ({
                    value: user._id,
                    label: user.name,
                })));  // Store the senior person options
            } else {
                console.error("Error fetching senior persons:", response.status);
                toast.error("Failed to load senior persons.");
            }
        } catch (error) {
            console.error("Error fetching senior persons:", error);
            toast.error("Failed to load senior persons.");
        }
    };

    fetchRoles();
       fetchSeniorPersons();
  }, []);



  const onSubmit = (data) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            image: selectedImage, // Send the base64 image data
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("Registration Successful! Redirecting to login...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          router.push("/");
        } else {
          toast.error(result.message || "Registration Failed");
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error("An unexpected error occurred during registration.");
      }
    });
  };

  const handleImageUpload = (base64Image) => {
    setSelectedImage(base64Image);
  };

  return (
    <Card style={{ margin: "1rem", padding: "1rem" }} title="Form Grid">
      <div className="2xl:text-3xl text-2xl font-bold text-default-900 text-center">
        Create An Account
      </div>
      <div className="mt-2 text-default-600 text-center">
        Start creating the best account experience you’ve ever had.
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="mb-2 font-medium text-default-600">
            Name
          </Label>
          <Input
            disabled={isPending}
            {...register("name")}
            type="text"
            id="name"
            className={cn("w-full", {
              "border-destructive": errors.name,
            })}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name?.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="mb-2 font-medium text-default-600">
            Email
          </Label>
          <Input
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            className={cn("w-full", {
              "border-destructive": errors.email,
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email?.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="mb-2 font-medium text-default-600">
            Password
          </Label>
          <Input
            disabled={isPending}
            {...register("password")}
            type="password"
            id="password"
            className={cn("w-full", {
              "border-destructive": errors.password,
            })}
          />
          {errors.password && (
            <p className="text-sm text-destructive mt-1">{errors.password?.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="roles" className="mb-2 font-medium text-default-600">
            Roles
          </Label>
          <Controller
            control={control}
            name="roles"
            defaultValue={[]}  // Initialize as an empty array
            render={({ field }) => (
              <Select
                multiple
                onValueChange={(value) => {
                  // Ensure value is always an array
                  const selectedValues = Array.isArray(value) ? value : [value];
                  console.log("Selected Role IDs:", selectedValues); // Log the selected values
                  field.onChange(selectedValues);
                }}
                defaultValue={field.value}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select roles" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.roles && (
            <p className="text-sm text-destructive mt-1">{errors.roles?.message}</p>
          )}
        </div>
 <div>
                    <Label htmlFor="seniorPerson" className="mb-2 font-medium text-default-600">Senior Person</Label>
                    <Controller
                        control={control}
                        name="seniorPerson"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Senior Person" />
                                </SelectTrigger>
                                <SelectContent>
                                    {seniorPersonOptions.map((person) => (
                                        <SelectItem key={person.value} value={person.value}>
                                            {person.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

        <div className="md:col-span-2">
          <Label className="mb-2 font-medium text-default-600">
            Profile Image
          </Label>
          <ImageUploader onImageUpload={handleImageUpload} />
        </div>


        <div className="md:col-span-2">
          <Button
            disabled={isPending}
            className="w-full mt-6"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RegForm;