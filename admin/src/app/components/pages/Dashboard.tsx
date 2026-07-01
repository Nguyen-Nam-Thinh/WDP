import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { userApi } from '../../api/user';
import { tournamentApi } from '../../api/tournament';
import { registrationApi } from '../../api/registration';
import { raceApi } from '../../api/race';

const chartData = [
  { name: 'Th 1', users: 400, revenue: 240 },
  { name: 'Th 2', users: 300, revenue: 139 },
  { name: 'Th 3', users: 550, revenue: 380 },
  { name: 'Th 4', users: 450, revenue: 390 },
  { name: 'Th 5', users: 700, revenue: 480 },
  { name: 'Th 6', users: 850, revenue: 600 },
  { name: 'Th 7', users: 1245, revenue: 850 },
];

const recentActivities = [
  { icon: CheckCircle, title: 'Đã duyệt đăng ký', desc: 'Ngựa: Thunder Bolt (ID: #4021)', time: '5 phút trước', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  { icon: Megaphone, title: 'Công bố kết quả', desc: 'Vòng Final — Cúp Mùa Xuân', time: '1 giờ trước', iconColor: 'text-blue-600', iconBg: 'bg-blue-100' },
  { icon: PlusCircle, title: 'Tạo giải đấu mới', desc: 'Cúp Mùa Hè 2026', time: '2 giờ trước', iconColor: 'text-amber-600', iconBg: 'bg-amber-100' },
  { icon: UserPlus, title: 'Người dùng mới', desc: 'nguyen.van.a@email.com', time: '3 giờ trước', iconColor: 'text-purple-600', iconBg: 'bg-purple-100' },
];

const statusMap: Record<string, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
  upcoming: { label: 'Sắp diễn ra', textClass: 'text-blue-700', bgClass: 'bg-blue-50', dotClass: 'bg-blue-500' },
  preparing: { label: 'Chuẩn bị', textClass: 'text-amber-700', bgClass: 'bg-amber-50', dotClass: 'bg-amber-500' },
  ongoing: { label: 'Đang diễn ra', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', dotClass: 'bg-emerald-500' },
  active: { label: 'Đang diễn ra', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', dotClass: 'bg-emerald-500' },
  finished: { label: 'Đã kết thúc', textClass: 'text-slate-700', bgClass: 'bg-slate-50', dotClass: 'bg-slate-400' },
};

interface DashboardStats {
  totalUsers: number;
  ongoingTournaments: number;
  activeRegistrations: number;
  pendingRaces: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [usersRes, ongoingRes, upcomingTRes, regsRes, racesOpenRes] = await Promise.all([
          userApi.getUsers({ page: 1, limit: 1 }),
          tournamentApi.list(1, 1, 'ongoing'),
          tournamentApi.list(1, 5),
          registrationApi.list({ page: 1, limit: 1, status: 'active' }),
          raceApi.list({ status: 'open', page: 1, limit: 1 }),
        ]);
        setStats({
          totalUsers: usersRes.total,
          ongoingTournaments: ongoingRes.total,
          activeRegistrations: regsRes.total,
          pendingRaces: racesOpenRes.total,
        });
        setUpcomingTournaments(upcomingTRes.tournaments.slice(0, 4));
      } catch {
        /* ignore errors */
      } finally {
        setLoadingStats(false);
        setLoadingTournaments(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: loadingStats ? '...' : (stats?.totalUsers ?? 0).toLocaleString('vi-VN'),
      change: 'Tăng 12%',
      up: true,
      icon: Users,
      onClick: () => navigate('/users'),
    },
    {
      label: 'Giải đấu đang diễn ra',
      value: loadingStats ? '...' : (stats?.ongoingTournaments ?? 0).toString(),
      change: 'Hoạt động',
      up: true,
      icon: Trophy,
      onClick: () => navigate('/tournaments'),
    },
    {
      label: 'Đăng ký chờ duyệt',
      value: loadingStats ? '...' : (stats?.activeRegistrations ?? 0).toLocaleString('vi-VN'),
      change: 'Mới',
      up: true,
      icon: Flag,
      onClick: () => navigate('/registrations'),
    },
    {
      label: 'Cuộc đua mở ĐK',
      value: loadingStats ? '...' : (stats?.pendingRaces ?? 0).toString(),
      change: 'Cần chú ý',
      up: false,
      icon: ClipboardList,
      onClick: () => navigate('/races'),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={i}
              onClick={s.onClick}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                  {loadingStats ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                  s.up ? 'text-emerald-700 bg-emerald-50' : 'text-orange-700 bg-orange-50'
                }`}>
                  {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {s.change}
                </div>
              </div>

              <div>
                <h4 className="text-2xl font-bold text-slate-900 leading-tight">
                  {s.value}
                </h4>
                <span className="text-xs font-medium text-slate-500 mt-1 block">{s.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Tăng trưởng người dùng</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Thống kê đăng ký 7 tháng qua</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-md bg-white px-2 py-1 text-slate-600 focus:outline-none focus:border-blue-500">
              <option>Năm nay</option>
              <option>Năm ngoái</option>
            </select>
          </div>
          <div className="h-[260px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800">Nhật ký hệ thống</h3>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {recentActivities.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex gap-3 relative">
                  {i !== recentActivities.length - 1 && (
                    <div className="absolute left-3.5 top-8 bottom-[-16px] w-[1px] bg-slate-100"></div>
                  )}
                  <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${a.iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${a.iconColor}`} />
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-[13px] font-semibold text-slate-800">{a.title}</h5>
                      <span className="text-[10px] text-slate-400">{a.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/registrations')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Xem tất cả <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>

      {/* Upcoming Tournaments Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Giải đấu gần đây</h3>
          </div>
          <button
            onClick={() => navigate('/tournaments')}
            className="hidden sm:flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Quản lý <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          {loadingTournaments ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
          ) : upcomingTournaments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Chưa có giải đấu nào</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">Tên giải đấu</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">Thời gian</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">Địa điểm</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">Trạng thái</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingTournaments.map((t, i) => {
                  const st = statusMap[t.status] ?? statusMap.upcoming;
                  return (
                    <tr key={t._id ?? i} className="hover:bg-slate-50/50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group cursor-pointer bg-white">
                      <td className="px-5 py-3 font-medium text-slate-800 text-[13px]">
                        {t.name}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-[13px]">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '-'}
                        {t.endDate ? ` — ${new Date(t.endDate).toLocaleDateString('vi-VN')}` : ''}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-[13px]">
                        {t.location || '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold border ${st.bgClass} ${st.textClass} border-${st.bgClass.split('-')[1]}-200`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => navigate('/tournaments')}
                          className="opacity-0 group-hover:opacity-100 text-xs font-medium text-blue-600 hover:text-blue-800 transition-all"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
