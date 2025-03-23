"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from '@/config/axios.config';

const ClockInSection = ({ trans }) => {
  const [clockInData, setClockInData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClockInData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/clock-in/summary');
        
        if (response.data && response.data.success) {
          setClockInData(response.data);
        } else {
          setError('Failed to load clock-in data');
        }
      } catch (err) {
        console.error('Error fetching clock-in data:', err);
        setError('Error loading clock-in information');
      } finally {
        setLoading(false);
      }
    };

    fetchClockInData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Clock-in Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-60 bg-muted rounded mb-6"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Clock-in Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive mb-4">{error}</div>
          <Button variant="outline" onClick={() => fetchClockInData()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Clock-in Information</CardTitle>
      </CardHeader>
      <CardContent>
        {clockInData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-slate-700 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Total Clock-ins</h3>
                <p className="text-2xl font-bold">{clockInData.summary.totalClockIns}</p>
                <p className="text-sm text-muted-foreground">
                  From {clockInData.summary.dateRange.start} to {clockInData.summary.dateRange.end}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-slate-700 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
                <p className="text-2xl font-bold">{clockInData.summary.currentlyActiveUsers}</p>
                <p className="text-sm text-muted-foreground">Currently clocked in</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-slate-700 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Unique Users</h3>
                <p className="text-2xl font-bold">{clockInData.summary.uniqueUserCount}</p>
                <p className="text-sm text-muted-foreground">
                  {clockInData.summary.averagePerUser} clock-ins per user
                </p>
              </div>
            </div>

            {clockInData.timeSeries && clockInData.timeSeries.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold mb-4">Clock-in Activity</h3>
                <div className="space-y-3">
                  {clockInData.timeSeries.slice(-7).map((item) => (
                    <div key={item.period} className="flex items-center">
                      <span className="w-24 text-sm text-muted-foreground">{item.period}</span>
                      <div className="flex-1">
                        <Progress 
                          value={
                            Math.min(
                              100, 
                              (item.count / Math.max(...clockInData.timeSeries.map(i => i.count))) * 100
                            )
                          } 
                          className="h-2" 
                        />
                      </div>
                      <span className="ml-2 w-10 text-sm font-medium text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clockInData.topLocations && clockInData.topLocations.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-4">Top Clock-in Locations</h3>
                <div className="space-y-3">
                  {clockInData.topLocations.slice(0, 5).map((location, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {location.location}
                          </p>
                        </div>
                      </div>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                        {location.count} clock-ins
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No clock-in data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClockInSection; 