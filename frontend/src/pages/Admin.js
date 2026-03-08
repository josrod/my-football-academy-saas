import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Loader2, Trash2, Shield } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/users').then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (uid, role) => {
    await api.put(`/api/admin/users/${uid}`, { role });
    setUsers(users.map(u => u.id === uid ? {...u, role} : u));
  };

  const handleDelete = async (uid) => {
    if (uid === user?.user_id) return;
    await api.delete(`/api/admin/users/${uid}`);
    setUsers(users.filter(u => u.id !== uid));
  };

  return (
    <div data-testid="admin-page">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('admin.title')}</p>
        <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('admin.userManagement')}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden" data-testid="users-table">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">User</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Email</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Role</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Status</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30" data-testid={`user-row-${i}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-400">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="admin">Admin</option>
                      <option value="coach">Coach</option>
                      <option value="parent">Parent</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-md ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.id !== user?.user_id && (
                      <button onClick={() => handleDelete(u.id)} className="text-zinc-500 hover:text-red-400 transition-colors" data-testid={`delete-user-${i}`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-500">{users.length} users</div>
        </div>
      )}
    </div>
  );
}
