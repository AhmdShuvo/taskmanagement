"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import useUser from "../../../hooks/userUser"; // Import the useUser hook
import { useRouter } from 'next/navigation'; // Import useRouter

const ProfileInfo = () => {
  const { user, loading,image } = useUser(); // Use the useUser hook
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Make the POST request to your logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Clear localStorage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('image');
        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Handle error case (e.g., show a message to the user)
    }
  };

  if (loading) {
    return <p>Loading profile information...</p>;
  }

  if (!user) {
    return <p>Not logged in</p>;
  }

  // console.log(user,"user")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className=" cursor-pointer">
        <div className=" flex items-center  ">
           {/* Display user's image, if available */}
          {user?.email && (
            <Image
              src={image!=="null"?image:`/images/all-img/admin.png`} // Access image from user object
              alt={user?.name ?? ""} // Access name from user object
              width={36}
              height={36}
              className="rounded-full"
            />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-0" align="end">
        <DropdownMenuLabel className="flex gap-2 items-center mb-1 p-3">
          {/* Display user's image and name */}
          {user.name && (
            <Image
            src={image!=="null"?image:`/images/all-img/admin.png`} // Access image from user object
              alt={user.name ?? ""} // Access name from user object
              width={36}
              height={36}
              className="rounded-full"
            />
          )}
          <div>
            <div className="text-sm font-medium text-default-800 capitalize ">
              {user.name ?? "Mcc Callem"} {/* Access name from user object */}
            </div>
            {/* Removed the hardcoded "@uxuidesigner" and use user identifier whatever you want */}
            {/* Check the naming pattern of your token in the hook */}
            <div className="text-xs text-default-600 hover:text-primary">
              {user.email}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {[
            {
              name: "profile",
              icon: "heroicons:user",
              href: "#",
            },
            // {
            //   name: "Billing",
            //   icon: "heroicons:megaphone",
            //   href:"/dashboard"
            // },
            // {
            //   name: "Settings",
            //   icon: "heroicons:paper-airplane",
            //   href:"/dashboard"
            // },
            // {
            //   name: "Keyboard shortcuts",
            //   icon: "heroicons:language",
            //   href:"/dashboard"
            // },
          ].map((item, index) => (
            <Link
              href={item.href}
              key={`info-menu-${index}`}
              className="cursor-pointer"
            >
              <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
                <Icon icon={item.icon} className="w-4 h-4" />
                {item.name}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* <DropdownMenuGroup>
          <Link href="/dashboard" className="cursor-pointer">
            <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
              <Icon icon="heroicons:user-group" className="w-4 h-4" />
              team
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
              <Icon icon="heroicons:user-plus" className="w-4 h-4" />
              Invite user
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {[
                  {
                    name: "email",
                  },
                  {
                    name: "message",
                  },
                  {
                    name: "facebook",
                  },
                ].map((item, index) => (
                  <Link
                    href="/dashboard"
                    key={`message-sub-${index}`}
                    className="cursor-pointer"
                  >
                    <DropdownMenuItem className="text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
                      {item.name}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <Link href="/dashboard">
            <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
              <Icon icon="heroicons:variable" className="w-4 h-4" />
              Github
            </DropdownMenuItem>
          </Link>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
              <Icon icon="heroicons:phone" className="w-4 h-4" />
              Support
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {[
                  {
                    name: "portal",
                  },
                  {
                    name: "slack",
                  },
                  {
                    name: "whatsapp",
                  },
                ].map((item, index) => (
                  <Link href="/dashboard" key={`message-sub-${index}`}>
                    <DropdownMenuItem className="text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
                      {item.name}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup> */}
        <DropdownMenuSeparator className="mb-0 dark:bg-background" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize my-1 px-3 dark:hover:bg-background cursor-pointer"
        >
          <Icon icon="heroicons:power" className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileInfo;