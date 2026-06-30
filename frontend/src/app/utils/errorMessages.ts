const ERROR_MAP: Record<string, string> = {
  // Authentication
  'Invalid credentials': 'Email hoặc mật khẩu không chính xác',
  'Email already registered': 'Email này đã được sử dụng, vui lòng dùng email khác',
  'No token provided': 'Vui lòng đăng nhập để tiếp tục',
  'Invalid or expired token': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  'Invalid refresh token': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  'Insufficient permissions': 'Bạn không có quyền thực hiện thao tác này',
  'Invalid or expired reset token': 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
  'Invalid or expired reset code': 'Mã xác nhận không hợp lệ hoặc đã hết hạn',
  'Reset code has expired': 'Mã xác nhận đã hết hạn, vui lòng yêu cầu mã mới',
  'Current password is incorrect': 'Mật khẩu hiện tại không chính xác',
  // Wallet & betting
  'Insufficient balance': 'Số dư không đủ, vui lòng nạp thêm coin',
  'Betting cutoff has passed for this race': 'Đã hết thời gian dự đoán cho cuộc đua này',
  'Cannot place bets on a race with status': 'Không thể dự đoán cho cuộc đua ở trạng thái này',
  'Invalid bet type': 'Loại dự đoán không hợp lệ',
  'Bet not found': 'Không tìm thấy thông tin dự đoán',
  'Cannot cancel a': 'Không thể hủy dự đoán ở trạng thái hiện tại',
  // Resources
  'User not found': 'Không tìm thấy thông tin người dùng',
  'Horse not found': 'Không tìm thấy thông tin ngựa',
  'Jockey not found': 'Không tìm thấy thông tin kỵ sĩ',
  'Race not found': 'Không tìm thấy thông tin cuộc đua',
  'Tournament not found': 'Không tìm thấy thông tin giải đấu',
  'Registration not found': 'Không tìm thấy thông tin đăng ký',
  'Invitation not found': 'Không tìm thấy lời mời',
  'Report not found': 'Không tìm thấy báo cáo',
  // Business rules
  'Access denied': 'Bạn không có quyền truy cập',
  'Validation failed': 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại',
  'Registration already exists': 'Ngựa này đã được đăng ký vào cuộc đua',
  'Race is not open for registration': 'Cuộc đua không còn nhận đăng ký',
  'Horse does not meet eligibility': 'Ngựa không đáp ứng điều kiện tham gia cuộc đua',
  'Jockey already assigned': 'Kỵ sĩ này đã được phân công cho cuộc đua',
  // Upload
  'Upload failed': 'Tải ảnh thất bại, vui lòng thử lại',
  'Upload error': 'Lỗi tải file, vui lòng thử lại',
  // Network / generic
  'Request failed': 'Có lỗi xảy ra, vui lòng thử lại',
  'Network Error': 'Lỗi kết nối, vui lòng kiểm tra mạng',
  'Internal Server Error': 'Lỗi hệ thống, vui lòng thử lại sau',
};

export function getApiErrorMessage(message?: string): string {
  if (!message) return 'Có lỗi xảy ra, vui lòng thử lại';

  if (ERROR_MAP[message]) return ERROR_MAP[message];

  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }

  // If no mapping found, return the original (may already be Vietnamese)
  return message;
}
