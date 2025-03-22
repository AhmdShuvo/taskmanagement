"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/date-picker-with-range";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle } from "lucide-react";
import TaskTable from '../../(apps)/task/components/task-table';

const DashboardPageView = ({ trans }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [taskData, setTaskData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    openTasks: 0,
    blockedTasks: 0,
    tasksByPriority: [],
    recentTasks: [],
    taskCompletionTrend: [],
    tasksByAssignee: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication required. Please sign in to view dashboard data.");
        setLoading(false);
        return;
      }
      
      // Construct URL with date range parameters if selected
      let url = '/api/dashboard/tasks-summary';
      const params = new URLSearchParams();
      
      if (dateRange.from && dateRange.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
        url = `${url}?${params.toString()}`;
      }
      
      // Fetch tasks summary
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      setTaskData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-success text-success-foreground',
      'in progress': 'bg-info text-info-foreground',
      open: 'bg-warning text-warning-foreground',
      blocked: 'bg-destructive text-destructive-foreground'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-destructive',
      medium: 'text-warning',
      low: 'text-success'
    };
    return colors[priority] || 'text-muted-foreground';
  };

  const calculateCompletionRate = () => {
    if (taskData.totalTasks === 0) return 0;
    return Math.round((taskData.completedTasks / taskData.totalTasks) * 100);
  };

  const renderSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-muted rounded w-1/2 mb-8"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="h-80 bg-muted rounded lg:col-span-2"></div>
        <div className="h-80 bg-muted rounded"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-muted rounded"></div>
        <div className="h-80 bg-muted rounded lg:col-span-2"></div>
      </div>
    </div>
  );

  // if (loading) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="flex items-center flex-wrap justify-between gap-4">
  //         <div className="text-2xl font-bold text-default-900">
  //           Task Dashboard
  //         </div>
  //         <div className="flex items-center gap-3">
  //           <DatePickerWithRange />
  //           <Skeleton className="h-10 w-32" />
  //         </div>
  //       </div>
        
  //       {renderSkeleton()}
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center flex-wrap justify-between gap-4">
          <div className="text-2xl font-bold text-default-900">
            Task Dashboard
          </div>
          <div className="flex items-center gap-3">
            <DatePickerWithRange onChange={handleDateRangeChange} />
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="heroicons:face-frown" className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Unable to load dashboard data</h3>
            <p className="text-muted-foreground mb-6">We couldn't retrieve the latest task information from the database.</p>
            <Button onClick={fetchDashboardData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="text-2xl font-bold text-default-900">
          Task Dashboard
        </div>
        <div className="flex items-center gap-3">
          <DatePickerWithRange onChange={handleDateRangeChange} />
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            onClick={() => router.push('/task')}
          >
            <Icon icon="heroicons:clipboard-document-list" className="w-5 h-5" />
            <span>View All Tasks</span>
          </Button>
        </div>
      </div>

      {/* Task Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <h3 className="text-2xl font-bold mt-1">{taskData.totalTasks}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="heroicons:clipboard-document-list" className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={100} className="h-2 bg-primary/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <h3 className="text-2xl font-bold mt-1">{taskData.completedTasks}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Icon icon="heroicons:check-circle" className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={calculateCompletionRate()} className="h-2 bg-muted" />
              <p className="text-xs text-muted-foreground mt-2">{calculateCompletionRate()}% completion rate</p>
        </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <h3 className="text-2xl font-bold mt-1">{taskData.inProgressTasks}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                <Icon icon="heroicons:clock" className="h-6 w-6 text-info" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(taskData.inProgressTasks / taskData.totalTasks) * 100} 
                className="h-2 bg-muted" 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold mt-1">{taskData.openTasks + taskData.blockedTasks}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Icon icon="heroicons:exclamation-circle" className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Progress 
                    value={(taskData.openTasks / taskData.totalTasks) * 100} 
                    className="h-2 bg-muted" 
                  />
      </div>
                <span className="text-xs whitespace-nowrap">{taskData.openTasks} Open</span>
              </div>
              <div className="flex gap-2 items-center mt-2">
                <div className="flex-1">
                  <Progress 
                    value={(taskData.blockedTasks / taskData.totalTasks) * 100} 
                    className="h-2 bg-muted" 
                  />
                </div>
                <span className="text-xs whitespace-nowrap">{taskData.blockedTasks} Blocked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Tasks Overview</CardTitle>
              <CardDescription>All your tasks in one place</CardDescription>
            </div>
            <Button 
              variant="outline" 
              className="gap-1" 
              onClick={() => router.push('/task')}
            >
              <Icon icon="heroicons:document-text" className="w-4 h-4" />
              <span>View All Tasks</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Skeleton className="h-[400px] w-full rounded-md" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <TaskTable 
              data={taskData.recentTasks || []} 
              openSheet={() => router.push('/task')}
            />
          )}
        </CardContent>
      </Card>
      {/* Charts & Data Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Task Activity</CardTitle>
            <CardDescription>Weekly task creation vs completion</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {taskData.taskCompletionTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={taskData.taskCompletionTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="completed" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Icon icon="heroicons:chart-bar" className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No task activity data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {taskData.tasksByPriority?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskData.tasksByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskData.tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Icon icon="heroicons:chart-pie" className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No priority data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Team Performance</CardTitle>
            <CardDescription>Tasks assigned vs completed by team member</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {taskData.tasksByAssignee?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={taskData.tasksByAssignee}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Assigned" fill="#8884d8" />
                  <Bar dataKey="completedCount" name="Completed" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Icon icon="heroicons:user-group" className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No team performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Recent Tasks</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => router.push('/task')}
              >
                View All
                <Icon icon="heroicons:arrow-right" className="ml-1 h-4 w-4" />
              </Button>
        </div>
            <CardDescription>Recently added or updated tasks</CardDescription>
            </CardHeader>
          <CardContent className="p-6">
            {taskData.recentTasks?.length > 0 ? (
              <div className="space-y-4">
                {taskData.recentTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 bg-muted/40 rounded-md border border-border/50 hover:bg-muted/80 transition-colors cursor-pointer"
                    onClick={() => router.push(`/task/${task._id || task.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-10 rounded-sm ${getStatusColor(task.status).split(' ')[0]}`}></div>
                      <div>
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <Icon icon="heroicons:document-text" className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No recent tasks found</p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/task')}
                  className="flex items-center gap-2"
                >
                  <Icon icon="heroicons:plus" className="w-4 h-4" />
                  <span>Create New Task</span>
                </Button>
              </div>
            )}
            </CardContent>
          </Card>
      </div>

      {/* Task Table Section */}
      
    </div>
  );
};

export default DashboardPageView;
