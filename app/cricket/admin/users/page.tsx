'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Users, X, Save, Edit2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  playerId: number;
  sessions: { id: string; expiresAt: string }[];
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    age: 0,
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, ...editForm }
            : u
        ));
        setSelectedUser({ ...selectedUser, ...editForm });
        setIsEditing(false);
      } else {
        console.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'MALE':
        return 'bg-blue-500/20 text-blue-400';
      case 'FEMALE':
        return 'bg-pink-500/20 text-pink-400';
      default:
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cricket/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <ShieldAlert className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">User Management</h1>
                <p className="text-xs text-slate-500">{users.length} registered users</p>
              </div>
            </div>
            <Link
              href="/cricket/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={20} />
                  Registered Users
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">No users registered</h3>
                  <p className="text-sm text-slate-500">Users will appear here when they sign up</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                          : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getGenderColor(user.gender)}`}>
                            {user.gender}
                          </span>
                          <span className="text-sm text-slate-500 font-mono">
                            ID: {user.playerId}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Details Panel */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">User Details</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="p-6">
                  {/* Avatar */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl font-bold text-emerald-400">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Age</label>
                        <input
                          type="number"
                          value={editForm.age}
                          onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Gender</label>
                        <select
                          value={editForm.gender}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-slate-400 text-sm">Player ID</span>
                        <span className="font-mono text-emerald-400">{selectedUser.playerId}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-slate-400 text-sm">Name</span>
                        <span>{selectedUser.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-slate-400 text-sm">Email</span>
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-slate-400 text-sm">Age</span>
                        <span>{selectedUser.age}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-slate-400 text-sm">Gender</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getGenderColor(selectedUser.gender)}`}>
                          {selectedUser.gender}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-400 text-sm">Status</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          selectedUser.sessions.length > 0 && new Date(selectedUser.sessions[0].expiresAt) > new Date()
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {selectedUser.sessions.length > 0 && new Date(selectedUser.sessions[0].expiresAt) > new Date()
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <Users size={48} className="mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">Select a user</h3>
                <p className="text-sm text-slate-500">Click on a user from the list to view their details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}