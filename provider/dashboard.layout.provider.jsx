"use client";
import React, { useEffect } from "react";
import Header from "@/components/partials/header";
import Sidebar from "@/components/partials/sidebar";
import { cn } from "@/lib/utils";
import { useSidebar, useThemeStore } from "@/store";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Footer from "@/components/partials/footer";
import { useMediaQuery } from "@/hooks/use-media-query";
import ThemeCustomize from "@/components/partials/customizer/theme-customizer";
import MobileSidebar from "@/components/partials/sidebar/mobile-sidebar";
import HeaderSearch from "@/components/header-search";
import LayoutLoader from "@/components/layout-loader";
import useCurrentUser from "@/hooks/useCurrentUser"; // Import the useCurrentUser hook

const DashBoardLayoutProvider = ({ children, trans }) => {
  const { collapsed, sidebarType } = useSidebar();
  const [open, setOpen] = React.useState(false);
  const { layout } = useThemeStore();
  const location = usePathname();
  const isMobile = useMediaQuery("(min-width: 768px)");
  const { currentUser, isLoading, error } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Only run this logic after the user data has loaded
      if (error) {
        console.error("Error fetching current user:", error);
        // Handle error gracefully (e.g., display an error message)
        return; // Don't proceed with permission check if there's an error
      }

      if (!currentUser) {
        // If currentUser is null but there is no error, redirect to login.
        router.push("/");
        return;
      }

      const hasAssignedPermission = currentUser?.roles?.some(
        (role) =>
          role.permissions?.some((permission) => permission.name === "Assigned")
      );

      if (!hasAssignedPermission) {
        // If the user does not have the "Assigned" permission, redirect to the login page
        router.push("/");
      }
    }
  }, [currentUser, isLoading, error, router]);

  if (isLoading) {
    return <LayoutLoader />;
  }

  // Rest of your layout component remains the same
  return (
    <>
      <Header handleOpenSearch={() => setOpen(true)} trans={trans} />
      <Sidebar trans={trans} />

      <div
        className={cn("content-wrapper transition-all duration-150 ", {
          "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,
          "ltr:xl:ml-[272px] rtl:xl:mr-[272px]": !collapsed,
        })}
      >
        <div
          className={cn(
            "md:pt-6 pb-[37px] pt-[15px] md:px-6 px-4  page-min-height-semibox ",
            {}
          )}
        >
          <div className="semibox-content-wrapper ">
            <LayoutWrapper
              isMobile={isMobile}
              setOpen={setOpen}
              open={open}
              location={location}
            >
              {children}
            </LayoutWrapper>
          </div>
        </div>
      </div>
      <Footer trans={trans} />
      {/* <ThemeCustomize trans={trans} /> */}
    </>
  );
};

export default DashBoardLayoutProvider;

const LayoutWrapper = ({ children, isMobile, setOpen, open, location }) => {
  return (
    <>
      <motion.div
        key={location}
        initial="pageInitial"
        animate="pageAnimate"
        exit="pageExit"
        variants={{
          pageInitial: {
            opacity: 0,
            y: 50,
          },
          pageAnimate: {
            opacity: 1,
            y: 0,
          },
          pageExit: {
            opacity: 0,
            y: -50,
          },
        }}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.5,
        }}
      >
        <main>{children}</main>
      </motion.div>

      <MobileSidebar className="left-[300px]" />
      {/* <HeaderSearch open={open} setOpen={setOpen} /> */}
    </>
  );
};