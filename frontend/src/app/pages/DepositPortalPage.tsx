import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Building2,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Copy,
  Shield,
  Coins,
  Clock,
  Info,
  ChevronDown,
  Headphones,
  ArrowRight,
  Zap,
  QrCode,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const COIN_RATE = 1000; // 1 xu = 1,000 VND

const QUICK_AMOUNTS = [
  { coins: 50,    vnd: 50_000 },
  { coins: 100,   vnd: 100_000 },
  { coins: 200,   vnd: 200_000 },
  { coins: 500,   vnd: 500_000 },
  { coins: 1000,  vnd: 1_000_000 },
  { coins: 2000,  vnd: 2_000_000 },
];

const BANK_ACCOUNTS = [
  { bank: 'Vietcombank (VCB)',   number: '1020 4857 2934 8800', owner: 'CONG TY TNHH RACING VN', branch: 'TP. Hồ Chí Minh', color: 'from-green-600 to-green-800',    logo: '🏦' },
  { bank: 'Techcombank (TCB)',   number: '1901 2345 6789 0001', owner: 'CONG TY TNHH RACING VN', branch: 'Hà Nội',           color: 'from-red-600 to-red-800',       logo: '🏦' },
  { bank: 'MB Bank',            number: '0909 8888 0002',       owner: 'CONG TY TNHH RACING VN', branch: 'TP. Hồ Chí Minh', color: 'from-purple-600 to-purple-800',  logo: '🏦' },
];

