// components/partials/header.js
"use client";

import React, { useState, useEffect, useCallback } from "react"; // Import useState and useEffect
import { cn } from "@/lib/utils";
import ThemeButton from "./theme-button";
import { useSidebar, useThemeStore } from "@/store";
import ProfileInfo from "./profile-info";
import VerticalHeader from "./vertical-header";
import HorizontalHeader from "./horizontal-header";
import Inbox from "./inbox";
import HorizontalMenu from "./horizontal-menu";
import NotificationMessage from "./notification-message";
import Language from "./language";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileMenuHandler from "./mobile-menu-handler";
import ClassicHeader from "./layout/classic-header";
import FullScreen from "./full-screen";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import useUser from "@/hooks/userUser";
import useCurrentUser from "@/hooks/useCurrentUser";
import useUserRoles from "@/hooks/useUserRoles";

const NavTools = ({ isDesktop, isMobile, sidebarType, handleClockIn, handleClockOut, clockedIn }) => { // Add handleClockIn prop
  const { currentUser,  error } = useCurrentUser();
  const { isEngineer, canManageTasks, isLoading: rolesLoading } = useUserRoles();
  return (
    <div className="nav-tools flex items-center  gap-2">
      {/* {isDesktop && <Language />} */}
      {isDesktop && <FullScreen />}

      <ThemeButton />
      {/* <Inbox /> */}
      {/* <NotificationMessage /> */}
      {/* Conditionally render the clock-in button based on the clockedIn state */}
      {isEngineer() && (
  currentUser?.clockedIn || clockedIn ? (
    <Button onClick={handleClockOut}>Clock Out</Button>
  ) : (
    <Button onClick={handleClockIn}>Clock In</Button>
  )
)}


      <div className="ltr:pl-2 rtl:pr-2">
        <ProfileInfo />
      </div>
      {!isDesktop && sidebarType !== "module" && <MobileMenuHandler />}
    </div>
  );
};

