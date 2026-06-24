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
          <h2 className="text-title-md2 font-semibold text-black dark:text-white flex items-center gap-2">
            Quản lý đổi thưởng
            {activeTab === 'rewards' && !loading && (
              <span className="text-sm font-medium text-slate-500">({rewards.length} phần quà)</span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Cấu hình quà tặng, voucher và theo dõi lịch sử đổi quà của khán giả.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'rewards' && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-center font-medium text-white hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Thêm phần thưởng
            </button>
          )}
          <button
            onClick={activeTab === 'rewards' ? fetchRewards : fetchRedemptions}
            disabled={loading || historyLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading || historyLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition ${
            activeTab === 'rewards'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Gift size={18} />
          Danh sách Quà Tặng
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <History size={18} />
          Lịch sử Đổi Thưởng
        </button>
      </div>

      {/* Main content depending on Active Tab */}
      {activeTab === 'rewards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-[#1c2434] h-72">
                <div className="bg-slate-200 dark:bg-slate-700 h-32 rounded-lg mb-4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))
          ) : rewards.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-[#1c2434] rounded-xl border border-slate-200 dark:border-slate-700">
              <Gift className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
              <p className="text-slate-500 font-medium">Chưa có phần quà nào được tạo</p>
              <button
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-1.5 px-4 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Tạo phần quà đầu tiên
              </button>
            </div>
          ) : (
            rewards.map((reward) => (
              <div
                key={reward._id}
                className={`relative bg-white dark:bg-[#1c2434] rounded-xl border shadow-sm overflow-hidden flex flex-col transition hover:shadow-md ${
                  reward.isActive ? 'border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                {/* Image header */}
                <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {reward.imageUrl ? (
                    <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Gift size={48} />
                    </div>
                  )}
                  {/* Badge type */}
                  <span className={`absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    reward.type === 'voucher' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {reward.type === 'voucher' ? 'Voucher' : 'Quà vật lý'}
                  </span>
                  {/* Active status */}
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    reward.isActive 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {reward.isActive ? 'Kích hoạt' : 'Ngừng bán'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-black dark:text-white line-clamp-1">{reward.name}</h4>
                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 min-h-[32px]">{reward.description}</p>
                    
                    {/* Cost & Stock info */}
                    <div className="flex items-center justify-between mt-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Giá trị</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Coins className="text-yellow-500" size={14} />
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {reward.coinsRequired.toLocaleString('vi-VN')} coins
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Tồn kho</p>
                        <span className={`text-sm font-bold mt-0.5 inline-block ${reward.stock > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-500'}`}>
                          {reward.stock > 0 ? `${reward.stock} chiếc` : 'Hết hàng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <button
                      onClick={() => handleOpenEdit(reward)}
                      className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                    >
                      <Edit size={14} />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleOpenDelete(reward)}
                      className="px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 flex items-center justify-center transition"
                      title="Xóa phần quà"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* History logs */
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] overflow-hidden">
          {/* Search bar */}
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-7.5">
            <div className="relative z-20 bg-transparent w-full sm:w-auto min-w-[300px]">
              <span className="absolute top-1/2 left-4 -translate-y-1/2">
                <Search size={18} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm theo người đổi, voucher hoặc tên phần thưởng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-slate-300 bg-transparent py-2 pl-10 pr-4 outline-none focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-50 text-left dark:bg-slate-800">
                  <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 sm:pl-7.5">Khán giả đổi quà</th>
                  <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Phần quà đã đổi</th>
                  <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Giá trị (Coins)</th>
                  <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Mã voucher</th>
                  <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Thời gian quy đổi</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="py-4 px-4 sm:px-7.5"><div className="h-5 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div></td>
                      ))}
                    </tr>
                  ))
                ) : filteredRedemptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">Không tìm thấy lịch sử đổi quà nào</td>
                  </tr>
                ) : (
                  filteredRedemptions.map((redemption) => (
                    <tr key={redemption._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 sm:pl-7.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-black dark:text-white text-sm">{redemption.userId?.fullName || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{redemption.userId?.email || 'Guest'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {redemption.rewardId ? (
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{redemption.rewardId.name}</p>
                            <span className={`inline-block text-[10px] mt-0.5 px-2 py-0.2 rounded-full font-semibold ${
                              redemption.rewardId.type === 'voucher' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {redemption.rewardId.type === 'voucher' ? 'Voucher' : 'Quà vật lý'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Phần quà đã bị xóa</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                        {redemption.coinsSpent.toLocaleString('vi-VN')} xu
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1 rounded">
                          {redemption.voucherCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
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
        title={dialogMode === 'create' ? 'Thêm phần thưởng mới' : 'Chỉnh sửa phần thưởng'}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Loại quà tặng</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="voucher" 
                  checked={formType === 'voucher'}
                  onChange={() => setFormType('voucher')}
                  className="accent-blue-600"
                />
                Mã Voucher điện tử
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="physical" 
                  checked={formType === 'physical'}
                  onChange={() => setFormType('physical')}
                  className="accent-blue-600"
                />
                Quà tặng vật lý
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">Tên phần quà</label>
            <input 
              type="text" 
              value={formName} 
              onChange={(e) => setFormName(e.target.value)} 
              placeholder="Ví dụ: Áo thun Racing, Voucher 50K..."
              className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm text-black outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">Mô tả chi tiết</label>
            <textarea 
              rows={3}
              value={formDescription} 
              onChange={(e) => setFormDescription(e.target.value)} 
              placeholder="Nhập thông tin hướng dẫn sử dụng, điều khoản đổi quà..."
              className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm text-black outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white resize-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">Xu yêu cầu (Coins)</label>
              <input 
                type="number" 
                value={formCoinsRequired} 
                onChange={(e) => setFormCoinsRequired(Number(e.target.value))} 
                className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm text-black outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" 
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">Số lượng tồn kho</label>
              <input 
                type="number" 
                value={formStock} 
                onChange={(e) => setFormStock(Number(e.target.value))} 
                className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm text-black outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black dark:text-white flex items-center justify-between">
              Hình ảnh minh họa
              {uploading && <span className="text-xs text-blue-600 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> Đang tải ảnh...</span>}
            </label>
            
            {/* Image Preview and Upload Picker */}
            <div className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                {formImageUrl ? (
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-sm transition">
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
                <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, GIF. Kích thước tối đa 5MB.</p>
              </div>
            </div>

            {/* Direct Image URL input */}
            <input 
              type="text" 
              value={formImageUrl} 
              onChange={(e) => setFormImageUrl(e.target.value)} 
              placeholder="Hoặc nhập địa chỉ URL hình ảnh trực tiếp..."
              className="w-full rounded border border-slate-300 bg-transparent py-1.5 px-4 text-xs text-black outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white mt-2" 
            />
          </div>

          <div className="mt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded accent-blue-600 h-4 w-4"
              />
              Kích hoạt phần quà (cho phép đổi trên ứng dụng)
            </label>
          </div>
        </div>

        {/* Dialog footer actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button 
            onClick={handleCloseDialog} 
            disabled={saving || uploading} 
            className="rounded border border-slate-300 py-1.5 px-5 text-sm font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            Hủy
          </button>
          <button 
            onClick={handleSaveReward} 
            disabled={saving || uploading} 
            className="rounded bg-blue-600 py-1.5 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[100px]"
          >
            {saving ? <RefreshCw className="animate-spin mr-2" size={14} /> : null}
            {dialogMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
          </button>
        </div>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <Modal open={openDeleteDialog} onClose={handleCloseDelete} title="Xác nhận xóa phần thưởng" maxWidth="max-w-sm">
        <div className="text-slate-600 dark:text-slate-300 text-sm">
          <p>Bạn có chắc chắn muốn xóa phần thưởng <strong className="text-black dark:text-white">"{rewardToDelete?.name}"</strong>?</p>
          <p className="mt-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-900 p-3 rounded-lg text-xs leading-relaxed">
            <strong>Lưu ý:</strong> Nếu phần quà này đã từng được khán giả quy đổi, hệ thống sẽ tự động chuyển trạng thái của quà sang <strong>Ngừng kích hoạt</strong> thay vì xóa cứng để đảm bảo toàn vẹn dữ liệu quy đổi.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button 
            onClick={handleCloseDelete} 
            disabled={deleting} 
            className="rounded border border-slate-300 py-1.5 px-5 text-sm font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            Quay lại
          </button>
          <button 
            onClick={handleConfirmDelete} 
            disabled={deleting} 
            className="rounded bg-red-600 py-1.5 px-5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center min-w-[90px]"
          >
            {deleting ? <RefreshCw className="animate-spin mr-2" size={14} /> : null}
            Đồng ý xóa
          </button>
        </div>
      </Modal>
    </>
  );
}
