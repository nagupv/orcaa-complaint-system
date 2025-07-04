import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileText, Download, Users, BarChart3 } from "lucide-react";
import type { User, Role } from "@shared/schema";

export default function UserRoleReport() {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  const getUserRoles = (user: User) => {
    return typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles?.find((r: Role) => r.name === roleName);
    return role?.displayName || roleName;
  };

  const getRoleStatistics = () => {
    if (!users || !roles) return [];

    const stats = roles.map((role: Role) => {
      const userCount = users.filter((user: User) => {
        const userRoles = getUserRoles(user);
        return userRoles.includes(role.name);
      }).length;

      return {
        roleName: role.name,
        displayName: role.displayName,
        userCount,
        isActive: role.isActive
      };
    });

    return stats.sort((a, b) => b.userCount - a.userCount);
  };

  const getTotalUsers = () => users?.length || 0;
  const getActiveRoles = () => roles?.filter((role: Role) => role.isActive).length || 0;
  const getUsersWithNoRoles = () => {
    if (!users) return 0;
    return users.filter((user: User) => {
      const userRoles = getUserRoles(user);
      return userRoles.length === 0;
    }).length;
  };

  const getUsersWithMultipleRoles = () => {
    if (!users) return 0;
    return users.filter((user: User) => {
      const userRoles = getUserRoles(user);
      return userRoles.length > 1;
    }).length;
  };

  const handleExportReport = () => {
    if (!users || !roles) return;

    const csvData = [
      ['User ID', 'Name', 'Email', 'Roles', 'Role Count', 'Status'],
      ...users.map((user: User) => {
        const userRoles = getUserRoles(user);
        const roleNames = userRoles.map(roleName => getRoleDisplayName(roleName)).join('; ');
        return [
          user.id,
          `${user.firstName} ${user.lastName}`,
          user.email || '',
          roleNames,
          userRoles.length.toString(),
          userRoles.length > 0 ? 'Active' : 'No Roles'
        ];
      })
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell?.replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `user-role-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const roleStats = getRoleStatistics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            User Role Report
          </h2>
          <p className="text-muted-foreground">
            Comprehensive overview of user role assignments and statistics
          </p>
        </div>
        <Button onClick={handleExportReport} className="bg-orcaa-blue hover:bg-orcaa-blue/90">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalUsers()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveRoles()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Without Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUsersWithNoRoles()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Multiple Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUsersWithMultipleRoles()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>
            Number of users assigned to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <div className="text-center py-4">Loading roles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>User Count</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleStats.length > 0 ? (
                  roleStats.map((stat) => (
                    <TableRow key={stat.roleName}>
                      <TableCell className="font-medium">{stat.displayName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {stat.userCount} {stat.userCount === 1 ? 'user' : 'users'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stat.isActive ? "default" : "secondary"}>
                          {stat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No roles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed User Report */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed User Role Assignments</CardTitle>
          <CardDescription>
            Complete list of all users and their assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Role Count</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user: User) => {
                    const userRoles = getUserRoles(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRoles.length > 0 ? (
                              userRoles.map((roleName: string) => (
                                <Badge key={roleName} variant="default" className="text-xs">
                                  {getRoleDisplayName(roleName)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">No roles assigned</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {userRoles.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userRoles.length > 0 ? "default" : "secondary"}>
                            {userRoles.length > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}