const EWALLETS = [
  { name: 'MoMo',    phone: '0909.888.777', color: 'from-pink-600 to-rose-700',      qr: true },
  { name: 'ZaloPay', phone: '0909.888.777', color: 'from-blue-600 to-blue-800',      qr: true },
  { name: 'VNPay',   phone: '0909.888.777', color: 'from-red-500 to-red-700',        qr: true },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export function DepositPortalPage() {
  const navigate = useNavigate();
  const [method, setMethod]       = useState<'bank' | 'ewallet'>('bank');
  const [selectedBank, setSelectedBank]     = useState(0);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [coinAmount, setCoinAmount]         = useState('');
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [copied, setCopied]       = useState<string | null>(null);
  const [bankExpanded, setBankExpanded] = useState(false);

  const coins    = Number(coinAmount) || 0;
  const vndAmount = coins * COIN_RATE;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const refCode = `NAP-ALEX-${coinAmount || 'XXX'}`;

  const currentBank   = BANK_ACCOUNTS[selectedBank];
  const currentWallet = EWALLETS[selectedWallet];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/spectator')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-card group-hover:bg-muted flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-muted" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#C9A227] to-[#8F7318] rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Coins className="w-5 h-5 text-[#23201A]" />
            </div>
            <div>
              <div className="text-foreground font-serif font-bold leading-none text-foreground">Cổng Nạp Xu</div>
              <div className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary" /> Bảo mật SSL · An toàn 100%
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-[#C9A227]/10 border border-[#C9A227]/20 px-3 py-1.5 rounded-xl">
            <Coins className="w-4 h-4 text-[#C9A227]" />
            <span className="text-[#C9A227] font-bold text-sm">1,350 xu</span>
          </div>
        </div>
      </nav>

      <div className="pt-20 max-w-4xl mx-auto px-6 pb-12">
        {/* ─── Tỷ Giá Banner ─────────────────────────────────────────────── */}
        <div className="mt-6 mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#C9A227]/20 via-gold/5 to-transparent border border-[#C9A227]/20 p-6">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-gold/5 to-transparent" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C9A227] to-[#8F7318] rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 flex-shrink-0">
                <Coins className="w-7 h-7 text-[#23201A]" />
              </div>
              <div>
                <div className="font-serif text-3xl font-bold text-foreground">1 Xu = 1.000 VND</div>
                <div className="text-muted-foreground text-sm mt-0.5">Tỷ giá quy đổi chính thức · Cập nhật: 28/05/2026</div>
              </div>
            </div>
            <div className="md:ml-auto flex flex-wrap gap-4">
              {[
                { coins: 100,  vnd: '100.000' },
                { coins: 500,  vnd: '500.000' },
                { coins: 1000, vnd: '1.000.000' },
              ].map((ex, i) => (
                <div key={i} className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-center">
                  <div className="text-[#C9A227] font-bold">{ex.coins} xu</div>
                  <div className="text-muted-foreground text-xs">{ex.vnd} VND</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Step Progress ────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 mb-8">
          {[
            { n: 1, label: 'Chọn Phương Thức' },
            { n: 2, label: 'Nhập Số Xu' },
            { n: 3, label: 'Thanh Toán & Xác Nhận' },
          ].map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  s.n < step  ? 'bg-[#C9A227] border-[#C9A227] text-[#23201A]' :
                  s.n === step ? 'border-[#C9A227] text-[#C9A227] bg-[#C9A227]/10' :
                                 'border-slate-700 text-muted-foreground bg-transparent'
                }`}>
                  {s.n < step ? <CheckCircle className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${s.n <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${s.n < step ? 'bg-[#C9A227]' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Method ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground mb-1">Chọn Phương Thức Thanh Toán</h2>
            <p className="text-muted-foreground text-sm mb-6">Chúng tôi hỗ trợ chuyển khoản ngân hàng và ví điện tử tại Việt Nam.</p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Bank Transfer */}
              <button
                onClick={() => setMethod('bank')}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                  method === 'bank'
                    ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/50'
                    : 'bg-card border-border hover:border-border'
                }`}>
                {method === 'bank' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#C9A227] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-[#23201A]" />
                  </div>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-[#1F3D2B] to-[#172D20] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-foreground font-bold text-lg mb-1">Chuyển Khoản Ngân Hàng</div>
                <div className="text-muted-foreground text-sm mb-4">Vietcombank, Techcombank, MB Bank</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 5-30 phút
                  </span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">Tối thiểu 50 xu</span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">0% phí</span>
                </div>
              </button>

              {/* E-Wallet */}
              <button
                onClick={() => setMethod('ewallet')}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                  method === 'ewallet'
                    ? 'bg-gradient-to-br from-secondary/15 to-secondary/5 border-secondary/50'
                    : 'bg-card border-border hover:border-border'
                }`}>
                {method === 'ewallet' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#C9A227] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-[#23201A]" />
                  </div>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-[#8C2F1B] to-[#6B2415] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <div className="text-foreground font-bold text-lg mb-1">Ví Điện Tử</div>
                <div className="text-muted-foreground text-sm mb-4">MoMo, ZaloPay, VNPay</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Tức thì
                  </span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">Tối thiểu 20 xu</span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">0% phí</span>
                </div>
              </button>
            </div>

            {/* Info box */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary">
                <span className="font-semibold">Lưu ý: </span>
                Tất cả giao dịch đều được mã hóa SSL và xử lý tự động. Nếu gặp sự cố, vui lòng liên hệ hỗ trợ 24/7.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#C9A227] to-[#B08D1E] text-[#23201A] font-bold px-8 py-3.5 rounded-xl hover:from-[#D9B53C] hover:to-[#B08D1E] transition-all shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5">
                Tiếp Theo <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Amount ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-1">Nhập Số Xu Muốn Nạp</h2>
              <p className="text-muted-foreground text-sm">1 xu = 1.000 VND. Hệ thống sẽ tự động quy đổi.</p>
            </div>

            {/* Coin Input */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-2">
                <Coins className="w-5 h-5 text-[#C9A227]" />
                <label className="text-sm font-semibold text-foreground">Số Xu Muốn Nạp</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={coinAmount}
                  onChange={e => setCoinAmount(e.target.value)}
                  placeholder="Nhập số xu..."
                  className="w-full bg-card border border-border rounded-xl px-5 py-4 text-foreground text-2xl font-bold placeholder-muted-foreground focus:outline-none focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/20 transition-all pr-20"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C9A227] font-bold text-sm bg-[#C9A227]/10 px-3 py-1 rounded-lg border border-[#C9A227]/20">
                  xu
                </div>
              </div>

              {/* VND equivalent */}
              {coins > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Tương đương:</span>
                  <span className="text-[#C9A227] font-bold text-base">{vndAmount.toLocaleString('vi-VN')} VND</span>
                </div>
              )}

              {/* Quick pick */}
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Chọn nhanh</div>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setCoinAmount(String(q.coins))}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        Number(coinAmount) === q.coins
                          ? 'bg-[#C9A227] text-[#23201A] border-[#C9A227]'
                          : 'bg-card text-muted-foreground border-border hover:border-[#C9A227]/40 hover:text-foreground'
                      }`}>
                      <div>{q.coins} xu</div>
                      <div className={`text-xs mt-0.5 font-normal ${Number(coinAmount) === q.coins ? 'text-[#5C5648]' : 'text-muted-foreground'}`}>
                        {(q.vnd / 1000).toLocaleString()}K VND
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            {coins > 0 && (
              <div className="bg-muted/50 border border-border rounded-2xl p-5 space-y-3">
                <div className="text-muted-foreground text-xs uppercase tracking-wide font-semibold mb-3">Tóm Tắt Giao Dịch</div>
                {[
                  { label: 'Số xu nhận được',    value: `${coins.toLocaleString()} xu`,            color: 'text-[#C9A227]' },
                  { label: 'Số tiền thanh toán',  value: `${vndAmount.toLocaleString('vi-VN')} VND`, color: 'text-foreground' },
                  { label: 'Phương thức',         value: method === 'bank' ? 'Chuyển Khoản Ngân Hàng' : 'Ví Điện Tử', color: 'text-foreground' },
                  { label: 'Phí giao dịch',       value: 'Miễn phí',                               color: 'text-primary' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay Lại
              </button>
              <button
                disabled={coins < (method === 'bank' ? 50 : 20)}
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#C9A227] to-[#B08D1E] text-[#23201A] font-bold px-8 py-3.5 rounded-xl hover:from-[#D9B53C] hover:to-[#B08D1E] transition-all shadow-lg shadow-black/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-[#C9A227] disabled:hover:to-[#B08D1E] disabled:shadow-none">
                Tiến Hành Thanh Toán <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            {coins > 0 && coins < (method === 'bank' ? 50 : 20) && (
              <p className="text-[#B42318] text-xs text-right">Số xu tối thiểu: {method === 'bank' ? '50' : '20'} xu</p>
            )}
          </div>
        )}

        {/* ─── STEP 3: Payment Info ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-1">Thực Hiện Thanh Toán</h2>
              <p className="text-muted-foreground text-sm">Chuyển đúng số tiền và nội dung bên dưới, hệ thống sẽ tự động xác nhận trong vài phút.</p>
            </div>

            {/* ─── BANK TRANSFER ── */}
            {method === 'bank' && (
              <div className="space-y-4">
                {/* Bank Selector */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 block">Chọn Ngân Hàng</label>
                  <div className="grid gap-2">
                    {BANK_ACCOUNTS.map((bank, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedBank(i)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          selectedBank === i
                            ? 'border-[#C9A227]/60 bg-[#C9A227]/5'
                            : 'border-border bg-card hover:border-border'
                        }`}>
                        <div className={`w-10 h-10 bg-gradient-to-br ${bank.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                          {bank.logo}
                        </div>
                        <div className="flex-1">
                          <div className="text-foreground font-semibold text-sm">{bank.bank}</div>
                          <div className="text-muted-foreground text-xs">{bank.branch}</div>
                        </div>
                        {selectedBank === i && <CheckCircle className="w-5 h-5 text-[#C9A227]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
                  <div className={`bg-gradient-to-r ${currentBank.color} p-4`}>
                    <div className="text-white font-bold text-lg">{currentBank.bank}</div>
                    <div className="text-white/70 text-sm">{currentBank.branch}</div>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { label: 'Chủ Tài Khoản', value: currentBank.owner,         copyKey: 'owner' },
                      { label: 'Số Tài Khoản',  value: currentBank.number,        copyKey: 'number' },
                      { label: 'Số Tiền',        value: `${vndAmount.toLocaleString('vi-VN')} VND`, copyKey: 'amount' },
                      { label: 'Nội Dung CK',   value: refCode,                   copyKey: 'ref', highlight: true },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between py-3 border-b border-border last:border-0 ${row.highlight ? 'bg-[#C9A227]/5 -mx-5 px-5 rounded-lg' : ''}`}>
                        <span className="text-muted-foreground text-sm">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${row.highlight ? 'text-[#C9A227]' : 'text-foreground'}`}>{row.value}</span>
                          <button
                            onClick={() => copyToClipboard(row.value, row.copyKey)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors group"
                            title="Sao chép">
                            {copied === row.copyKey
                              ? <CheckCircle className="w-4 h-4 text-primary" />
                              : <Copy className="w-4 h-4 text-muted-foreground group-hover:text-[#C9A227]" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important: exact content */}
                <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#8F7318] flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-[#8F7318] font-semibold mb-1">⚠️ Bắt Buộc Nhập Đúng Nội Dung Chuyển Khoản</div>
                    <div className="text-[#5C5648]">
                      Ghi đúng nội dung <span className="font-mono bg-gold/20 px-1.5 py-0.5 rounded text-[#8F7318]">{refCode}</span> để hệ thống tự động xác nhận và cộng xu ngay.
                      Nếu sai nội dung, giao dịch sẽ bị treo và cần xử lý thủ công (2-24h).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── E-WALLET ── */}
            {method === 'ewallet' && (
              <div className="space-y-4">
                {/* Wallet Selector */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 block">Chọn Ví Điện Tử</label>
                  <div className="grid grid-cols-3 gap-3">
                    {EWALLETS.map((wallet, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedWallet(i)}
                        className={`py-4 rounded-xl border-2 font-bold text-sm transition-all ${
                          selectedWallet === i
                            ? 'border-[#C9A227]/60 bg-[#C9A227]/5 text-[#C9A227]'
                            : 'border-border bg-card text-foreground hover:border-border'
                        }`}>
                        {wallet.name}
                        {selectedWallet === i && <div className="text-xs font-normal mt-1 text-primary">✓ Đã chọn</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR + Info */}
                <div className="bg-muted/50 border border-border rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* QR Code */}
                    <div className="flex-shrink-0 text-center">
                      <div className="w-40 h-40 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <div className="text-[#23201A] text-center">
                          <QrCode className="w-20 h-20 mx-auto text-[#23201A]" />
                          <div className="text-xs mt-1 font-mono text-muted-foreground">{currentWallet.name}</div>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs mt-3">Mở app {currentWallet.name}<br />và quét mã QR</p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4 w-full">
                      <div className={`h-1 w-full bg-gradient-to-r ${currentWallet.color} rounded-full`} />
                      {[
                        { label: 'Ứng Dụng',       value: currentWallet.name,                        copyKey: 'app' },
                        { label: 'Số Điện Thoại',  value: currentWallet.phone,                       copyKey: 'phone' },
                        { label: 'Số Tiền',         value: `${vndAmount.toLocaleString('vi-VN')} VND`, copyKey: 'vnd' },
                        { label: 'Nội Dung',        value: refCode,                                   copyKey: 'wref', highlight: true },
                      ].map((row, i) => (
                        <div key={i} className={`flex items-center justify-between py-2.5 border-b border-border last:border-0`}>
                          <span className="text-muted-foreground text-sm">{row.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${row.highlight ? 'text-[#C9A227]' : 'text-foreground'}`}>{row.value}</span>
                            <button
                              onClick={() => copyToClipboard(row.value, row.copyKey)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors group">
                              {copied === row.copyKey
                                ? <CheckCircle className="w-4 h-4 text-primary" />
                                : <Copy className="w-4 h-4 text-muted-foreground group-hover:text-[#C9A227]" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary">
                    <span className="font-semibold">Tức Thì: </span>
                    Sau khi chuyển tiền thành công qua ví, xu sẽ được cộng vào tài khoản trong vòng 1-3 phút.
                  </div>
                </div>
              </div>
            )}

            {/* General Notice */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-2.5">
              <div className="text-foreground font-semibold text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Hướng Dẫn Sau Khi Thanh Toán
              </div>
              <ul className="text-muted-foreground text-sm space-y-1.5 list-none">
                {[
                  'Sau khi chuyển tiền, chờ 1-30 phút để hệ thống xác nhận tự động.',
                  'Xu sẽ được cộng ngay vào số dư tài khoản của bạn.',
                  'Kiểm tra lịch sử nạp tiền tại mục "Lịch Sử Nạp" để theo dõi giao dịch.',
                  'Nếu sau 30 phút chưa nhận được xu, liên hệ hỗ trợ với mã giao dịch bên trên.',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-[#C9A227] font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-card/50 border border-border rounded-xl p-4 flex items-center gap-3">
                <Headphones className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <div className="text-foreground font-semibold text-sm">Hỗ Trợ 24/7</div>
                  <div className="text-muted-foreground text-xs">Hotline: 1800-8888 · support@racingvn.com</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/spectator/deposit-history')}
                className="flex items-center justify-center gap-2 bg-card hover:bg-muted border border-border rounded-xl px-5 py-4 text-foreground text-sm font-medium transition-all">
                Xem Lịch Sử Nạp <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay Lại
              </button>
              <button
                onClick={() => { setStep(1); setCoinAmount(''); setMethod('bank'); }}
                className="flex items-center gap-2 bg-[#C9A227] text-[#23201A] font-bold px-6 py-3 rounded-xl hover:bg-[#D9B53C] transition-all shadow-lg shadow-black/10">
                <CheckCircle className="w-5 h-5" /> Đã Chuyển Tiền
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
