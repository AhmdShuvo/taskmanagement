"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, MapPin, RefreshCw, Search, User } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from '@/config/axios.config';

const ClockInDetails = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clockInData, setClockInData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)), // Default to last 7 days
    to: new Date()
  });
  const [currentTab, setCurrentTab] = useState("records");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchClockInData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString().split('T')[0]);
      }
      
      // Add search term if present
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Add pagination parameters
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      console.log("Fetching data with params:", params.toString());
      
      const response = await api.get(`/clock-in/report?${params.toString()}`);
      
      if (response.data && response.data.success) {
        setClockInData(response.data);
        setCurrentPage(response.data.pagination.currentPage);
        console.log("Loaded clock-in details:", response.data);
      } else {
        setError("Failed to load clock-in data");
      }
    } catch (err) {
      console.error("Error fetching clock-in data:", err);
      setError(err.message || "Error loading clock-in information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClockInData(currentPage);
  }, [dateRange, currentPage, itemsPerPage]);

  const handleDateSelect = (date) => {
    if (!dateRange.from || dateRange.to) {
      // If no start date or both dates are selected, start a new range
      setDateRange({ from: date, to: null });
    } else {
      // If we have a start date but no end date
      const from = dateRange.from;
      const to = date;
      
      // Ensure the end date is not before the start date
      if (date < from) {
        setDateRange({ from: date, to: from });
      } else {
        setDateRange({ from, to });
      }
    }
  };

  const filteredClockIns = clockInData?.clockIns.filter(record => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.user?.name?.toLowerCase().includes(query) ||
      record.user?.email?.toLowerCase().includes(query) ||
      record.address?.toLowerCase().includes(query)
    );
  });

  const renderLocationStats = () => {
    if (!clockInData?.statistics?.byLocation?.length) {
      return <p className="text-muted-foreground py-4 text-center">No location data available</p>;
    }
    
    return (
      <div className="space-y-4">
        {clockInData.statistics.byLocation.slice(0, 5).map((location, index) => (
          <div key={index} className="flex items-center justify-between rounded-md p-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{location.location}</p>
                <p className="text-xs text-muted-foreground">{location.uniqueUsers} users</p>
              </div>
            </div>
            <Badge variant="secondary">{location.count} check-ins</Badge>
          </div>
        ))}
      </div>
    );
  };

  const renderDailyStats = () => {
    if (!clockInData?.statistics?.byDate?.length) {
      return <p className="text-muted-foreground py-4 text-center">No daily statistics available</p>;
    }
    
    const chartData = clockInData.statistics.byDate.map(day => ({
      date: day.date,
      'Check-ins': day.count,
      'Users': day.uniqueUsers
    }));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Check-ins" fill="#8884d8" />
          <Bar dataKey="Users" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= (clockInData?.pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };
  
  // Generate array of page numbers for dropdown
  const pageNumbers = clockInData?.pagination?.totalPages 
    ? Array.from({ length: clockInData.pagination.totalPages }, (_, i) => i + 1) 
    : [1];
    
  // Handle direct page selection
  const handleDirectPageSelect = (e) => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page)) {
      handlePageChange(page);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search submission - send query to API
  const handleSearch = () => {
    // Reset to page 1 when searching
    setCurrentPage(1);
    fetchClockInData(1);
  };
  
  // Reset search and refetch data
  const resetSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchClockInData(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Clock-in Management</CardTitle>
            <CardDescription>
              {clockInData?.userInfo?.subordinateCount 
                ? `Showing data for you and ${clockInData.userInfo.subordinateCount} team members` 
                : 'Showing your clock-in data'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange(range || { from: null, to: null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => fetchClockInData(currentPage)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded w-full mb-6"></div>
            <div className="h-60 bg-muted rounded mb-6"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchClockInData(currentPage)}>Retry</Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="records" value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="records">Clock-in Records</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Check-ins</p>
                          <p className="text-2xl font-bold">{clockInData?.statistics?.totalClockIns || 0}</p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Unique Locations</p>
                          <p className="text-2xl font-bold">{clockInData?.statistics?.byLocation?.length || 0}</p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                          <p className="text-sm font-medium">
                            {dateRange.from && dateRange.to
                              ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                              : "All time"}
                          </p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Check-in Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderDailyStats()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Check-in Locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderLocationStats()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="records">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email or location..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleSearch}
                    >
                      Search
                    </Button>
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={resetSearch}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Coordinates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClockIns?.length ? (
                        filteredClockIns.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{record.user?.name}</p>
                                  <p className="text-xs text-muted-foreground">{record.user?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.time ? format(new Date(record.time), "MMM d, yyyy h:mm a") : "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px] truncate" title={record.address}>
                                {record.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.latitude?.toFixed(6)}, {record.longitude?.toFixed(6)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Always show pagination controls */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{filteredClockIns?.length || 0}</span> of{" "}
                    <span className="font-medium">{clockInData?.pagination?.totalItems || 0}</span> records
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!clockInData || clockInData.pagination.currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">Page</div>
                      <select 
                        className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm ring-offset-background"
                        value={currentPage}
                        onChange={handleDirectPageSelect}
                      >
                        {pageNumbers.map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      <div className="text-sm">of {clockInData?.pagination?.totalPages || 1}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!clockInData || clockInData.pagination.currentPage >= clockInData.pagination.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="locations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Check-in Locations</CardTitle>
                    <CardDescription>
                      All locations where team members have checked in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clockInData?.statistics?.byLocation?.length ? (
                      <div className="space-y-4">
                        {clockInData.statistics.byLocation.map((location, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md p-3 bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{location.location}</p>
                                <p className="text-xs text-muted-foreground">{location.uniqueUsers} users</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{location.count} check-ins</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground py-4 text-center">No location data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ClockInDetails; 