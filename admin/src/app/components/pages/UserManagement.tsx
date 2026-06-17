import { useState, useEffect, useCallback } from 'react';
import { Edit, Search, Ban, CheckCircle, RefreshCw, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { userApi, AdminUser } from '../../api/user';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Chủ ngựa',
  jockey: 'Kỵ thủ',
  referee: 'Trọng tài',
  spectator: 'Khán giả',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  owner: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  jockey: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  referee: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  spectator: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-black dark:hover:text-white transition">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Toggle active loading set
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getUsers({
        role: roleFilter || undefined,
        page,
        limit: rowsPerPage,
      });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, page, rowsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side search filter (search trong kết quả đã fetch)
  const filteredUsers = users.filter(
    (u) =>
      u.role !== 'admin' &&
      (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone ?? '');
    setEditRole(user.role);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userApi.updateUser(selectedUser._id, {
        fullName: editFullName,
        phone: editPhone,
        role: editRole as AdminUser['role'],
      });
      toast.success('Cập nhật người dùng thành công');
      handleCloseDialog();
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    setTogglingIds((prev) => new Set(prev).add(user._id));
    try {
      await userApi.toggleActive(user._id);
      toast.success(
        user.isActive
          ? `Đã vô hiệu hóa tài khoản ${user.fullName}`
          : `Đã kích hoạt tài khoản ${user.fullName}`,
      );
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setTogglingIds((prev) => {
        const s = new Set(prev);
        s.delete(user._id);
        return s;
      });
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white flex items-center gap-2">
          Quản lý người dùng
          {!loading && <span className="text-sm font-medium text-slate-500">({total} người dùng)</span>}
        </h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] mb-6 overflow-hidden">
        {/* Filters */}
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-7.5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative z-20 bg-transparent w-full sm:w-auto min-w-[260px] flex-1">
              <span className="absolute top-1/2 left-4 -translate-y-1/2">
                <Search size={18} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-slate-300 bg-transparent py-2 pl-10 pr-4 outline-none focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50"
              />
            </div>

            <div className="relative z-20 bg-transparent w-full sm:w-auto min-w-[180px]">
              <span className="absolute top-1/2 left-4 -translate-y-1/2">
                <Filter size={18} className="text-slate-400" />
              </span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 pl-10 pr-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50"
              >
                <option value="">Tất cả vai trò</option>
                <option value="owner">Chủ ngựa</option>
                <option value="jockey">Kỵ thủ</option>
                <option value="referee">Trọng tài</option>
                <option value="spectator">Khán giả</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-50 text-left dark:bg-slate-800">
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 sm:pl-7.5">Người dùng</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Email</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Vai trò</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Trạng thái</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Ngày tạo</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-right sm:pr-7.5">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-4 px-4 sm:px-7.5"><div className="h-5 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 sm:pl-7.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-semibold text-sm">{user.fullName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <p className="font-medium text-black dark:text-white">{user.fullName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] || ROLE_COLORS.spectator}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {user.isActive ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle size={14} /> Hoạt động
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Ban size={14} /> Bị vô hiệu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right sm:pr-7.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-100 rounded-md dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={togglingIds.has(user._id)}
                          className={`p-1.5 rounded-md transition ${
                            user.isActive 
                              ? 'text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-slate-700' 
                              : 'text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                          } disabled:opacity-50`}
                          title={user.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                        >
                          {togglingIds.has(user._id) ? (
                            <RefreshCw className="animate-spin" size={16} />
                          ) : user.isActive ? (
                            <Ban size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-7.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Hiển thị</span>
              <select 
                value={rowsPerPage} 
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="rounded border border-slate-300 bg-transparent py-1 px-2 text-sm outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-slate-500">hàng</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
                className="rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                ← Trước
              </button>
              <p className="text-sm text-slate-500">
                {page} / {totalPages}
              </p>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={page >= totalPages}
                className="rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Modal open={openDialog} onClose={handleCloseDialog} title="Chỉnh sửa người dùng" maxWidth="max-w-md">
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Họ và tên</label>
            <input 
              type="text" 
              value={editFullName} 
              onChange={(e) => setEditFullName(e.target.value)} 
              className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" 
            />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Email</label>
            <input 
              type="email" 
              value={selectedUser?.email ?? ''} 
              disabled 
              className="w-full rounded border-[1.5px] border-slate-200 bg-slate-50 py-2 px-4 text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 cursor-not-allowed" 
            />
            <p className="mt-1 text-xs text-slate-500">Email không thể thay đổi</p>
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Số điện thoại</label>
            <input 
              type="text" 
              value={editPhone} 
              onChange={(e) => setEditPhone(e.target.value)} 
              className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" 
            />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Vai trò</label>
            <div className="relative z-20 bg-transparent">
              <select 
                value={editRole} 
                onChange={(e) => setEditRole(e.target.value)} 
                className="relative z-20 w-full appearance-none rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="owner">Chủ ngựa</option>
                <option value="jockey">Kỵ thủ</option>
                <option value="referee">Trọng tài</option>
                <option value="spectator">Khán giả</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
          <button onClick={handleCloseDialog} disabled={saving} className="rounded border border-slate-300 py-2 px-6 font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition">
            Hủy
          </button>
          <button onClick={handleSaveUser} disabled={saving} className="rounded bg-blue-600 py-2 px-6 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
            {saving ? <RefreshCw className="animate-spin mr-2" size={18} /> : null}
            Cập nhật
          </button>
        </div>
      </Modal>
    </>
  );
}
