"use client";
import { useState, useEffect } from 'react';
import { api } from '@/config/axios.config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, MapPinIcon, ClockIcon, UserIcon, RefreshCwIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ClockInDetails = () => {
  const [clockInRecords, setClockInRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClockInData = async () => {
    try {
      setLoading(true);
      // Fetch clock-in data from our API with pagination
      const response = await api.get('/clock-in/report', {
        params: {
          page,
          limit: 10,
          // Add search term if present
          ...(searchTerm && { search: searchTerm })
        }
      });
      
      if (response.data && response.data.success) {
        setClockInRecords(response.data.clockIns);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('Failed to load clock-in records');
      }
    } catch (err) {
      console.error('Error fetching clock-in records:', err);
      setError('Error loading clock-in information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClockInData();
  }, [page]);

  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchClockInData();
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Clock-in Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-9 bg-muted animate-pulse rounded w-64"></div>
            <div className="h-9 bg-muted animate-pulse rounded w-20"></div>
          </div>
          <div className="border rounded-md">
            <div className="h-10 bg-muted animate-pulse"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse mt-1"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Clock-in Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            {error}
          </div>
          <Button 
            variant="outline" 
            onClick={fetchClockInData} 
            className="flex items-center space-x-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Clock-in Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or location..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setPage(1);
            fetchClockInData();
          }}>
            Reset
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead>Clock-in Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Coordinates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clockInRecords.length > 0 ? (
                clockInRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div>{record.user?.name || 'Unknown User'}</div>
                          <div className="text-xs text-muted-foreground">{record.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(record.time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]" title={record.address}>
                          {record.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {record.latitude && record.longitude ? (
                        <span>
                          {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No coordinates</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No clock-in records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClockInDetails; 