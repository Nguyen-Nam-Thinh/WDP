import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Filter,
  Search,
  Clock,
  Medal,
  Eye,
  X,
  Shield,
  Award,
  Flag,
  Zap,
  Info,
  Play,
  CheckCircle2,
  CircleDot,
  Circle,
  Tv,
  Wind,
  Target,
  BarChart3,
  Hourglass,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';


// ─── Data ────────────────────────────────────────────────────────────────────

const tournaments = [
  {
    id: 1,
    name: 'Giải Hoàng Gia 2026',
    subtitle: 'Giải đấu đỉnh cao của mùa giải',
    status: 'live',
    category: 'Vô Địch Quốc Gia',
    tier: 'PREMIER',
    location: 'Trường Đua Phú Thọ, TP.HCM',
    address: '1 Lữ Gia, Phường 15, Quận 11, TP.HCM',
    date: '25/05/2026',
    time: '14:00',
    endTime: '18:00',
    prize: '500,000,000 VNĐ',
    prizeShort: '500M',
    participants: 16,
    rounds: 4,
    currentRound: 3,
    distance: '2400m',
    surface: 'Cỏ tự nhiên',
    weather: 'Nắng, 28°C, gió nhẹ',
    viewers: 12405,
    gradientFrom: '#F59E0B',
    gradientTo: '#EF4444',
    badge: 'TRỰC TIẾP',
    image: 'https://images.unsplash.com/photo-1613085411234-9c83af5562d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    organizer: 'Liên Đoàn Đua Ngựa Việt Nam',
    sponsor: 'VietRace Corp & HDFC Bank',
    referee: 'Ông Trần Đức Anh',
    description: 'Giải Hoàng Gia 2026 là đỉnh cao của làng đua ngựa Việt Nam, quy tụ 16 con ngựa xuất sắc nhất và các kỵ sĩ tài năng nhất cả nước trong cuộc tranh tài kịch tính trên đường đua dài 2400m tại Trường Đua danh tiếng Phú Thọ.',
    totalPrize: '500,000,000 VNĐ',
    firstPrize: '300,000,000 VNĐ',
    secondPrize: '120,000,000 VNĐ',
    thirdPrize: '80,000,000 VNĐ',
    horses: [
      { pos: 1, name: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', owner: 'Nguyễn Minh Tâm', weight: '58kg', odds: 2.5, form: [1,1,2,1], color: '#F59E0B', number: 1, age: 5, nationality: 'VN', wins: 12 },
      { pos: 2, name: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', owner: 'Trần Gia Bảo', weight: '56kg', odds: 3.8, form: [2,1,1,3], color: '#6366F1', number: 2, age: 6, nationality: 'VN', wins: 9 },
      { pos: 3, name: 'Thần Gió', jockey: 'Lê Văn Cường', owner: 'Lê Công Vinh', weight: '57kg', odds: 5.0, form: [3,2,1,2], color: '#CD7F32', number: 3, age: 4, nationality: 'JP', wins: 7 },
      { pos: 4, name: 'Móng Vàng', jockey: 'Phạm Minh Đức', owner: 'Phạm Thái Sơn', weight: '55kg', odds: 12.0, form: [1,3,4,1], color: '#10B981', number: 4, age: 5, nationality: 'VN', wins: 5 },
      { pos: 5, name: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', owner: 'Hoàng Văn Nam', weight: '59kg', odds: 15.0, form: [4,4,3,5], color: '#EF4444', number: 5, age: 7, nationality: 'AU', wins: 4 },
      { pos: 6, name: 'Bão Tốc', jockey: 'Ngô Thị Phương', owner: 'Vũ Đình Hùng', weight: '56kg', odds: 18.0, form: [2,5,2,4], color: '#8B5CF6', number: 6, age: 4, nationality: 'VN', wins: 6 },
    ],
    roundResults: [
      { round: 1, winner: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', time: '2:24.3', date: '25/05/2026 14:15', status: 'done', topThree: ['Tia Chớp', 'Ngôi Sao Đêm', 'Thần Gió'] },
      { round: 2, winner: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', time: '2:26.1', date: '25/05/2026 15:00', status: 'done', topThree: ['Ngôi Sao Đêm', 'Bão Tốc', 'Tia Chớp'] },
      { round: 3, winner: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', time: '—', date: '25/05/2026 15:45', status: 'live', topThree: [] },
      { round: 4, winner: '—', jockey: '—', time: '—', date: '25/05/2026 16:30', status: 'pending', topThree: [] },
    ],
    schedule: [
      { time: '13:30', event: 'Mở cổng, đón khán giả', icon: 'gate' },
      { time: '14:00', event: 'Khai mạc, giới thiệu ngựa & kỵ sĩ', icon: 'ceremony' },
      { time: '14:15', event: 'Vòng 1 — Vòng loại', icon: 'race' },
      { time: '15:00', event: 'Vòng 2 — Bán kết A', icon: 'race' },
      { time: '15:45', event: 'Vòng 3 — Bán kết B (ĐANG DIỄN RA)', icon: 'race' },
      { time: '16:30', event: 'Vòng 4 — Chung kết', icon: 'final' },
      { time: '17:30', event: 'Lễ trao giải', icon: 'award' },
    ],
    rules: [
      'Mỗi ngựa tham gia tối đa 2 vòng đấu',
      'Trọng lượng kỵ sĩ tối thiểu 55kg, tối đa 60kg',
      'Khoảng cách an toàn giữa các ngựa tối thiểu 1m',
      'Kết quả dựa trên thời gian về đích chính xác đến 0.01 giây',
      'Ngựa vi phạm sẽ bị loại khỏi vòng đấu đó',
    ]
  },
  {
    id: 2,
    name: 'Cup Mùa Hè 2026',
    subtitle: 'Giải đấu hấp dẫn dành cho các tay đua trẻ',
    status: 'upcoming',
    category: 'Hạng A',
    tier: 'CLASSIC',
    location: 'Trường Đua Đại Nam, Bình Dương',
    address: 'Khu Du Lịch Đại Nam, Bình Dương',
    date: '01/06/2026',
    time: '09:00',
    endTime: '13:00',
    prize: '200,000,000 VNĐ',
    prizeShort: '200M',
    participants: 12,
    rounds: 3,
    currentRound: 0,
    distance: '1800m',
    surface: 'Đất nén',
    weather: 'Dự báo: Mây rải rác, 26°C',
    viewers: 0,
    gradientFrom: '#3B82F6',
    gradientTo: '#06B6D4',
    badge: 'SẮP DIỄN RA',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    organizer: 'CLB Đua Ngựa Bình Dương',
    sponsor: 'Bình Dương FC & SunLife',
    referee: 'Bà Nguyễn Thị Mai',
    description: 'Cup Mùa Hè 2026 là sân chơi lý tưởng cho những kỵ sĩ trẻ đang trên đà phát triển. Với khoảng cách đua 1800m trên đường đất nén, đây là thử thách hoàn hảo để các tài năng mới trổ bổ tài năng.',
    totalPrize: '200,000,000 VNĐ',
    firstPrize: '120,000,000 VNĐ',
    secondPrize: '50,000,000 VNĐ',
    thirdPrize: '30,000,000 VNĐ',
    horses: [
      { pos: 1, name: 'Bão Tốc', jockey: 'Ngô Thị Phương', owner: 'Vũ Đình Hùng', weight: '56kg', odds: 2.1, form: [1,2,1,1], color: '#8B5CF6', number: 1, age: 4, nationality: 'VN', wins: 6 },
      { pos: 2, name: 'Hổ Phong', jockey: 'Dương Minh Giang', owner: 'Đinh Quốc Bảo', weight: '57kg', odds: 3.5, form: [2,1,2,2], color: '#3B82F6', number: 2, age: 6, nationality: 'VN', wins: 4 },
      { pos: 3, name: 'Long Mã', jockey: 'Lý Hữu Hùng', owner: 'Bùi Thanh Hải', weight: '55kg', odds: 6.0, form: [3,3,3,1], color: '#10B981', number: 3, age: 5, nationality: 'KR', wins: 3 },
      { pos: 4, name: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', owner: 'Nguyễn Minh Tâm', weight: '58kg', odds: 8.0, form: [1,2,1,3], color: '#F59E0B', number: 4, age: 5, nationality: 'VN', wins: 12 },
    ],
    roundResults: [
      { round: 1, winner: '—', jockey: '—', time: '—', date: '01/06/2026 09:15', status: 'pending', topThree: [] },
      { round: 2, winner: '—', jockey: '—', time: '—', date: '01/06/2026 10:30', status: 'pending', topThree: [] },
      { round: 3, winner: '—', jockey: '—', time: '—', date: '01/06/2026 11:45', status: 'pending', topThree: [] },
    ],
    schedule: [
      { time: '08:30', event: 'Mở cổng, đón khán giả', icon: 'gate' },
      { time: '09:00', event: 'Khai mạc & giới thiệu', icon: 'ceremony' },
      { time: '09:15', event: 'Vòng 1', icon: 'race' },
      { time: '10:30', event: 'Vòng 2 — Bán kết', icon: 'race' },
      { time: '11:45', event: 'Vòng 3 — Chung kết', icon: 'final' },
      { time: '12:30', event: 'Lễ trao giải', icon: 'award' },
    ],
    rules: [
      'Mỗi ngựa tham gia tối đa 2 vòng đấu',
      'Trọng lượng kỵ sĩ tối thiểu 55kg',
      'Kết quả dựa trên thời gian về đích',
    ]
  },
  {
    id: 3,
    name: 'Giải Trẻ Năng Động',
    subtitle: 'Sân chơi cho ngựa dưới 4 tuổi và kỵ sĩ mới',
    status: 'upcoming',
    category: 'Hạng B',
    tier: 'JUNIOR',
    location: 'Trường Đua Phú Thọ, TP.HCM',
    address: '1 Lữ Gia, Phường 15, Quận 11, TP.HCM',
    date: '08/06/2026',
    time: '08:00',
    endTime: '12:00',
    prize: '100,000,000 VNĐ',
    prizeShort: '100M',
    participants: 20,
    rounds: 5,
    currentRound: 0,
    distance: '1200m',
    surface: 'Cỏ nhân tạo',
    weather: 'Dự báo: Nắng đẹp, 27°C',
    viewers: 0,
    gradientFrom: '#10B981',
    gradientTo: '#059669',
    badge: 'SẮP DIỄN RA',
    image: 'https://images.unsplash.com/photo-1546700990-7b6416f2d90c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    organizer: 'Hội Đua Ngựa TP.HCM',
    sponsor: 'Saigon Horse Club',
    referee: 'Ông Lê Minh Trí',
    description: 'Giải Trẻ Năng Động là cơ hội hoàn hảo cho những ngựa trẻ và kỵ sĩ mới ra mắt. Cuộc đua 1200m trên cỏ nhân tạo là nơi ươm mầm tài năng cho tương lai của làng đua ngựa Việt Nam.',
    totalPrize: '100,000,000 VNĐ',
    firstPrize: '60,000,000 VNĐ',
    secondPrize: '25,000,000 VNĐ',
    thirdPrize: '15,000,000 VNĐ',
    horses: [
      { pos: 1, name: 'Gió Xuân', jockey: 'Trần Thị Lan', owner: 'Nguyễn Hải Long', weight: '55kg', odds: 1.9, form: [1,1,2,1], color: '#10B981', number: 1, age: 3, nationality: 'VN', wins: 3 },
      { pos: 2, name: 'Sét Đánh', jockey: 'Nguyễn Tuấn Anh', owner: 'Trần Gia Phát', weight: '56kg', odds: 3.2, form: [2,2,1,2], color: '#F97316', number: 2, age: 4, nationality: 'VN', wins: 2 },
      { pos: 3, name: 'Nắng Hạ', jockey: 'Lê Thị Hoa', owner: 'Phạm Văn Đức', weight: '55kg', odds: 4.5, form: [3,1,3,3], color: '#EAB308', number: 3, age: 3, nationality: 'VN', wins: 1 },
    ],
    roundResults: [],
    schedule: [
      { time: '07:30', event: 'Mở cổng', icon: 'gate' },
      { time: '08:00', event: 'Khai mạc', icon: 'ceremony' },
      { time: '08:15', event: 'Vòng 1–3 (vòng loại)', icon: 'race' },
      { time: '10:00', event: 'Vòng 4 — Bán kết', icon: 'race' },
      { time: '11:00', event: 'Vòng 5 — Chung kết', icon: 'final' },
      { time: '11:45', event: 'Lễ trao giải', icon: 'award' },
    ],
    rules: ['Chỉ dành cho ngựa dưới 4 tuổi', 'Kỵ sĩ mới tham gia dưới 3 năm kinh nghiệm', 'Cự ly tối đa 1200m']
  },
  {
    id: 4,
    name: 'Đại Giải Cuối Năm',
    subtitle: 'Siêu giải đấu — Tổng giải thưởng 1 tỷ đồng',
    status: 'upcoming',
    category: 'Vô Địch Quốc Gia',
    tier: 'GRAND PRIX',
    location: 'Trường Đua Đại Nam, Bình Dương',
    address: 'Khu Du Lịch Đại Nam, Bình Dương',
    date: '15/12/2026',
    time: '10:00',
    endTime: '17:00',
    prize: '1,000,000,000 VNĐ',
    prizeShort: '1 TỶ',
    participants: 24,
    rounds: 6,
    currentRound: 0,
    distance: '3200m',
    surface: 'Cỏ tự nhiên cao cấp',
    weather: 'Chưa có dự báo',
    viewers: 0,
    gradientFrom: '#7C3AED',
    gradientTo: '#DB2777',
    badge: 'ĐẶC BIỆT',
    image: 'https://images.unsplash.com/photo-1597328974404-0b7e77dc8abc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    organizer: 'Liên Đoàn Đua Ngựa Việt Nam',
    sponsor: 'VietRace Corp, BIDV & VinGroup',
    referee: 'Hội đồng trọng tài 5 người',
    description: 'Đại Giải Cuối Năm là sự kiện thể thao đỉnh cao nhất của Việt Nam, với tổng giải thưởng lên đến 1 tỷ đồng. Đây là sân khấu để các tên tuổi lớn nhất của làng đua ngựa khẳng định vị thế và viết nên lịch sử.',
    totalPrize: '1,000,000,000 VNĐ',
    firstPrize: '600,000,000 VNĐ',
    secondPrize: '250,000,000 VNĐ',
    thirdPrize: '150,000,000 VNĐ',
    horses: [],
    roundResults: [],
    schedule: [
      { time: '09:30', event: 'Mở cổng VIP', icon: 'gate' },
      { time: '10:00', event: 'Lễ khai mạc hoành tráng', icon: 'ceremony' },
      { time: '10:30', event: 'Vòng 1–4 (vòng loại)', icon: 'race' },
      { time: '14:00', event: 'Vòng 5 — Bán kết', icon: 'race' },
      { time: '15:30', event: 'Vòng 6 — Đại Chung Kết', icon: 'final' },
      { time: '16:30', event: 'Lễ trao giải & bế mạc', icon: 'award' },
    ],
    rules: [
      'Đăng ký trước 30/11/2026',
      'Phí đăng ký: 5,000,000 VNĐ/ngựa',
      'Kỵ sĩ phải có tối thiểu 3 năm kinh nghiệm',
      'Ngựa phải được kiểm tra sức khỏe 7 ngày trước giải',
    ]
  },
  {
    id: 5,
    name: 'Giải Miền Bắc Lần 3',
    subtitle: 'Giải đấu truyền thống của khu vực phía Bắc',
    status: 'finished',
    category: 'Hạng A',
    tier: 'CLASSIC',
    location: 'Trường Đua Hà Nội',
    address: 'Trường Đua Ngựa Hà Nội, Gia Lâm, Hà Nội',
    date: '10/05/2026',
    time: '09:00',
    endTime: '14:00',
    prize: '300,000,000 VNĐ',
    prizeShort: '300M',
    participants: 14,
    rounds: 4,
    currentRound: 4,
    distance: '2000m',
    surface: 'Đất nén',
    weather: 'Mây một phần, 22°C',
    viewers: 8320,
    gradientFrom: '#64748B',
    gradientTo: '#475569',
    badge: 'ĐÃ KẾT THÚC',
    image: 'https://images.unsplash.com/photo-1574316618822-56a4a2cc5c6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    organizer: 'Liên Đoàn Đua Ngựa Miền Bắc',
    sponsor: 'Hà Nội Motor & TPBank',
    referee: 'Ông Phạm Đức Thắng',
    description: 'Giải Miền Bắc Lần 3 đã khép lại với màn trình diễn xuất sắc của Tia Chớp và kỵ sĩ Nguyễn Văn Anh. Đây là lần thứ 3 Tia Chớp giành ngôi vô địch tại Hà Nội.',
    totalPrize: '300,000,000 VNĐ',
    firstPrize: '180,000,000 VNĐ',
    secondPrize: '75,000,000 VNĐ',
    thirdPrize: '45,000,000 VNĐ',
    horses: [
      { pos: 1, name: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', owner: 'Nguyễn Minh Tâm', weight: '58kg', odds: 2.2, form: [1,1,1,1], color: '#F59E0B', number: 1, age: 5, nationality: 'VN', wins: 12 },
      { pos: 2, name: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', owner: 'Trần Gia Bảo', weight: '56kg', odds: 3.5, form: [2,2,2,2], color: '#6366F1', number: 2, age: 6, nationality: 'VN', wins: 9 },
      { pos: 3, name: 'Thần Gió', jockey: 'Lê Văn Cường', owner: 'Lê Công Vinh', weight: '57kg', odds: 4.8, form: [3,3,3,3], color: '#CD7F32', number: 3, age: 4, nationality: 'JP', wins: 7 },
    ],
    roundResults: [
      { round: 1, winner: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', time: '2:18.4', date: '10/05/2026 09:30', status: 'done', topThree: ['Tia Chớp', 'Ngôi Sao Đêm', 'Thần Gió'] },
      { round: 2, winner: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', time: '2:19.1', date: '10/05/2026 10:30', status: 'done', topThree: ['Tia Chớp', 'Thần Gió', 'Ngôi Sao Đêm'] },
      { round: 3, winner: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', time: '2:20.5', date: '10/05/2026 11:30', status: 'done', topThree: ['Ngôi Sao Đêm', 'Tia Chớp', 'Thần Gió'] },
      { round: 4, winner: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', time: '2:17.8', date: '10/05/2026 13:00', status: 'done', topThree: ['Tia Chớp', 'Ngôi Sao Đêm', 'Thần Gió'] },
    ],
    schedule: [],
    rules: []
  },
  {
    id: 6,
    name: 'Tranh Tài Mùa Xuân',
    subtitle: 'Khai xuân với những màn đua kịch tính',
    status: 'finished',
    category: 'Hạng B',
    tier: 'CLASSIC',
    location: 'Trường Đua Phú Thọ, TP.HCM',
    address: '1 Lữ Gia, Phường 15, Quận 11, TP.HCM',
    date: '20/04/2026',
    time: '08:30',
    endTime: '12:30',
    prize: '150,000,000 VNĐ',
    prizeShort: '150M',
    participants: 18,
    rounds: 5,
    currentRound: 5,
    distance: '1600m',
    surface: 'Cỏ tự nhiên',
    weather: 'Nắng, 30°C',
    viewers: 5890,
    gradientFrom: '#64748B',
    gradientTo: '#475569',
    badge: 'ĐÃ KẾT THÚC',
    image: 'https://images.unsplash.com/photo-1613085411234-9c83af5562d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    organizer: 'CLB Đua Ngựa TP.HCM',
    sponsor: 'Saigon Horse Club & Techcombank',
    referee: 'Bà Vũ Thị Thanh',
    description: 'Tranh Tài Mùa Xuân 2026 đã mang đến những màn đua kịch tính và đầy cảm xúc. Vinh Quang Đỏ đã giành chiến thắng cuối cùng sau cuộc tranh tài gay cấn với Bão Tốc trong suốt 5 vòng đua.',
    totalPrize: '150,000,000 VNĐ',
    firstPrize: '90,000,000 VNĐ',
    secondPrize: '37,500,000 VNĐ',
    thirdPrize: '22,500,000 VNĐ',
    horses: [
      { pos: 1, name: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', owner: 'Hoàng Văn Nam', weight: '59kg', odds: 3.1, form: [1,2,1,1,1], color: '#EF4444', number: 1, age: 7, nationality: 'AU', wins: 4 },
      { pos: 2, name: 'Bão Tốc', jockey: 'Ngô Thị Phương', owner: 'Vũ Đình Hùng', weight: '56kg', odds: 4.2, form: [2,1,2,2,2], color: '#8B5CF6', number: 2, age: 4, nationality: 'VN', wins: 6 },
    ],
    roundResults: [
      { round: 1, winner: 'Bão Tốc', jockey: 'Ngô Thị Phương', time: '1:54.2', date: '20/04/2026 08:45', status: 'done', topThree: ['Bão Tốc', 'Vinh Quang Đỏ'] },
      { round: 2, winner: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', time: '1:52.8', date: '20/04/2026 09:30', status: 'done', topThree: ['Vinh Quang Đỏ', 'Bão Tốc'] },
      { round: 3, winner: 'Bão Tốc', jockey: 'Ngô Thị Phương', time: '1:53.5', date: '20/04/2026 10:15', status: 'done', topThree: ['Bão Tốc', 'Vinh Quang Đỏ'] },
      { round: 4, winner: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', time: '1:51.9', date: '20/04/2026 11:00', status: 'done', topThree: ['Vinh Quang Đỏ', 'Bão Tốc'] },
      { round: 5, winner: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', time: '1:50.4', date: '20/04/2026 11:45', status: 'done', topThree: ['Vinh Quang Đỏ', 'Bão Tốc'] },
    ],
    schedule: [],
    rules: []
  }
];

const categories = ['Tất Cả', 'Vô Địch Quốc Gia', 'Hạng A', 'Hạng B'];
const statusFilters = [
  { label: 'Tất Cả', value: 'all' },
  { label: 'Đang Diễn Ra', value: 'live' },
  { label: 'Sắp Tới', value: 'upcoming' },
  { label: 'Đã Kết Thúc', value: 'finished' },
];

type Tournament = typeof tournaments[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status, badge }: { status: string; badge: string }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {badge}
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-blue-600/90 text-white">
        <Clock className="w-3 h-3" />
        {badge}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-slate-600/90 text-slate-200">
      <CheckCircle2 className="w-3 h-3" />
      {badge}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    'GRAND PRIX': 'bg-gradient-to-r from-violet-600 to-pink-600 text-white',
    'PREMIER': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    'CLASSIC': 'bg-slate-700/80 text-slate-300',
    'JUNIOR': 'bg-emerald-700/60 text-emerald-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-widest ${map[tier] || 'bg-slate-700 text-slate-300'}`}>
      {tier}
    </span>
  );
}

function FormDot({ pos }: { pos: number }) {
  const cls =
    pos === 1 ? 'bg-emerald-500 text-white' :
    pos === 2 ? 'bg-blue-500 text-white' :
    pos === 3 ? 'bg-amber-500 text-white' :
    'bg-slate-700 text-slate-400';
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${cls}`}>
      {pos}
    </div>
  );
}

// ─── Detail Full Page ─────────────────────────────────────────────────────────

function TournamentDetail({ t, onClose }: { t: Tournament; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'horses' | 'rounds' | 'schedule' | 'prize'>('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  const tabs = [
    { key: 'overview', label: 'Tổng Quan', icon: Info },
    { key: 'horses', label: `Ngựa Đua`, icon: Zap },
    { key: 'rounds', label: 'Kết Quả', icon: BarChart3 },
    { key: 'schedule', label: 'Lịch Trình', icon: Calendar },
    { key: 'prize', label: 'Giải Thưởng', icon: Trophy },
  ] as const;

  const topHorse = t.horses.find(h => h.pos === 1);

  return (
    <div
      className="min-h-screen bg-[#09090F] text-slate-200"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(16px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-50 border-b border-white/8" style={{ backgroundColor: '#09090FEE', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Danh Sách Giải Đấu
          </button>

          {/* Center: tournament name */}
          <div className="flex items-center gap-3 truncate">
            <StatusBadge status={t.status} badge={t.badge} />
            <span className="font-black text-white text-base truncate hidden sm:inline">{t.name}</span>
          </div>

          {/* Right: live viewers */}
          {t.status === 'live' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">{t.viewers.toLocaleString()} xem</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Full content wrapper ── */}
      <div className="max-w-7xl mx-auto px-6 py-0">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden" style={{ height: '420px' }}>
        <img
          src={t.image}
          alt={t.name}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.45)' }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090F]/60 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: `linear-gradient(135deg, ${t.gradientFrom}40, ${t.gradientTo}20)` }}
        />

        {/* Content over hero */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-10">
          <div className="flex items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <TierBadge tier={t.tier} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.gradientFrom }}>{t.category}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-2">{t.name}</h1>
              <p className="text-base text-slate-300">{t.subtitle}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{t.location}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{t.date} · {t.time}</span>
              </div>
            </div>
            {/* Prize highlight */}
            <div
              className="hidden md:flex flex-col items-center justify-center px-8 py-6 rounded-2xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${t.gradientFrom}30, ${t.gradientTo}20)`, border: `1px solid ${t.gradientFrom}40` }}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Giải Thưởng</div>
              <div className="text-3xl font-black" style={{ color: t.gradientFrom }}>{t.prizeShort}</div>
              <div className="text-xs text-slate-500">VNĐ</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-b border-white/8">
        {[
          { label: 'Ngựa Đua', value: `${t.participants} con`, icon: Users, color: t.gradientFrom },
          { label: 'Cự Ly', value: t.distance, icon: Target, color: t.gradientFrom },
          { label: 'Số Vòng', value: `${t.currentRound}/${t.rounds} vòng`, icon: Flag, color: t.gradientFrom },
          { label: 'Mặt Đường', value: t.surface, icon: Wind, color: t.gradientFrom },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: color + '10', border: `1px solid ${color}25` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
              <div className="text-sm font-bold text-white">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Live banner */}
      {t.status === 'live' && (
        <div className="flex items-center gap-4 py-4 my-6 px-6 rounded-2xl bg-red-500/10 border border-red-500/25">
          <Tv className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
            <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Đang Phát Trực Tiếp</span>
          </div>
          <div className="flex items-center gap-2 ml-auto bg-white/5 px-4 py-2 rounded-full border border-white/8">
            <Eye className="w-4 h-4 text-red-400" />
            <span className="font-bold text-white">{t.viewers.toLocaleString()}</span>
            <span className="text-slate-400 text-sm">người đang xem</span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex border-b border-white/8 overflow-x-auto scrollbar-none mt-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all uppercase tracking-wider ${
              activeTab === key ? 'text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            style={activeTab === key ? { borderBottomColor: t.gradientFrom, color: t.gradientFrom } : {}}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="py-8">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="p-7 space-y-7">
              {/* Description */}
              <div>
                <p className="text-sm text-slate-400 leading-relaxed border-l-2 pl-4" style={{ borderColor: t.gradientFrom }}>
                  {t.description}
                </p>
              </div>

              {/* Info grid */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Thông Tin Giải Đấu</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Địa Điểm', value: t.location, icon: MapPin },
                    { label: 'Ngày Thi Đấu', value: `${t.date}`, icon: Calendar },
                    { label: 'Thời Gian', value: `${t.time} — ${t.endTime}`, icon: Clock },
                    { label: 'Mặt Đường', value: t.surface, icon: Wind },
                    { label: 'Cự Ly', value: t.distance, icon: Target },
                    { label: 'Thời Tiết', value: t.weather, icon: Zap },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3 p-3.5 bg-white/3 rounded-xl border border-white/6 hover:border-white/12 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.gradientFrom + '20' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: t.gradientFrom }} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-sm text-white font-medium leading-snug">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/6">
                <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Địa Chỉ Đầy Đủ</div>
                  <div className="text-sm text-white">{t.address}</div>
                </div>
              </div>

              {/* Organizer */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Ban Tổ Chức</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Đơn Vị Tổ Chức', value: t.organizer, icon: Shield },
                    { label: 'Nhà Tài Trợ', value: t.sponsor, icon: Award },
                    { label: 'Trọng Tài', value: t.referee, icon: Medal },
                    { label: 'Số Khán Giả', value: t.viewers > 0 ? `${t.viewers.toLocaleString()} người xem` : 'Chưa diễn ra', icon: Eye },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-4 p-4 bg-white/3 rounded-xl border border-white/6">
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                        <div className="text-sm text-white font-medium">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              {t.rules.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Quy Định Thi Đấu</h3>
                  <div className="space-y-2">
                    {t.rules.map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 bg-white/3 rounded-xl border border-white/6">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-black shrink-0 mt-0.5"
                          style={{ backgroundColor: t.gradientFrom }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm text-slate-300 leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HORSES ── */}
          {activeTab === 'horses' && (
            <div className="p-7">
              {t.horses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 opacity-40" />
                  </div>
                  <p className="text-sm">Danh sách ngựa chưa được công bố</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      {t.horses.length} Ngựa Tham Gia
                    </h3>
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">Tỷ lệ cược</span>
                  </div>

                  {t.horses.map((h, idx) => (
                    <div
                      key={h.number}
                      className="relative p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: h.color + '0D',
                        borderColor: h.color + '30',
                      }}
                    >
                      {/* Position ribbon */}
                      {t.status === 'finished' && h.pos <= 3 && (
                        <div
                          className="absolute -top-px -right-px px-3 py-1 rounded-bl-xl rounded-tr-2xl text-[10px] font-black text-white"
                          style={{ backgroundColor: h.pos === 1 ? '#F59E0B' : h.pos === 2 ? '#94A3B8' : '#CD7F32' }}
                        >
                          {h.pos === 1 ? '🥇 NHẤT' : h.pos === 2 ? '🥈 NHÌ' : '🥉 BA'}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {/* Number */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0"
                          style={{ backgroundColor: h.color + '25', color: h.color, border: `2px solid ${h.color}50` }}
                        >
                          {h.number}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-white text-base">{h.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 text-slate-400 font-semibold uppercase">{h.nationality}</span>
                            {h.pos === 1 && t.status !== 'finished' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ backgroundColor: t.gradientFrom + '30', color: t.gradientFrom }}>Ứng Viên #1</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            🏇 {h.jockey} &nbsp;·&nbsp; 👑 {h.owner}
                          </div>
                        </div>

                        {/* Odds */}
                        <div className="text-right shrink-0">
                          <div className="text-xl font-black" style={{ color: t.gradientFrom }}>{h.odds}x</div>
                          <div className="text-[10px] text-slate-500">Tỷ Lệ</div>
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 mb-0.5 uppercase">Tuổi</div>
                          <div className="text-sm font-semibold text-white">{h.age}t</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 mb-0.5 uppercase">Cân</div>
                          <div className="text-sm font-semibold text-white">{h.weight}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 mb-0.5 uppercase">Wins</div>
                          <div className="text-sm font-semibold text-white">{h.wins}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 mb-1 uppercase">Phong Độ</div>
                          <div className="flex gap-0.5 justify-center">
                            {h.form.slice(-4).map((pos, i) => <FormDot key={i} pos={pos} />)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ROUNDS ── */}
          {activeTab === 'rounds' && (
            <div className="p-7">
              {t.roundResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center mb-4">
                    <Flag className="w-7 h-7 opacity-40" />
                  </div>
                  <p className="text-sm">Giải đấu chưa bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Progress */}
                  <div className="p-4 rounded-2xl border border-white/8 bg-white/3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiến Độ Giải Đấu</span>
                      <span className="text-sm font-bold text-white">{t.currentRound}/{t.rounds} Vòng</span>
                    </div>
                    <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(t.currentRound / t.rounds) * 100}%`,
                          background: `linear-gradient(to right, ${t.gradientFrom}, ${t.gradientTo})`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                      <span>Bắt đầu</span>
                      <span className="font-semibold" style={{ color: t.gradientFrom }}>{Math.round((t.currentRound / t.rounds) * 100)}%</span>
                      <span>Kết thúc</span>
                    </div>
                  </div>

                  {/* Round cards */}
                  {t.roundResults.map((r) => (
                    <div
                      key={r.round}
                      className={`relative rounded-2xl border overflow-hidden transition-all ${
                        r.status === 'live'
                          ? 'bg-red-500/8 border-red-500/30'
                          : r.status === 'done'
                          ? 'bg-white/3 border-white/8 hover:border-white/15'
                          : 'bg-white/2 border-white/5 opacity-50'
                      }`}
                    >
                      {r.status === 'live' && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
                      )}
                      {r.status === 'done' && (
                        <div
                          className="absolute top-0 left-0 right-0 h-0.5"
                          style={{ background: `linear-gradient(to right, ${t.gradientFrom}, ${t.gradientTo})` }}
                        />
                      )}

                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Status icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            r.status === 'live' ? 'bg-red-500/20' :
                            r.status === 'done' ? 'bg-emerald-500/15' : 'bg-white/5'
                          }`}>
                            {r.status === 'done' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                            {r.status === 'live' && <CircleDot className="w-6 h-6 text-red-400 animate-pulse" />}
                            {r.status === 'pending' && <Circle className="w-6 h-6 text-slate-600" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-black text-white text-lg">Vòng {r.round}</span>
                              {r.status === 'live' && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded uppercase tracking-widest">● LIVE</span>
                              )}
                              {r.status === 'done' && (
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Hoàn Thành</span>
                              )}
                              {r.status === 'pending' && (
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Chưa Diễn Ra</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{r.date}</div>
                          </div>

                          {r.status !== 'pending' && (
                            <div className="text-right">
                              <div className="font-black text-white text-base">{r.winner}</div>
                              {r.jockey && r.jockey !== '—' && (
                                <div className="text-[11px] text-slate-400">🏇 {r.jockey}</div>
                              )}
                              <div className="text-xs text-slate-500 mt-0.5">⏱ {r.time}</div>
                            </div>
                          )}
                        </div>

                        {/* Top 3 */}
                        {r.topThree && r.topThree.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Top 3</div>
                            <div className="flex gap-2">
                              {r.topThree.map((name, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                  style={{
                                    backgroundColor: i === 0 ? '#F59E0B20' : i === 1 ? '#94A3B820' : '#CD7F3220',
                                    color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CD7F32',
                                  }}
                                >
                                  <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                  {name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {activeTab === 'schedule' && (
            <div className="p-7">
              {t.schedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 opacity-40" />
                  </div>
                  <p className="text-sm">Lịch trình chưa có</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Lịch Trình Ngày {t.date}
                    </h3>
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div
                      className="absolute left-[52px] top-4 bottom-4 w-px"
                      style={{ background: `linear-gradient(to bottom, ${t.gradientFrom}40, ${t.gradientTo}10)` }}
                    />
                    <div className="space-y-1">
                      {t.schedule.map((s, i) => {
                        const isActive = s.event.includes('ĐANG DIỄN RA');
                        const isFinal = s.icon === 'final';
                        const isAward = s.icon === 'award';
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                              isActive ? 'bg-red-500/10 border border-red-500/20' :
                              isFinal ? 'bg-white/4 border border-white/8' :
                              'hover:bg-white/3'
                            }`}
                          >
                            <div className={`w-14 text-xs font-bold shrink-0 text-right ${isActive ? 'text-red-400' : 'text-slate-500'}`}>
                              {s.time}
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full shrink-0 z-10 flex items-center justify-center ${
                                isActive ? 'animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : ''
                              }`}
                              style={{
                                backgroundColor: isActive ? '#EF4444' :
                                  isFinal ? t.gradientFrom :
                                  isAward ? '#F59E0B' :
                                  '#1F2937',
                                border: isActive ? 'none' : `2px solid ${t.gradientFrom}50`,
                              }}
                            />
                            <div className={`text-sm flex-1 ${isActive ? 'text-white font-semibold' : isFinal ? 'text-white font-medium' : 'text-slate-300'}`}>
                              {s.event.replace(' (ĐANG DIỄN RA)', '')}
                              {isActive && (
                                <span className="ml-2 text-[9px] px-2 py-0.5 bg-red-500 text-white rounded-full font-black uppercase tracking-widest">● LIVE</span>
                              )}
                              {isFinal && !isActive && (
                                <span className="ml-2 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest" style={{ backgroundColor: t.gradientFrom + '30', color: t.gradientFrom }}>CHUNG KẾT</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PRIZE ── */}
          {activeTab === 'prize' && (
            <div className="p-7 space-y-6">
              {/* Total prize */}
              <div
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{ background: `linear-gradient(135deg, ${t.gradientFrom}25, ${t.gradientTo}15)`, border: `1px solid ${t.gradientFrom}30` }}
              >
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Giải Thưởng</div>
                <div className="text-3xl font-black text-white">{t.totalPrize}</div>
                <div
                  className="absolute inset-0 opacity-5"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${t.gradientFrom}, transparent 70%)` }}
                />
              </div>

              {/* Prize breakdown */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Phân Bổ Giải Thưởng</h3>
                <div className="space-y-3">
                  {[
                    { rank: 1, label: 'Quán Quân', prize: t.firstPrize, emoji: '🥇', color: '#F59E0B' },
                    { rank: 2, label: 'Á Quân', prize: t.secondPrize, emoji: '🥈', color: '#94A3B8' },
                    { rank: 3, label: 'Hạng Ba', prize: t.thirdPrize, emoji: '🥉', color: '#CD7F32' },
                  ].map(({ rank, label, prize, emoji, color }) => (
                    <div
                      key={rank}
                      className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{ backgroundColor: color + '10', borderColor: color + '25' }}
                    >
                      <div className="text-3xl">{emoji}</div>
                      <div className="flex-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Hạng {rank}</div>
                        <div className="text-sm font-bold text-white">{label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black" style={{ color }}>{prize}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Winner (finished only) */}
              {t.status === 'finished' && topHorse && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Nhà Vô Địch</h3>
                  <div
                    className="flex items-center gap-4 p-5 rounded-2xl border"
                    style={{ background: `linear-gradient(135deg, ${topHorse.color}15, transparent)`, borderColor: topHorse.color + '40' }}
                  >
                    <div className="text-4xl">👑</div>
                    <div>
                      <div className="text-xl font-black text-white">{topHorse.name}</div>
                      <div className="text-sm text-slate-400">🏇 {topHorse.jockey} &nbsp;·&nbsp; 👑 {topHorse.owner}</div>
                      <div className="mt-1 text-xs font-bold" style={{ color: '#F59E0B' }}>{t.firstPrize}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sponsor */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Nhà Tài Trợ</h3>
                <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/6">
                  <Award className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div className="text-sm text-white font-medium">{t.sponsor}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────

function TournamentCard({ t, onClick }: { t: Tournament; onClick: () => void }) {
  const progress = t.rounds > 0 ? (t.currentRound / t.rounds) * 100 : 0;

  return (
    <div
      className="group relative bg-[#111118] border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:border-white/20 transition-all duration-300"
      onClick={onClick}
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 40px ${t.gradientFrom}15` }}
      />

      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={t.image}
          alt={t.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          style={{ filter: 'brightness(0.6)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/30 to-transparent" />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(135deg, ${t.gradientFrom}50, transparent 60%)` }}
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <StatusBadge status={t.status} badge={t.badge} />
        </div>

        {/* Tier */}
        <div className="absolute top-4 right-4">
          <TierBadge tier={t.tier} />
        </div>

        {/* Viewers */}
        {t.status === 'live' && (
          <div className="absolute bottom-16 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs text-white border border-white/10">
            <Eye className="w-3 h-3 text-red-400" />
            <span className="font-semibold">{t.viewers.toLocaleString()}</span>
          </div>
        )}

        {/* Category pill */}
        <div className="absolute bottom-4 left-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm"
            style={{ backgroundColor: t.gradientFrom + '25', color: t.gradientFrom, border: `1px solid ${t.gradientFrom}40` }}
          >
            <Trophy className="w-3 h-3" />
            {t.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-black text-white mb-0.5 group-hover:text-opacity-90 transition-colors line-clamp-1">{t.name}</h3>
        <p className="text-xs text-slate-500 mb-4 line-clamp-1">{t.subtitle}</p>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: t.gradientFrom }} />
            <span className="truncate">{t.location.split(',')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Calendar className="w-3.5 h-3.5" style={{ color: t.gradientFrom }} />
            <span>{t.date}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Ngựa', value: t.participants, icon: Users },
            { label: 'Cự ly', value: t.distance, icon: Target },
            { label: 'Vòng', value: `${t.rounds}`, icon: Flag },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center py-2.5 bg-white/3 rounded-xl border border-white/5">
              <Icon className="w-3.5 h-3.5 mb-1" style={{ color: t.gradientFrom }} />
              <div className="text-xs font-bold text-white">{value}</div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar (for live/finished) */}
        {t.status !== 'upcoming' && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-slate-500 uppercase tracking-wider">Tiến Độ</span>
              <span className="font-semibold text-white">Vòng {t.currentRound}/{t.rounds}</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(to right, ${t.gradientFrom}, ${t.gradientTo})`
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">Giải Thưởng</div>
            <div
              className="text-base font-black"
              style={{ color: t.gradientFrom }}
            >
              {t.prizeShort} VNĐ
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:gap-3"
            style={{
              background: `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})`,
              boxShadow: `0 4px 15px ${t.gradientFrom}30`
            }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            {t.status === 'live' ? <><Play className="w-3.5 h-3.5" /> Xem Live</> : <><ArrowRight className="w-3.5 h-3.5" /> Chi Tiết</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TournamentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tất Cả');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'prize'>('date');

  const filtered = tournaments
    .filter(t => {
      const matchCat = selectedCategory === 'Tất Cả' || t.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });

  const liveCount = tournaments.filter(t => t.status === 'live').length;
  const upcomingCount = tournaments.filter(t => t.status === 'upcoming').length;
  const finishedCount = tournaments.filter(t => t.status === 'finished').length;
  const totalViewers = tournaments.reduce((a, t) => a + t.viewers, 0);

  const featuredLive = tournaments.find(t => t.status === 'live');

  return (
    <div className="min-h-screen bg-[#09090F] font-sans text-slate-200" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Show full-page detail when a tournament is selected */}
      {detailTournament ? (
        <TournamentDetail t={detailTournament} onClose={() => setDetailTournament(null)} />
      ) : (
        <>
          <Navbar />

          {/* ── Hero Section ── */}
          <div className="relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)', filter: 'blur(80px)' }} />
              <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full opacity-6" style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)', filter: 'blur(80px)' }} />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative pt-28 pb-16 px-6">
              <div className="max-w-7xl mx-auto">
                {/* Top label */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-widest" style={{ backgroundColor: '#F59E0B15', borderColor: '#F59E0B30', color: '#F59E0B' }}>
                    <Trophy className="w-4 h-4" />
                    Giải Đấu Đua Ngựa
                  </div>
                  {liveCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-500/15 border border-red-500/25 text-xs font-bold text-red-400 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {liveCount} giải trực tiếp
                    </div>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
                  <div className="max-w-2xl">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-none tracking-tight">
                      Tất Cả
                      <br />
                      <span style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Giải Đấu
                      </span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                      Theo dõi trực tiếp, kết quả và lịch trình các giải đua ngựa hàng đầu Việt Nam — từ cấp độ hạng B đến Vô Địch Quốc Gia.
                    </p>
                  </div>

                  {/* Stat boxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
                    {[
                      { label: 'Trực Tiếp', value: liveCount, color: '#EF4444', bg: '#EF444415', border: '#EF444430', dot: true },
                      { label: 'Sắp Tới', value: upcomingCount, color: '#3B82F6', bg: '#3B82F615', border: '#3B82F630' },
                      { label: 'Hoàn Thành', value: finishedCount, color: '#64748B', bg: '#64748B15', border: '#64748B30' },
                      { label: 'Khán Giả', value: `${(totalViewers / 1000).toFixed(1)}K`, color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B30' },
                    ].map(({ label, value, color, bg, border, dot }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center text-center px-5 py-4 rounded-2xl"
                        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {dot && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />}
                          <span className="text-2xl font-black" style={{ color: 'white' }}>{value}</span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Featured Live Banner ── */}
          {featuredLive && (
            <div className="px-6 mb-8">
              <div className="max-w-7xl mx-auto">
                <div
                  className="relative overflow-hidden rounded-2xl cursor-pointer group"
                  onClick={() => setDetailTournament(featuredLive)}
                  style={{ background: 'linear-gradient(135deg, #F59E0B18, #EF444412)', border: '1px solid #F59E0B30' }}
                >
                  <div className="flex items-center gap-6 p-5 pr-8">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">LIVE NOW</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white text-lg truncate">{featuredLive.name}</span>
                        <span className="text-sm text-slate-400 hidden sm:inline">· Vòng {featuredLive.currentRound}/{featuredLive.rounds}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{featuredLive.location.split(',')[0]}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-red-400" />{featuredLive.viewers.toLocaleString()} đang xem</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all" style={{ color: '#F59E0B' }}>
                      <Tv className="w-4 h-4" />
                      <span className="hidden sm:inline">Xem Ngay</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none" style={{ background: 'linear-gradient(to left, #F59E0B08, transparent)' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Filters ── */}
          <div className="sticky top-[72px] z-30 border-b border-white/6 py-4 px-6" style={{ backgroundColor: '#09090Fcc', backdropFilter: 'blur(20px)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tìm giải đấu, địa điểm..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
                    style={{ outlineColor: '#F59E0B50' }}
                    onFocus={e => (e.target.style.borderColor = '#F59E0B50')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                {/* Status pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {statusFilters.map(({ label, value }) => {
                    const isActive = selectedStatus === value;
                    const count = value === 'all' ? tournaments.length : value === 'live' ? liveCount : value === 'upcoming' ? upcomingCount : finishedCount;
                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedStatus(value)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200"
                        style={isActive ? {
                          backgroundColor: value === 'live' ? '#EF4444' : '#F59E0B',
                          color: '#000',
                        } : {
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#64748B',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {value === 'live' && isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {label}
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-black"
                          style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)' }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Category & sort */}
                <div className="flex items-center gap-2 ml-auto">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="max-w-7xl mx-auto px-6 py-10">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-slate-500">
                Hiển thị <span className="text-white font-bold">{filtered.length}</span> giải đấu
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28">
                <div className="w-20 h-20 rounded-full bg-white/3 flex items-center justify-center mb-5">
                  <Trophy className="w-9 h-9 text-slate-600" />
                </div>
                <p className="text-lg font-semibold text-slate-500">Không tìm thấy giải đấu</p>
                <p className="text-sm text-slate-600 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('Tất Cả'); setSelectedStatus('all'); }}
                  className="mt-5 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                >
                  Xem tất cả giải đấu
                </button>
              </div>
            ) : (
              <>
                {/* Live section */}
                {filtered.some(t => t.status === 'live') && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Đang Diễn Ra</span>
                      </div>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.filter(t => t.status === 'live').map(t => (
                        <TournamentCard key={t.id} t={t} onClick={() => setDetailTournament(t)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming section */}
                {filtered.some(t => t.status === 'upcoming') && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center gap-2">
                        <Hourglass className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Sắp Diễn Ra</span>
                      </div>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.filter(t => t.status === 'upcoming').map(t => (
                        <TournamentCard key={t.id} t={t} onClick={() => setDetailTournament(t)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Finished section */}
                {filtered.some(t => t.status === 'finished') && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Đã Kết Thúc</span>
                      </div>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.filter(t => t.status === 'finished').map(t => (
                        <TournamentCard key={t.id} t={t} onClick={() => setDetailTournament(t)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
