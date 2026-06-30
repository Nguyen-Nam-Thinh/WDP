import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit, Trash2, Search, Image as ImageIcon, Tag, 
  CheckCircle, X, RefreshCw, Gift, Upload, History, User, Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { rewardApi, Reward, Redemption } from '../../api/reward';

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1 shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RewardManagement() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Forms dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoinsRequired, setFormCoinsRequired] = useState(0);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStock, setFormStock] = useState(10);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formType, setFormType] = useState<'voucher' | 'physical'>('voucher');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Redemption filters
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch functions
  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rewardApi.listAll();
      setRewards(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách phần thưởng');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRedemptions = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await rewardApi.listRedemptions();
      setRedemptions(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải lịch sử quy đổi');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchRewards();
    } else {
      fetchRedemptions();
    }
  }, [activeTab, fetchRewards, fetchRedemptions]);

  // Dialog handlers
  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedReward(null);
    setFormName('');
    setFormDescription('');
    setFormCoinsRequired(1000);
    setFormImageUrl('');
    setFormStock(50);
    setFormIsActive(true);
    setFormType('voucher');
    setOpenDialog(true);
  };

  const handleOpenEdit = (reward: Reward) => {
    setDialogMode('edit');
    setSelectedReward(reward);
    setFormName(reward.name);
    setFormDescription(reward.description);
    setFormCoinsRequired(reward.coinsRequired);
    setFormImageUrl(reward.imageUrl || '');
    setFormStock(reward.stock);
    setFormIsActive(reward.isActive);
    setFormType(reward.type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReward(null);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await rewardApi.uploadImage(file);
      setFormImageUrl(res.imageUrl);
      toast.success('Đăng tải hình ảnh thành công!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload hình ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  // Save/Update handler
  const handleSaveReward = async () => {
    if (!formName.trim()) return toast.error('Vui lòng nhập tên phần thưởng');
    if (!formDescription.trim()) return toast.error('Vui lòng nhập mô tả');
    if (formCoinsRequired < 0) return toast.error('Số coins yêu cầu không được âm');
    if (formStock < 0) return toast.error('Số lượng tồn kho không được âm');

    setSaving(true);
    const payload = {
      name: formName,
      description: formDescription,
      coinsRequired: formCoinsRequired,
      imageUrl: formImageUrl,
      stock: formStock,
      isActive: formIsActive,
      type: formType,
    };

    try {
      if (dialogMode === 'create') {
        await rewardApi.create(payload);
        toast.success('Thêm phần thưởng mới thành công');
      } else {
        if (!selectedReward) return;
        await rewardApi.update(selectedReward._id, payload);
        toast.success('Cập nhật phần thưởng thành công');
      }
      handleCloseDialog();
      fetchRewards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lưu phần thưởng thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const handleOpenDelete = (reward: Reward) => {
    setRewardToDelete(reward);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setRewardToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!rewardToDelete) return;
    setDeleting(true);
    try {
      const res = await rewardApi.delete(rewardToDelete._id);
      toast.success(res ? 'Xử lý phần thưởng thành công' : 'Đã xóa phần thưởng');
      handleCloseDelete();
      fetchRewards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa phần thưởng thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // Filter redemptions
  const filteredRedemptions = redemptions.filter((r) => {
    const userMatch =
      r.userId?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userId?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const voucherMatch = r.voucherCode.toLowerCase().includes(searchQuery.toLowerCase());
    const rewardMatch = r.rewardId?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return userMatch || voucherMatch || rewardMatch;
  });

  return (
    <>
      {/* Title section */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Quản lý Đổi Thưởng
          </h2>
          <p className="text-sm text-slate-500 mt-1">Cấu hình quà tặng, voucher và theo dõi lịch sử đổi quà của khán giả.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'rewards' && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={16} />
              Thêm Quà Tặng
            </button>
          )}
          <button
            onClick={activeTab === 'rewards' ? fetchRewards : fetchRedemptions}
            disabled={loading || historyLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading || historyLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition ${
            activeTab === 'rewards'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift size={16} />
          Danh sách Quà Tặng
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={16} />
          Lịch sử Đổi Thưởng
        </button>
      </div>

      {/* Main content depending on Active Tab */}
      {activeTab === 'rewards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200 rounded-xl p-5 bg-white h-72 shadow-sm">
                <div className="bg-slate-200 h-32 rounded-lg mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))
          ) : rewards.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-medium">Chưa có phần quà nào được tạo</p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
              >
                <Plus size={16} />
                Tạo phần quà đầu tiên
              </button>
            </div>
          ) : (
            rewards.map((reward) => (
              <div
                key={reward._id}
                className={`relative bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${
                  reward.isActive ? 'border-slate-200' : 'border-slate-200 opacity-70 grayscale-[20%]'
                }`}
              >
                {/* Image header */}
                <div className="h-44 bg-slate-100 relative overflow-hidden border-b border-slate-100">
                  {reward.imageUrl ? (
                    <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                      <Gift size={48} />
                    </div>
                  )}
                  {/* Badge type */}
                  <span className={`absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm border ${
                    reward.type === 'voucher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {reward.type === 'voucher' ? 'Voucher' : 'Quà vật lý'}
                  </span>
                  {/* Active status */}
                  <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm border ${
                    reward.isActive 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {reward.isActive ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-900 line-clamp-1">{reward.name}</h4>
                    <p className="text-slate-500 text-xs mt-1.5 font-medium line-clamp-2 min-h-[32px]">{reward.description}</p>
                    
                    {/* Cost & Stock info */}
                    <div className="flex items-center justify-between mt-5 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Giá trị</p>
                        <div className="flex items-center gap-1.5">
                          <Coins className="text-amber-500" size={14} />
                          <span className="text-[13px] font-bold text-slate-800">
                            {reward.coinsRequired.toLocaleString('vi-VN')} $
                          </span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-200 mx-2"></div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Tồn kho</p>
                        <span className={`text-[13px] font-bold ${reward.stock > 0 ? 'text-slate-800' : 'text-red-600'}`}>
                          {reward.stock > 0 ? `${reward.stock} chiếc` : 'Hết hàng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleOpenEdit(reward)}
                      className="flex-1 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 transition shadow-sm"
                    >
                      <Edit size={14} />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleOpenDelete(reward)}
                      className="px-3 py-2 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition shadow-sm"
                      title="Xóa phần quà"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* History logs */
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
          {/* Search bar */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm người đổi, voucher hoặc tên phần thưởng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                <tr>
                  <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200">Khán giả Đổi quà</th>
                  <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200">Phần quà Đã đổi</th>
                  <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200 text-right">Giá trị ($)</th>
                  <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200 text-center">Mã Voucher</th>
                  <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading ? (
                  <tr><td colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} /></td></tr>
                ) : filteredRedemptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <History size={40} className="mb-3 text-slate-300" />
                        Không tìm thấy lịch sử đổi quà nào
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRedemptions.map((redemption) => (
                    <tr key={redemption._id} className="hover:bg-slate-50/50 bg-white transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-[13px]">{redemption.userId?.fullName || 'N/A'}</p>
                            <p className="text-[11px] font-medium text-slate-500">{redemption.userId?.email || 'Guest'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {redemption.rewardId ? (
                          <div>
                            <p className="font-semibold text-slate-800 text-[13px]">{redemption.rewardId.name}</p>
                            <span className={`inline-block text-[10px] mt-1 px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm border ${
                              redemption.rewardId.type === 'voucher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {redemption.rewardId.type === 'voucher' ? 'Voucher' : 'Quà vật lý'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">Phần quà đã bị xóa</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-slate-800 text-[13px]">
                        {redemption.coinsSpent.toLocaleString('vi-VN')} $
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-mono text-sm font-bold bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded shadow-sm">
                          {redemption.voucherCode}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-[11px] font-medium text-slate-500">
                        {new Date(redemption.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Modal 
        open={openDialog} 
        onClose={handleCloseDialog} 
        title={dialogMode === 'create' ? 'Thêm Quà Tặng Mới' : 'Chỉnh sửa Quà Tặng'}
      >
        <div className="flex flex-col gap-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider">Phân Loại Quà Tặng</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="voucher" 
                  checked={formType === 'voucher'}
                  onChange={() => setFormType('voucher')}
                  className="accent-blue-600 w-4 h-4"
                />
                Mã Voucher điện tử
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="physical" 
                  checked={formType === 'physical'}
                  onChange={() => setFormType('physical')}
                  className="accent-blue-600 w-4 h-4"
                />
                Quà tặng vật lý
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">Tên phần quà</label>
            <input 
              type="text" 
              value={formName} 
              onChange={(e) => setFormName(e.target.value)} 
              placeholder="Ví dụ: Áo thun Racing, Voucher 50K..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">Mô tả chi tiết</label>
            <textarea 
              rows={3}
              value={formDescription} 
              onChange={(e) => setFormDescription(e.target.value)} 
              placeholder="Nhập thông tin hướng dẫn sử dụng, điều khoản đổi quà..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-sm" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">Giá trị ($)</label>
              <input 
                type="number" 
                value={formCoinsRequired} 
                onChange={(e) => setFormCoinsRequired(Number(e.target.value))} 
                className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">Số lượng tồn kho</label>
              <input 
                type="number" 
                value={formStock} 
                onChange={(e) => setFormStock(Number(e.target.value))} 
                className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              Hình ảnh minh họa
              {uploading && <span className="text-blue-600 flex items-center gap-1 normal-case font-semibold"><RefreshCw size={12} className="animate-spin" /> Đang tải ảnh...</span>}
            </label>
            
            <div className="flex items-center gap-4 border border-slate-200 p-3 rounded-lg bg-slate-50 shadow-sm">
              <div className="h-16 w-16 bg-white rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                {formImageUrl ? (
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition">
                  <Upload size={14} />
                  Chọn file từ máy
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    disabled={uploading}
                  />
                </label>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Hỗ trợ JPG, PNG, GIF. Tối đa 5MB.</p>
              </div>
            </div>

            <input 
              type="text" 
              value={formImageUrl} 
              onChange={(e) => setFormImageUrl(e.target.value)} 
              placeholder="Hoặc dán địa chỉ URL hình ảnh trực tiếp..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-2 shadow-sm" 
            />
          </div>

          <div className="mt-1 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded accent-blue-600 h-4 w-4"
              />
              Kích hoạt (Khán giả có thể thấy và đổi phần quà này)
            </label>
          </div>
        </div>

        {/* Dialog footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
          <button 
            onClick={handleCloseDialog} 
            disabled={saving || uploading} 
            className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSaveReward} 
            disabled={saving || uploading} 
            className="rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[120px] shadow-sm"
          >
            {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
            {dialogMode === 'create' ? 'Tạo mới' : 'Lưu cập nhật'}
          </button>
        </div>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <Modal open={openDeleteDialog} onClose={handleCloseDelete} title="Xóa Phần thưởng" maxWidth="max-w-sm">
        <div className="text-slate-600 text-sm font-medium">
          <p>Bạn có chắc chắn muốn xóa phần quà <strong className="text-slate-900">"{rewardToDelete?.name}"</strong>?</p>
          <div className="mt-4 bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-lg text-xs leading-relaxed shadow-sm">
            <strong className="block text-amber-700 mb-1 uppercase tracking-wider text-[10px]">Lưu ý quan trọng:</strong> 
            Nếu phần quà này đã được khán giả quy đổi, hệ thống sẽ <strong>Ngừng kích hoạt</strong> thay vì xóa vĩnh viễn để bảo toàn lịch sử giao dịch.
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
          <button 
            onClick={handleCloseDelete} 
            disabled={deleting} 
            className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
          >
            Hủy
          </button>
          <button 
            onClick={handleConfirmDelete} 
            disabled={deleting} 
            className="rounded-md bg-red-600 py-2 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center min-w-[110px] shadow-sm"
          >
            {deleting ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
            Xác nhận Xóa
          </button>
        </div>
      </Modal>
    </>
  );
}
