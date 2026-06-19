import { 
  Users, 
  Trophy, 
  Flag, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  Megaphone,
  PlusCircle,
  UserPlus,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statCards = [
  {
    label: 'Tổng người dùng',
    value: '1,245',
    change: '+12%',
    up: true,
    sub: 'so với tháng trước',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100/50 dark:bg-blue-900/30',
    icon: Users,
    gradient: 'from-blue-500/20 to-transparent'
  },
  {
    label: 'Giải đấu đang diễn ra',
    value: '5',
    change: '8 sắp tới',
    up: true,
    sub: 'giải đấu sắp tới',
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-100/50 dark:bg-amber-900/30',
    icon: Trophy,
    gradient: 'from-amber-500/20 to-transparent'
  },
  {
    label: 'Ngựa đang thi đấu',
    value: '87',
    change: '+15 mới',
    up: true,
    sub: 'ngựa đăng ký mới',
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-100/50 dark:bg-emerald-900/30',
    icon: Flag,
    gradient: 'from-emerald-500/20 to-transparent'
  },
  {
    label: 'Đơn chờ duyệt',
    value: '23',
    change: 'Cần xử lý',
    up: false,
    sub: 'cần xử lý ngay',
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-100/50 dark:bg-rose-900/30',
    icon: ClipboardList,
    gradient: 'from-rose-500/20 to-transparent'
  },
];

const chartData = [
  { name: 'Th 1', users: 400, revenue: 240 },
  { name: 'Th 2', users: 300, revenue: 139 },
  { name: 'Th 3', users: 550, revenue: 380 },
  { name: 'Th 4', users: 450, revenue: 390 },
  { name: 'Th 5', users: 700, revenue: 480 },
  { name: 'Th 6', users: 850, revenue: 600 },
  { name: 'Th 7', users: 1245, revenue: 850 },
];

const upcomingTournaments = [
  { name: 'Giải Vô Địch Quốc Gia 2026', date: '15/06/2026', location: 'Sài Gòn', status: 'upcoming', participants: 48 },
  { name: 'Cúp Mùa Hè', date: '20/07/2026', location: 'Hà Nội', status: 'preparing', participants: 32 },
  { name: 'Giải Thiếu Niên', date: '10/08/2026', location: 'Đà Nẵng', status: 'preparing', participants: 24 },
  { name: 'Cúp Mùa Thu', date: '05/09/2026', location: 'Hải Phòng', status: 'preparing', participants: 40 },
];

const recentActivities = [
  { icon: CheckCircle, title: 'Đã duyệt đăng ký', desc: 'Ngựa: Thunder Bolt (ID: #4021)', time: '5 phút trước', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  { icon: Megaphone, title: 'Công bố kết quả', desc: 'Vòng Final — Cúp Mùa Xuân', time: '1 giờ trước', iconColor: 'text-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/20' },
  { icon: PlusCircle, title: 'Tạo giải đấu mới', desc: 'Cúp Mùa Hè 2026', time: '2 giờ trước', iconColor: 'text-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/20' },
  { icon: UserPlus, title: 'Người dùng mới đăng ký', desc: 'nguyen.van.a@email.com', time: '3 giờ trước', iconColor: 'text-purple-500', iconBg: 'bg-purple-100 dark:bg-purple-900/20' },
];

const statusMap: Record<string, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
  upcoming: { label: 'Sắp diễn ra', textClass: 'text-blue-700 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/20', dotClass: 'bg-blue-500' },
  preparing: { label: 'Chuẩn bị', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-900/20', dotClass: 'bg-amber-500' },
  active: { label: 'Đang diễn ra', textClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20', dotClass: 'bg-emerald-500' },
};

export default function Dashboard() {
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="mx-auto max-w-7xl pb-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-slate-800 dark:bg-[#151c2c]"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${s.gradient} rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg} shadow-inner`}>
                    <Icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    s.up ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30'
                  }`}>
                    {s.up ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                    {s.change}
                  </div>
                </div>
                
                <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                  {s.value}
                </h4>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{s.label}</span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">{s.sub}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c2c]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tăng trưởng người dùng</h3>
              <p className="text-sm font-medium text-slate-500">Số lượng đăng ký mới trong 7 tháng qua</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors">
              Năm nay
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-colors-white, #fff)', color: '#0f172a' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="users" name="Người dùng" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c2c] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hoạt động mới</h3>
              <p className="text-sm font-medium text-slate-500">Nhật ký hệ thống</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
            {recentActivities.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex gap-4 relative group">
                  {i !== recentActivities.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-[-24px] w-[2px] bg-slate-100 dark:bg-slate-800/80 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"></div>
                  )}
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.iconBg} border-[3px] border-white dark:border-[#151c2c]`}>
                    <Icon className={`h-4 w-4 ${a.iconColor}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pb-1">
                    <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">{a.title}</h5>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{a.desc}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-slate-400">{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white">
            Xem toàn bộ nhật ký
          </button>
        </motion.div>
      </div>

      {/* Upcoming Tournaments Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c2c] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Giải đấu sắp diễn ra</h3>
              <p className="text-sm font-medium text-slate-500">Quản lý lịch trình các giải đấu tới</p>
            </div>
          </div>
          <button className="hidden sm:flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow">
            Quản lý giải đấu
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#111724]">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Tên giải đấu</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Thời gian</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Địa điểm</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Tham gia</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {upcomingTournaments.map((t, i) => {
                const st = statusMap[t.status];
                return (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                      {t.date}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                      {t.location}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                        <Users size={14} className="text-slate-400" />
                        {t.participants} ngựa
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${st.bgClass} ${st.textClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}></span>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all dark:hover:bg-blue-900/30 dark:hover:text-blue-400">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
