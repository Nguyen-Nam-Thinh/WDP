import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Trophy, Flag, ClipboardList, TrendingUp, MoreHorizontal, RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi, DashboardData } from '../../api/dashboard';

const COLORS: Record<string, string> = {
  ongoing: '#10b981',
  upcoming: '#3b82f6',
  preparing: '#f59e0b',
  finished: '#64748b',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Đang diễn ra',
  upcoming: 'Sắp diễn ra',
  preparing: 'Chuẩn bị',
  finished: 'Đã kết thúc',
  cancelled: 'Đã hủy',
};

const STATUS_TABLE: Record<string, { label: string; textClass: string; bgClass: string }> = {
  ongoing:  { label: 'Đang diễn ra', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
  upcoming: { label: 'Sắp diễn ra',  textClass: 'text-blue-700',    bgClass: 'bg-blue-50'    },
  finished: { label: 'Đã kết thúc',  textClass: 'text-slate-700',   bgClass: 'bg-slate-50'   },
  cancelled:{ label: 'Đã hủy',       textClass: 'text-red-700',     bgClass: 'bg-red-50'     },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('year');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.getAdminDashboard(currentYear, period);
        setData(res);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const statCards = [
    { label: 'Tổng người dùng',       value: loading ? '...' : (data?.stats.totalUsers ?? 0).toLocaleString('vi-VN'), change: 'Toàn hệ thống', icon: Users,        onClick: () => navigate('/users')         },
    { label: 'Giải đấu đang diễn ra', value: loading ? '...' : (data?.stats.ongoingTournaments ?? 0).toString(),      change: 'Hoạt động',     icon: Trophy,       onClick: () => navigate('/tournaments')    },
    { label: 'Đăng ký chờ duyệt',     value: loading ? '...' : (data?.stats.activeRegistrations ?? 0).toLocaleString('vi-VN'), change: 'Cần chú ý', icon: Flag,  onClick: () => navigate('/registrations')  },
    { label: 'Chặng đua mở ĐK',       value: loading ? '...' : (data?.stats.pendingRaces ?? 0).toString(),            change: 'Đang mở',       icon: ClipboardList, onClick: () => navigate('/races')         },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-8">
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
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                  <TrendingUp size={12} />
                  {s.change}
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900 leading-tight">{s.value}</h4>
                <span className="text-xs font-medium text-slate-500 mt-1 block">{s.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Tăng trưởng người dùng</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {period === 'week' ? 'Thống kê 7 ngày gần nhất' : period === 'month' ? 'Thống kê đăng ký trong tháng này' : 'Thống kê đăng ký trong năm nay'}
              </p>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['week', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px] w-full flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={period === 'year' ? 0 : 'preserveStartEnd'} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 500, padding: '8px 12px' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  itemStyle={{ color: '#2563eb', fontWeight: 600, padding: 0 }}
                />
                <Area type="monotone" dataKey="users" name="Người dùng mới" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorUsers)" activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800">Trạng thái giải đấu</h3>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
              </div>
            ) : !data?.tournamentChartData || data.tournamentChartData.every(d => d.value === 0) ? (
              <div className="text-center text-xs text-slate-500 py-8">Chưa có dữ liệu giải đấu</div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.tournamentChartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none" animationDuration={1000}>
                      {data.tournamentChartData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [value, STATUS_LABELS[name] || name]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      iconType="circle" 
                      wrapperStyle={{ paddingTop: '12px' }}
                      formatter={(value) => <span className="text-[11px] text-slate-600 font-medium ml-1 mr-2">{STATUS_LABELS[value] || value}</span>} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Giải đấu gần đây</h3>
          <button
            onClick={() => navigate('/tournaments')}
            className="hidden sm:flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Quản lý <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
          ) : !data?.upcomingTournaments?.length ? (
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
                {data.upcomingTournaments.map((t, i) => {
                  const st = STATUS_TABLE[t.status] ?? { label: t.status, textClass: 'text-slate-700', bgClass: 'bg-slate-50' };
                  return (
                    <tr key={t._id ?? i} className="hover:bg-slate-50/50 transition-all duration-200 group cursor-pointer bg-white">
                      <td className="px-5 py-3 font-medium text-slate-800 text-[13px]">{t.name}</td>
                      <td className="px-5 py-3 text-slate-600 text-[13px]">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '-'}
                        {t.endDate ? ` — ${new Date(t.endDate).toLocaleDateString('vi-VN')}` : ''}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-[13px]">{t.location || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${st.bgClass} ${st.textClass}`}>
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
