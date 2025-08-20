'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Search, Filter, Edit, Trash2, Eye, 
  Mail, Phone, Calendar, GraduationCap, BookOpen, Shield,
  MoreVertical, Download, Upload, RefreshCw, AlertCircle,
  CheckCircle, Clock, UserCheck, UserX
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  department: string;
  semester?: string;
  student_id?: string;
  faculty_id?: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login: string;
  profile_image?: string;
}

interface UserFilters {
  role: string;
  department: string;
  status: string;
  semester: string;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    department: 'all',
    status: 'all',
    semester: 'all'
  });
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    students: 0,
    faculty: 0,
    admins: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get users by role
      const { count: students } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      const { count: faculty } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'faculty');

      const { count: admins } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        students: students || 0,
        faculty: faculty || 0,
        admins: admins || 0,
        newThisMonth: newThisMonth || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: status as any } : user
      ));
      
      fetchStats();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Department', 'Status', 'Created'].join(','),
      ...filteredUsers.map(user => [
        user.full_name,
        user.email,
        user.role,
        user.department,
        user.status,
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-4 w-4" />;
      case 'faculty': return <BookOpen className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'faculty': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.faculty_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesDepartment = filters.department === 'all' || user.department === filters.department;
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    const matchesSemester = filters.semester === 'all' || user.semester === filters.semester;
    
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus && matchesSemester;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-slide-in-left flex items-center gap-3">
                <Users className="h-8 w-8" />
                User Management
              </h1>
              <p className="text-gray-600 animate-slide-in-right">
                Manage users, roles, and permissions across the platform
              </p>
            </div>
            <div className="flex gap-2 animate-slide-in-right">
              <Button
                variant="outline"
                onClick={exportUsers}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setShowAddUserModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          {[
            {
              title: 'Total Users',
              value: stats.totalUsers,
              icon: Users,
              color: 'blue',
              description: 'All registered users'
            },
            {
              title: 'Active Users',
              value: stats.activeUsers,
              icon: UserCheck,
              color: 'green',
              description: 'Currently active'
            },
            {
              title: 'Students',
              value: stats.students,
              icon: GraduationCap,
              color: 'blue',
              description: 'Student accounts'
            },
            {
              title: 'Faculty',
              value: stats.faculty,
              icon: BookOpen,
              color: 'purple',
              description: 'Faculty members'
            },
            {
              title: 'Admins',
              value: stats.admins,
              icon: Shield,
              color: 'orange',
              description: 'Admin accounts'
            },
            {
              title: 'New This Month',
              value: stats.newThisMonth,
              icon: Calendar,
              color: 'indigo',
              description: 'Recent registrations'
            }
          ].map((stat, index) => (
            <Card 
              key={stat.title}
              className={`animate-slide-in-up glass-effect hover:shadow-lg transition-all duration-200`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-xs text-${stat.color}-600`}>{stat.description}</p>
                  </div>
                  <div className={`p-2 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 animate-slide-in-up glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <Button
                variant="outline"
                onClick={fetchUsers}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="animate-slide-in-up glass-effect">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              {bulkSelection.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Bulk Actions ({bulkSelection.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelection(filteredUsers.map(u => u.id));
                          } else {
                            setBulkSelection([]);
                          }
                        }}
                        checked={bulkSelection.length === filteredUsers.length && filteredUsers.length > 0}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Last Login</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id}
                      className={`border-b hover:bg-gray-50 animate-slide-in-up`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={bulkSelection.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelection(prev => [...prev, user.id]);
                            } else {
                              setBulkSelection(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {(user.student_id || user.faculty_id) && (
                              <p className="text-xs text-gray-400">
                                ID: {user.student_id || user.faculty_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getRoleColor(user.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </div>
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span>{user.department}</span>
                        {user.semester && (
                          <span className="text-sm text-gray-500 block">
                            Sem {user.semester}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              // Open edit modal
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Status Toggle */}
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStatus(user.id, 'suspended')}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStatus(user.id, 'active')}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No users found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Details</CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserModal(false)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {selectedUser.profile_image ? (
                      <img
                        src={selectedUser.profile_image}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getRoleColor(selectedUser.role)}>
                          {selectedUser.role}
                        </Badge>
                        <Badge className={getStatusColor(selectedUser.status)}>
                          {selectedUser.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <p className="text-gray-900">{selectedUser.department}</p>
                    </div>
                    
                    {selectedUser.semester && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semester
                        </label>
                        <p className="text-gray-900">Semester {selectedUser.semester}</p>
                      </div>
                    )}
                    
                    {selectedUser.student_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Student ID
                        </label>
                        <p className="text-gray-900">{selectedUser.student_id}</p>
                      </div>
                    )}
                    
                    {selectedUser.faculty_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Faculty ID
                        </label>
                        <p className="text-gray-900">{selectedUser.faculty_id}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Created
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Login
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.last_login 
                          ? new Date(selectedUser.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateUserStatus(
                        selectedUser.id, 
                        selectedUser.status === 'active' ? 'suspended' : 'active'
                      )}
                      className={selectedUser.status === 'active' ? 'text-red-600' : 'text-green-600'}
                    >
                      {selectedUser.status === 'active' ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => deleteUser(selectedUser.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
