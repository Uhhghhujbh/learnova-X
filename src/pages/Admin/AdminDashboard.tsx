import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button/Button';
import { Ban, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  banned: boolean;
  created_at: string;
}

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reported_by: string;
  posts?: { title: string };
  users?: { display_name: string };
}

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('reports');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchReports();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, posts(title), users:reported_by(display_name)')
      .order('created_at', { ascending: false });
    if (data) setReports(data);
  };

  const toggleBanUser = async (userId: string, currentBan: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ banned: !currentBan })
      .eq('id', userId);
    
    if (!error) fetchUsers();
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ 
        status, 
        reviewed_by: user?.id,
        admin_notes: `Reviewed by admin on ${new Date().toLocaleDateString()}`
      })
      .eq('id', reportId);
    
    if (!error) fetchReports();
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="text-gray-600 mt-2">You must be an admin to view this page</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Reports ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium capitalize">
                      {report.reason.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Reported by: <strong>{report.users?.display_name}</strong>
                  </p>
                  {report.posts && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Post: <strong>{report.posts.title}</strong>
                    </p>
                  )}
                  <p className="text-gray-700 dark:text-gray-300">{report.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                
                {report.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Resolve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Dismiss</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <p className="text-center text-gray-500 py-8">No reports yet</p>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.map(u => (
            <div
              key={u.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white break-words">
                    {u.display_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{u.username}</p>
                  <p className="text-sm text-gray-500 break-all">{u.email}</p>
                  {u.banned && (
                    <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Banned
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={u.banned ? 'primary' : 'secondary'}
                  onClick={() => toggleBanUser(u.id, u.banned)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Ban className="w-4 h-4" />
                  {u.banned ? 'Unban' : 'Ban'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
