// components/location-checker.jsx
"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const LocationChecker = ({ onLocationAllowed }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkGeolocation = async () => {
      setChecking(true);
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser. This app requires it.");
        onLocationAllowed(false); // Pass geolocationAllowed status to parent
        setChecking(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          toast.success("Geolocation is allowed in this browser.");
          onLocationAllowed(true); // Pass geolocationAllowed status to parent
          setChecking(false);
        },
        (error) => {
          console.warn("Geolocation is NOT allowed:", error);
          onLocationAllowed(false); // Pass geolocationAllowed status to parent
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Geolocation permission has been denied. This app requires it.");
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("Location information is unavailable. This app requires it.");
              break;
            case error.TIMEOUT:
              toast.error("Geolocation request timed out. This app requires it.");
              break;
            default:
              toast.error("An unknown error occurred. This app requires geolocation.");
          }
          setChecking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };
    checkGeolocation();
  }, [onLocationAllowed]);

  return (
    <div>
      {checking && <p>Checking Location...</p>}
    </div>
  );
};

export default LocationChecker;