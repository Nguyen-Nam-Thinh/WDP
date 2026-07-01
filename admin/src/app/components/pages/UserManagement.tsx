import { useState, useEffect, useCallback, useRef } from 'react';
import { Edit, Search, Ban, CheckCircle, RefreshCw, Filter, X, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
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
  admin: 'bg-red-50 text-red-700 border border-red-200',
  owner: 'bg-orange-50 text-orange-700 border border-orange-200',
  jockey: 'bg-blue-50 text-blue-700 border border-blue-200',
  referee: 'bg-purple-50 text-purple-700 border border-purple-200',
  spectator: 'bg-slate-50 text-slate-700 border border-slate-200',
};

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-xl' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Dropdown Menu (Custom minimal) ───────────────────────────────────────────
function ActionMenu({ user, onEdit, onToggle, isToggling }: { user: AdminUser, onEdit: () => void, onToggle: () => void, isToggling: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-slate-100">
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              <Edit className="mr-2 h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              Chỉnh sửa
            </button>
            <button
              onClick={() => { setOpen(false); onToggle(); }}
              disabled={isToggling}
              className={`group flex w-full items-center px-4 py-2 text-sm ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'} disabled:opacity-50`}
            >
              {isToggling ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : user.isActive ? (
                <Ban className="mr-2 h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
              )}
              {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </button>
          </div>
        </div>
      )}
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500 mt-1">Danh sách tất cả người dùng trong hệ thống ({total} tài khoản)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
        {/* Toolbar */}
        <div className="border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Vai trò:</span>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm font-medium text-slate-700"
                >
                  <option value="">Tất cả</option>
                  <option value="owner">Chủ ngựa</option>
                  <option value="jockey">Kỵ thủ</option>
                  <option value="referee">Trọng tài</option>
                  <option value="spectator">Khán giả</option>
                </select>
                <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content - Sticky Header */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Người dùng</th>
                <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Email</th>
                <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Vai trò</th>
                <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Trạng thái</th>
                <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Ngày tạo</th>
                <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-700">Không tìm thấy kết quả</p>
                      <p className="text-sm mt-1">Vui lòng thử lại với từ khóa khác.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group bg-white cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.fullName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{user.phone || 'Chưa cập nhật SĐT'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[user.role] || ROLE_COLORS.spectator}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {user.isActive ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} /> Hoạt động
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                            <Ban size={12} /> Bị khóa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(user)} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                          <Edit size={12} /> Sửa
                        </button>
                        <button onClick={() => handleToggleActive(user)} disabled={togglingIds.has(user._id)} className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-slate-200 rounded transition shadow-sm bg-white disabled:opacity-50 ${user.isActive ? 'text-slate-600 hover:text-red-700 hover:bg-red-50' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                          {togglingIds.has(user._id) ? <RefreshCw size={12} className="animate-spin" /> : user.isActive ? <Ban size={12} /> : <CheckCircle size={12} />}
                          {user.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Hiển thị</span>
              <select 
                value={rowsPerPage} 
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="rounded border border-slate-200 bg-white py-1 px-2 text-xs font-medium outline-none transition focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-slate-500 font-medium ml-2">Trang <span className="font-bold text-slate-900">{page}</span> / {totalPages}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button key={p} onClick={() => setPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      <Modal open={openDialog} onClose={handleCloseDialog} title="Chỉnh sửa thông tin" maxWidth="max-w-md">
        <div className="p-6 pb-2">
          {/* Section: Thông tin cơ bản */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông tin tài khoản</h4>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email đăng nhập</label>
                <input 
                  type="email" 
                  value={selectedUser?.email ?? ''} 
                  disabled 
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-500 outline-none cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Họ và tên</label>
                <input 
                  type="text" 
                  value={editFullName} 
                  onChange={(e) => setEditFullName(e.target.value)} 
                  className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="Nhập họ và tên..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                <input 
                  type="text" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="Nhập số điện thoại..."
                />
              </div>
            </div>
          </div>

          {/* Section: Phân quyền */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Phân quyền</h4>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Vai trò hệ thống</label>
              <select 
                value={editRole} 
                onChange={(e) => setEditRole(e.target.value)} 
                className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 shadow-sm"
              >
                <option value="owner">Chủ ngựa</option>
                <option value="jockey">Kỵ thủ</option>
                <option value="referee">Trọng tài</option>
                <option value="spectator">Khán giả</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 mt-auto rounded-b-xl">
          <button 
            onClick={handleCloseDialog} 
            disabled={saving} 
            className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSaveUser} 
            disabled={saving} 
            className="rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition flex items-center justify-center min-w-[100px]"
          >
            {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
            Lưu thay đổi
          </button>
        </div>
      </Modal>
    </>
  );
}