const Header = ({ handleOpenSearch, trans }) => {
  const { collapsed, sidebarType, setCollapsed, subMenu, setSidebarType } =
    useSidebar();
    const { currentUser,  error } = useCurrentUser();
  const { layout, navbarType, setLayout } = useThemeStore();
  const { user, image, loading, clockedIn, setClockedIn } = useUser(); // Get clockedIn and setClockedIn from the hook

  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isMobile = useMediaQuery("(min-width: 768px)");

  // Component state
  const [isLoading, setIsLoading] = useState(false);
    // Track geolocation permission
  useEffect(() => {
  //  console.log(user)
  }, [user])

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding to get the address
          const address = await getAddress(latitude, longitude);

          // Make API call to clock-in endpoint
          const token = localStorage.getItem('token');
          const response = await fetch('/api/clock-in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              latitude,
              longitude,
              address,
            }),
          });

          if (response.ok) {
            toast.success("Clock-in successful!");
            setClockedIn(true)
          } else {
            const errorData = await response.json();
            toast.error(errorData.message || "Clock-in failed.");
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Error getting location.");
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Clock-in error:", error);
      toast.error("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

    const handleClockOut = async () => {
        setIsLoading(true);
        try {
            // Make API call to clock-out endpoint
            const token = localStorage.getItem('token');
            const response = await fetch('/api/clock-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Clock-out successful!");
                setClockedIn(false);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Clock-out failed.");
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Clock-out error:", error);
            toast.error("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

  const getAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name || "Address not found";
    } catch (error) {
      console.error("Error getting address:", error);
      return "Address not found";
    }
  };

  // set header style to classic if isDesktop
  React.useEffect(() => {
    if (!isDesktop && layout === "horizontal") {
      setSidebarType("classic");
    }
  }, [isDesktop]);

  // if horizontal layout
  if (layout === "horizontal" && navbarType !== "hidden") {
    return (
      <ClassicHeader
        className={cn(" ", {
          "sticky top-0 z-50": navbarType === "sticky",
        })}
      >
        <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 border-b">
          <div className="flex justify-between items-center h-full">
            <HorizontalHeader handleOpenSearch={handleOpenSearch} />
            <NavTools
              isDesktop={isDesktop}
              isMobile={isMobile}
              sidebarType={sidebarType}
              handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
              clockedIn={clockedIn}
              setClockedIn={setClockedIn}
            />
          </div>
        </div>
        {isDesktop && (
          <div className=" bg-card bg-card/90 backdrop-blur-lg  w-full px-6  shadow-md">
            <HorizontalMenu trans={trans} />
          </div>
        )}
      </ClassicHeader>
    );
  }
  if (layout === "semibox" && navbarType !== "hidden") {
    return (
      <ClassicHeader
        className={cn("has-sticky-header rounded-md   ", {
          "ltr:xl:ml-[72px] rtl:xl:mr-[72px] ": collapsed,
          "ltr:xl:ml-[272px] rtl:xl:mr-[272px] ": !collapsed,

          "sticky top-6": navbarType === "sticky",
        })}
      >
        <div className="xl:mx-20 mx-4">
          <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 rounded-md my-6 shadow-md border-b">
            <div className="flex justify-between items-center h-full">
              <VerticalHeader
                sidebarType={sidebarType}
                handleOpenSearch={handleOpenSearch}
              />
              <NavTools
                isDesktop={isDesktop}
                isMobile={isMobile}
                sidebarType={sidebarType}
                handleClockIn={handleClockIn}
                handleClockOut={handleClockOut}
                clockedIn={clockedIn}
                setClockedIn={setClockedIn}
              />
            </div>
          </div>
        </div>
      </ClassicHeader>
    );
  }
  if (
    sidebarType !== "module" &&
    navbarType !== "floating" &&
    navbarType !== "hidden"
  ) {
    return (
      <ClassicHeader
        className={cn("", {
          "ltr:xl:ml-[248px] rtl:xl:mr-[248px]": !collapsed,
          "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,
          "sticky top-0": navbarType === "sticky",
        })}
      >
        <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 border-b">
          <div className="flex justify-between items-center h-full">
            <VerticalHeader
              sidebarType={sidebarType}
              handleOpenSearch={handleOpenSearch}
            />
            <NavTools
              isDesktop={isDesktop}
              isMobile={isMobile}
              sidebarType={sidebarType}
              handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
              clockedIn={clockedIn}
              setClockedIn={setClockedIn}
            />
          </div>
        </div>
      </ClassicHeader>
    );
  }
  if (navbarType === "hidden") {
    return null;
  }
  if (navbarType === "floating") {
    return (
      <ClassicHeader
        className={cn("  has-sticky-header rounded-md sticky top-6  px-6  ", {
          "ltr:ml-[72px] rtl:mr-[72px]": collapsed,
          "ltr:xl:ml-[300px] rtl:xl:mr-[300px]  ":
            !collapsed && sidebarType === "module",
          "ltr:xl:ml-[248px] rtl:xl:mr-[248px] ":
            !collapsed && sidebarType !== "module",
        })}
      >
        <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 rounded-md my-6 shadow-md border-b">
          <div className="flex justify-between items-center h-full">
            <VerticalHeader
              sidebarType={sidebarType}
              handleOpenSearch={handleOpenSearch}
            />
            <NavTools
              isDesktop={isDesktop}
              isMobile={isMobile}
              sidebarType={sidebarType}
              handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
              clockedIn={clockedIn}
              setClockedIn={setClockedIn}
            />
          </div>
        </div>
      </ClassicHeader>
    );
  }

  return (
    <ClassicHeader
      className={cn("", {
        "ltr:xl:ml-[300px] rtl:xl:mr-[300px]": !collapsed,
        "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,

        "sticky top-0": navbarType === "sticky",
      })}
    >
      <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 border-b">
        <div className="flex justify-between items-center h-full">
          <VerticalHeader
            sidebarType={sidebarType}
            handleOpenSearch={handleOpenSearch}
          />
          <NavTools
            isDesktop={isDesktop}
            isMobile={isMobile}
            sidebarType={sidebarType}
            handleClockIn={handleClockIn}
            handleClockOut={handleClockOut}
            clockedIn={clockedIn}
            setClockedIn={setClockedIn}
          />
        </div>
      </div>
    </ClassicHeader>
  );
};

export default Header;