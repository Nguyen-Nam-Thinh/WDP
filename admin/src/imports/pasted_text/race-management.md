Feature Name: Race Management System

Module: Admin Management Module

Actor: Admin

Description:
Race Management System cho phép admin quản lý toàn bộ vòng đời của các cuộc đua trong hệ thống. Admin có thể tạo race, cấu hình điều kiện tham gia, sắp xếp lịch thi đấu, phân công referee, quản lý trạng thái race, xử lý thay đổi lịch và công bố kết quả chính thức.

Objectives:
- Quản lý race lifecycle tập trung
- Tối ưu lịch thi đấu
- Đảm bảo fairness và eligibility
- Hỗ trợ realtime race operation
- Đồng bộ betting, ranking và payout system

Core Features:

1. Create New Race
- Admin có thể tạo race mới trong tournament.
- Required information:
  + race name
  + tournament
  + race grade
  + race distance
  + purse prize
  + registration fee
  + maximum horse capacity
  + scheduled start time
  + registration cutoff time
  + track condition
  + race description
- Hệ thống auto generate:
  + race code
  + default race status = open

2. Configure Race Eligibility
- Admin cấu hình điều kiện tham gia race.
- Eligibility settings:
  + allowed horse grades
  + minimum points
  + minimum horse age
  + maximum horse age
  + banned horse list
  + jockey restrictions
- Hệ thống validate eligibility trước khi approve registration.

3. Schedule Race
- Admin thiết lập:
  + race date
  + start time
  + race order
  + tournament stage/round
- Hệ thống kiểm tra:
  + race time conflicts
  + referee conflicts
  + jockey overlapping schedules
  + horse overlapping registrations
- Có:
  + drag-drop schedule arrangement
  + auto scheduling suggestion

4. Manage Race Status Lifecycle
- Admin quản lý trạng thái race:
  + open
  + closed
  + pre_check
  + running
  + finished
  + cancelled
- Status transition rules:
  + open → closed khi cutoffTime reached
  + closed → pre_check khi referee inspection bắt đầu
  + pre_check → running khi approved
  + running → finished sau result confirmation
- Chỉ admin hoặc referee có quyền update status.

5. Registration Management
- Admin xem danh sách horse registrations theo race.
- Hiển thị:
  + horse information
  + owner
  + assigned jockey
  + registration status
  + payment status
  + pre-check status
- Actions:
  + approve registration
  + reject registration
  + disqualify horse
  + refund registration fee
  + replace jockey

6. Assign Race Referee
- Admin assign referee cho race.
- Hệ thống validate:
  + referee availability
  + no schedule overlap
  + referee account active
- Referee nhận realtime notification assignment.

7. Manage Race Participants
- Admin quản lý:
  + participating horses
  + jockey assignments
  + race capacity
- Có thể:
  + remove horse khỏi race
  + replace horse
  + update jockey assignment
- Hệ thống auto update race slots remaining.

8. Live Race Monitoring
- Khi race running:
  + admin theo dõi realtime dashboard.
- Dashboard hiển thị:
  + live horse positions
  + race progress
  + incidents
  + race timer
  + referee actions
- Realtime update bằng Socket.IO/WebSocket.

9. Incident & Violation Management
- Admin xem:
  + violations
  + race incidents
  + penalties
  + disqualified horses
- Có thể:
  + override referee decision (super admin)
  + issue additional penalties
  + suspend horse/jockey

10. Result Management
- Sau race:
  + admin review referee-confirmed results.
- Hiển thị:
  + finishing positions
  + finish times
  + prize distribution
  + points earned
- Actions:
  + approve official result
  + publish result
  + trigger payouts
  + trigger ranking updates

11. Race Cancellation & Reschedule
- Admin có thể:
  + cancel race
  + postpone race
  + reschedule race
- Khi cancelled:
  + registration fees refunded
  + bets refunded
  + notifications sent
- Hệ thống lưu cancellation reason.

12. Race Analytics Dashboard
- Admin xem:
  + total registrations
  + betting volume
  + race popularity
  + spectator count
  + horse performance trends
- Export analytics:
  + PDF
  + Excel
  + CSV

13. Race History Management
- Admin xem lịch sử race:
  + previous winners
  + incidents
  + prize payouts
  + betting statistics
- Search/filter theo:
  + date
  + grade
  + tournament
  + horse
  + jockey

14. Notifications & Realtime Events
- Hệ thống gửi notification khi:
  + race opening
  + registration closing
  + race starting
  + race cancelled
  + result published
- Channels:
  + in-app
  + email
  + push notification

15. Audit & Security
- Mọi thay đổi race đều được audit log:
  + who changed
  + old value
  + new value
  + timestamp
- Audit events:
  + schedule changes
  + result edits
  + referee assignment
  + status changes
  + cancellation

Business Rules:

- Một horse không được đăng ký 2 race cùng thời điểm.
- Race chỉ bắt đầu khi:
  + đủ minimum participants
  + pre-check completed
  + referee assigned
- Registration tự động đóng khi cutoffTime reached.
- Chỉ admin mới có quyền publish official results.
- Race cancelled phải refund:
  + registration fees
  + betting amounts
- Disqualified horse:
  + không nhận prize
  + không nhận points
- Race result chỉ valid sau referee confirmation.

Non-functional Requirements:

- Realtime update dưới 1 giây.
- High concurrency support.
- Race dashboard responsive.
- Audit logging mandatory.
- Scalable scheduling system.
- Secure role-based access control.

Suggested Enhancements:

- AI race scheduling optimization
- Weather impact prediction
- Automated race balancing
- Smart referee assignment
- Live race heatmap
- AI anomaly detection
- GPS horse tracking
- Predictive race analytics
- Dynamic race simulation