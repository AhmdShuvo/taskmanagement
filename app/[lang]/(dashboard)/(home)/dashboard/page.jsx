"use client";
import { useState, useEffect } from 'react';
import DashboardPageView from "./page-view";
import { getDictionary } from "@/app/dictionaries-client";
import useUserRoles from '@/hooks/useUserRoles';
import { Loader2 } from "lucide-react";

// Simple, centralized loading screen instead of skeleton
const DashboardLoader = () => {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

const Dashboard = ({ params: { lang } }) => {
  const [translations, setTranslations] = useState(null);
  const { isLoading: rolesLoading } = useUserRoles();
  const [isReady, setIsReady] = useState(false);
  
  // Preload translations immediately on component mount
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const trans = await getDictionary(lang);
        setTranslations(trans);
      } catch (error) {
        console.error("Error loading translations:", error);
        // Set empty translations to prevent indefinite loading
        setTranslations({});
      }
    };
    
    loadTranslations();
  }, [lang]);
  
  // Wait for both roles and translations to be loaded with minimal delay
  useEffect(() => {
    if (!rolesLoading && translations) {
      // Almost no delay - just enough for state changes to settle
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [rolesLoading, translations]);
  
  // Show single, simple loading screen
  // if (!isReady) {
  //   return <DashboardLoader />;
  // }
  
  return <DashboardPageView trans={translations} />;
};

export default Dashboard;
