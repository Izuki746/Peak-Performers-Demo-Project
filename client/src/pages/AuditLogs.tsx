import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuditLog {
  id: string;
  timestamp: Date | string;
  action: string;
  user: string;
  target: string;
  status: "success" | "error" | "info";
  description: string;
}

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/audit-logs");
        const result = await response.json();
        if (result.success && result.data) {
          // Convert timestamp strings to Date objects
          const parsedLogs = result.data.map((log: any) => ({
            ...log,
            timestamp: typeof log.timestamp === "string" ? new Date(log.timestamp) : log.timestamp
          }));
          setLogs(parsedLogs);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // Refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const mockLogs = [
    {
      id: "LOG-001",
      timestamp: new Date(Date.now() - 300000),
      action: "DER Activated",
      user: "Operator: Alice Johnson",
      target: "DER-001 (Tesla Powerwall #42)",
      status: "success" as const,
      description: "Successfully activated battery DER via Beckn Protocol"
    },
    {
      id: "LOG-002",
      timestamp: new Date(Date.now() - 600000),
      action: "Feeder Monitored",
      user: "System: Auto-Monitor",
      target: "Feeder F-1234",
      status: "success" as const,
      description: "Automated load monitoring triggered alert on critical feeder"
    },
    {
      id: "LOG-003",
      timestamp: new Date(Date.now() - 1200000),
      action: "DER Deactivated",
      user: "Operator: Bob Smith",
      target: "DER-005 (Community Battery Bank)",
      status: "success" as const,
      description: "Manually deactivated battery storage resource"
    },
    {
      id: "LOG-004",
      timestamp: new Date(Date.now() - 1800000),
      action: "Alert Dismissed",
      user: "Operator: Alice Johnson",
      target: "Alert: alert-1",
      status: "info" as const,
      description: "Operator acknowledged critical feeder alert"
    },
    {
      id: "LOG-005",
      timestamp: new Date(Date.now() - 2400000),
      action: "API Request Failed",
      user: "System: Integration",
      target: "NESO Energy Data Portal",
      status: "error" as const,
      description: "Failed to fetch grid frequency data - API timeout"
    },
    {
      id: "LOG-006",
      timestamp: new Date(Date.now() - 3000000),
      action: "Configuration Updated",
      user: "Admin: System Config",
      target: "Grid Thresholds",
      status: "success" as const,
      description: "Updated critical load threshold from 90% to 92%"
    },
    {
      id: "LOG-007",
      timestamp: new Date(Date.now() - 3600000),
      action: "AI Recommendation",
      user: "System: AI Assistant",
      target: "Feeder F-5678",
      status: "info" as const,
      description: "AI recommended activation of 3 DERs for load balancing"
    },
    {
      id: "LOG-008",
      timestamp: new Date(Date.now() - 4200000),
      action: "Search Initiated",
      user: "System: Beckn Protocol",
      target: "Solar DER Resources",
      status: "success" as const,
      description: "Beckn search request completed - found 8 available solar resources"
    },
    {
      id: "LOG-009",
      timestamp: new Date(Date.now() - 4800000),
      action: "User Login",
      user: "Operator: Charlie Brown",
      target: "Dashboard",
      status: "success" as const,
      description: "User authenticated and logged into Grid Command Center"
    },
    {
      id: "LOG-010",
      timestamp: new Date(Date.now() - 5400000),
      action: "Report Generated",
      user: "System: Reporting",
      target: "Daily Demand Response Summary",
      status: "success" as const,
      description: "Daily report generated - total DER activation time: 4.5 hours"
    }
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600 hover:bg-green-700">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const displayLogs = logs.length > 0 ? logs : mockLogs;
  
  const filteredLogs = displayLogs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const successLogs = filteredLogs.filter(l => l.status === "success");
  const errorLogs = filteredLogs.filter(l => l.status === "error");
  const infoLogs = filteredLogs.filter(l => l.status === "info");

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Track all system activities, user actions, and API interactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Events</p>
              <p className="text-2xl font-bold">{displayLogs.length}</p>
            </div>
            <Badge className="bg-blue-600">All Time</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Successful Actions</p>
              <p className="text-2xl font-bold text-green-600">{successLogs.length}</p>
            </div>
            <Badge className="bg-green-600">Success</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-600">{errorLogs.length}</p>
            </div>
            <Badge variant="destructive">Errors</Badge>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, user, target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-audit-logs"
            />
          </div>
          <Badge variant="secondary" className="gap-2">
            <Filter className="h-3 w-3" />
            {filteredLogs.length} Results
          </Badge>
        </div>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({filteredLogs.length})</TabsTrigger>
          <TabsTrigger value="success">Success ({successLogs.length})</TabsTrigger>
          <TabsTrigger value="error">Errors ({errorLogs.length})</TabsTrigger>
          <TabsTrigger value="info">Info ({infoLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <Card key={log.id} className={`p-4 border ${getStatusColor(log.status)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{log.action}</h3>
                        <p className="text-sm opacity-75 mb-2">{log.description}</p>
                        <div className="flex items-center gap-3 flex-wrap text-xs opacity-60">
                          <span>User: {log.user}</span>
                          <span>•</span>
                          <span>Target: {log.target}</span>
                          <span>•</span>
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No logs found matching your search</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="success" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {successLogs.length > 0 ? (
                successLogs.map((log) => (
                  <Card key={log.id} className={`p-4 border ${getStatusColor(log.status)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{log.action}</h3>
                        <p className="text-sm opacity-75 mb-2">{log.description}</p>
                        <div className="flex items-center gap-3 flex-wrap text-xs opacity-60">
                          <span>User: {log.user}</span>
                          <span>•</span>
                          <span>Target: {log.target}</span>
                          <span>•</span>
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No successful actions logged</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="error" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {errorLogs.length > 0 ? (
                errorLogs.map((log) => (
                  <Card key={log.id} className={`p-4 border ${getStatusColor(log.status)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{log.action}</h3>
                        <p className="text-sm opacity-75 mb-2">{log.description}</p>
                        <div className="flex items-center gap-3 flex-wrap text-xs opacity-60">
                          <span>User: {log.user}</span>
                          <span>•</span>
                          <span>Target: {log.target}</span>
                          <span>•</span>
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No errors logged</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {infoLogs.length > 0 ? (
                infoLogs.map((log) => (
                  <Card key={log.id} className={`p-4 border ${getStatusColor(log.status)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{log.action}</h3>
                        <p className="text-sm opacity-75 mb-2">{log.description}</p>
                        <div className="flex items-center gap-3 flex-wrap text-xs opacity-60">
                          <span>User: {log.user}</span>
                          <span>•</span>
                          <span>Target: {log.target}</span>
                          <span>•</span>
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No info events logged</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
