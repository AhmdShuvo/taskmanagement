"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const ClockInChart = ({ timeSeries, loading }) => {
  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Clock-in Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-60 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!timeSeries || timeSeries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Clock-in Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-60">
            <p className="text-muted-foreground text-center">No activity data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format data for the chart
  const chartData = timeSeries.slice(-7).map(item => ({
    date: item.period,
    'Clock-ins': item.count,
    'Unique Users': item.uniqueUserCount || 0
  }));
  
  // Bar chart view for larger screens
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Clock-ins" fill="#8884d8" />
        <Bar dataKey="Unique Users" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
  
  // Simple progress bar view as fallback
  const renderProgressBars = () => (
    <div className="space-y-3">
      {chartData.map((item) => (
        <div key={item.date} className="flex items-center">
          <span className="w-24 text-sm text-muted-foreground">{item.date}</span>
          <div className="flex-1">
            <Progress 
              value={
                Math.min(
                  100, 
                  (item['Clock-ins'] / Math.max(...chartData.map(i => i['Clock-ins']))) * 100
                )
              } 
              className="h-2" 
            />
          </div>
          <span className="ml-2 w-10 text-sm font-medium text-right">{item['Clock-ins']}</span>
        </div>
      ))}
    </div>
  );
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Clock-in Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="hidden md:block">
          {renderBarChart()}
        </div>
        <div className="block md:hidden">
          {renderProgressBars()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClockInChart; 