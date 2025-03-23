"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ClockInStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <CardTitle className="text-sm text-muted-foreground mb-2">No Data</CardTitle>
            <p className="text-muted-foreground text-sm">Statistics not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-primary/10 border-border">
        <CardContent className="p-6">
          <CardTitle className="text-sm text-muted-foreground mb-2">Total Clock-ins</CardTitle>
          <p className="text-2xl font-bold">{stats.totalClockIns || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.dateRange?.start && stats.dateRange?.end
              ? `From ${stats.dateRange.start} to ${stats.dateRange.end}`
              : 'All time'}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-success/10 border-border">
        <CardContent className="p-6">
          <CardTitle className="text-sm text-muted-foreground mb-2">Active Users</CardTitle>
          <p className="text-2xl font-bold">{stats.currentlyActiveUsers || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Currently clocked in</p>
        </CardContent>
      </Card>
      
      <Card className="bg-secondary/10 border-border">
        <CardContent className="p-6">
          <CardTitle className="text-sm text-muted-foreground mb-2">Unique Users</CardTitle>
          <p className="text-2xl font-bold">{stats.uniqueUserCount || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.averagePerUser ? `${stats.averagePerUser} clock-ins per user` : 'No average data'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClockInStats; 