# BÁO CÁO PHÂN TÍCH TOÀN DIỆN MÀN HÌNH CHẤM CÔNG (TIMEKEEPING PAGE)

## 1. Mục đích & Chức năng (Purpose & Function)
Màn hình này được thiết kế làm giao diện quản lý và theo dõi thông tin chấm công chi tiết của từng nhân viên theo thời gian (tháng, năm). 

Các chức năng cốt lõi bao gồm:
- **Quản lý & Duyệt danh sách:** Hiển thị danh sách nhân viên bên cột trái, hỗ trợ tìm kiếm nhanh theo Tên, Mã nhân viên hoặc Đội/Bộ phận làm việc.
- **Hiển thị thông tin cá nhân:** Xem thông tin hồ sơ của nhân viên đang chọn bao gồm Mã số, Họ tên, Đội nhóm, Chức danh.
- **Thống kê nhanh chỉ số:** Tổng hợp tổng số ngày đi làm, số ngày nghỉ và tổng số ngày đi muộn/thiếu giờ của nhân viên trong tháng được chọn dưới dạng các thẻ màu trực quan.
- **Bảng lịch chấm công chi tiết:** Lịch tháng hiển thị thông tin chấm công trực quan của từng ngày với giờ Check-in, Check-out, trạng thái cụ thể (Đi làm đúng giờ, Đi muộn, Nghỉ phép/không phép, Thiếu giờ làm việc, Chưa đến) được đánh dấu bằng các màu pastel dịu nhẹ và các nhãn (badge) trạng thái.
- **Biểu đồ phân tích trực quan:** 
  - Biểu đồ tròn/khuyên (Donut Chart) phân tích tỉ lệ phần trăm các trạng thái công của tháng hiện tại.
  - Biểu đồ cột (Bar Chart) biểu diễn số ngày Đi làm, Nghỉ, Thiếu giờ qua các tháng trong năm được chọn để theo dõi xu hướng.

---

## 2. Bố cục giao diện (Layout)
Giao diện của màn hình được xây dựng trên bố cục Flexbox và Grid, tối ưu hóa không gian hiển thị toàn màn hình (`h-screen`, `100vh`), không cho phép thanh cuộn của trình duyệt xuất hiện ở ngoài cùng (`overflow-hidden`). Tông màu chủ đạo là xám trắng cực nhạt (`#fdfcfc`) kết hợp với màu xanh dương đậm (`#1e3a8a`) làm điểm nhấn thương hiệu.

- **Khung chứa ngoài cùng (Outer Container):**
  - Sử dụng layout Flexbox hàng ngang (`flex-row`), chiều rộng 100%, chiều cao 100vh, font chữ không chân (sans-serif), khử răng cưa chữ (`antialiased`), ẩn thanh cuộn ngoài (`overflow-hidden`), nền màu xám trắng rất nhẹ (`#fdfcfc`).

- **Cột Trái - Sidebar Danh sách Nhân viên (Employee Sidebar):**
  - Chiều rộng cố định: `300px`, cao 100% màn hình, không co giãn (`shrink-0`), khoảng đệm (padding) trên/dưới `24px`, trái `24px`, phải `12px` (tạo khoảng hở nhẹ với cột nội dung).
  - Thẻ Card chứa danh sách: Flexbox dọc (`flex-col`), cao 100%, nền màu trắng (`#ffffff`), viền xám mỏng (`#e5e5e5` dày 1px), bo góc `16px`, đổ bóng mờ nhẹ (`shadow-sm`).
    - *Tiêu đề Sidebar:* Nền xanh dương đậm (`#1e3a8a`), chữ màu trắng, đệm ngang `20px`, đệm dọc `16px`, cỡ chữ nhỏ (`12px`), chữ in hoa, in đậm, khoảng cách chữ giãn rộng (`tracking-wider`).
    - *Khung ô tìm kiếm:* Đệm ngang `16px`, dọc `12px`, không co giãn. Ô nhập liệu (Input) có nền trong suốt, bo góc phẳng, không có viền trên/trái/phải, chỉ có viền dưới màu đen mỏng (border-bottom), đệm dọc `12px`, đệm phải `20px`, đệm trái `40px` (để tránh chèn lên biểu tượng kính lúp bên trái). Không hiện đường viền bao quanh (outline/ring) khi nhấp chuột vào.
    - *Khu vực danh sách nhân viên:* Sử dụng vùng cuộn độc lập (ScrollArea), đệm ngang `8px`, đệm dưới `16px`. Các phần tử con cách nhau `4px` dọc.
    - *Nút nhân viên (Employee Button):* Chiều rộng 100%, Flexbox hàng ngang, căn giữa các thành phần theo chiều dọc (`align-items: center`), khoảng cách giữa các phần tử `12px`, đệm dọc `12px`, hiệu ứng chuyển đổi mượt mà (`duration-200`).
      - Khi được chọn: Nền xám nhạt (`#f5f3f1`), viền bên trái dày `4px` màu xanh dương đậm (`#1e3a8a`), đệm trái `12px`, đệm phải `16px`.
      - Khi không được chọn: Nền trong suốt, viền bên trái ẩn (`border-left-transparent`), đệm trái `16px`, đệm phải `16px`. Khi di chuột qua (hover) đổi sang nền xám nhạt (`#fdfcfc`).

- **Cột Phải - Vùng Nội dung Chính (Main Content Area):**
  - Chiếm toàn bộ chiều rộng còn lại (`flex-grow`), Flexbox cột dọc (`flex-col`), cao 100% màn hình, tự động xuất hiện thanh cuộn dọc khi nội dung vượt quá chiều cao (`overflow-y-auto`), đệm trên/dưới `24px`, đệm trái `12px`, đệm phải `24px`. Khoảng cách giữa 3 phân vùng chính là `24px` (`gap-6`).
  - **Phần 1: Thông tin nhân viên & Thẻ chỉ số (Unified Card Layout):**
    - Khung chứa: Nền trắng, viền xám mỏng (`#e5e5e5`), bo góc `16px`, đệm `20px`, Flexbox cột dọc trên thiết bị di động và hàng ngang trên màn hình lớn (`lg`), căn giữa dọc (trên màn hình lớn), phân bổ đều hai bên (`justify-between`), khoảng cách `24px`, đổ bóng mờ (`0px 0px 1px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.02)`).
    - Vùng Hồ sơ (Profile - bên trái): Flexbox ngang, căn dọc giữa, khoảng cách `16px`, đệm phải `24px`. Trên màn hình lớn, có viền phải màu xám mờ (`#e5e5e5` độ mờ 80%), chiều rộng tối thiểu `240px`, không co giãn.
    - Vùng chỉ số thống kê (Stats - bên phải): Lưới Grid (1 cột trên di động, 3 cột trên tablet trở lên), khoảng cách `16px`, chiếm toàn bộ không gian còn lại.
  - **Phần 2: Bảng chấm công dạng Lịch tháng (Monthly Calendar Grid):**
    - Lớp bộ lọc thời gian: Flexbox ngang, căn sang bên phải, khoảng cách `12px`, đệm dưới `8px`. Các hộp chọn (Select) rộng cố định `120px`.
    - Tiêu đề bảng lịch: Nền xanh dương đậm (`#1e3a8a`), chữ màu trắng, đệm ngang `20px`, đệm dọc `16px`, bo góc trên `16px`, bo góc dưới vuông (`rounded-t-[16px] rounded-b-none`). Flexbox ngang (cột dọc trên di động), phân bổ đều hai bên, căn giữa dọc. Chứa tên bảng chấm công bên trái và Chú thích màu sắc (Legend) bên phải.
    - Khung lưới lịch: Gắn liền ngay dưới header (không có viền trên, `border-t-0`), nền trắng, viền xám mỏng (`#e5e5e5`), bo góc dưới `16px`, bo góc trên vuông, bóng mờ nhẹ.
      - *Lưới tiêu đề thứ (CN, T2... T7):* Lưới Grid chia đều 7 cột, nền xám siêu nhạt (`#fdfcfc`), viền dưới xám mỏng, căn giữa chữ. Các ô tiêu đề có viền phải xám mỏng, trừ ô cuối cùng. Khoảng đệm dọc `12px`.
      - *Lưới ô ngày:* Lưới Grid chia đều 7 cột, viền trái xám mỏng, không viền trên. Các ô trống đầu tháng (đại diện cho ngày tháng trước) có nền xám nhạt mờ (`#fdfcfc` độ mờ 20%), viền phải và viền dưới xám mỏng.
  - **Phần 3: Biểu đồ (Charts Section):**
    - Lưới Grid (1 cột trên màn hình thường, 2 cột trên màn hình lớn `xl`), khoảng cách `24px`, lề dưới `24px`, không co giãn.
    - Mỗi ô biểu đồ gồm:
      - *Tiêu đề biểu đồ:* Nền xanh dương đậm (`#1e3a8a`), chữ trắng, đệm ngang `20px`, đệm dọc `16px`, bo góc trên `16px`, chữ in hoa, in đậm, cỡ chữ nhỏ (`12px`), khoảng cách chữ giãn (`tracking-wider`).
      - *Khung chứa đồ họa:* Nền trắng, viền xám mỏng xung quanh (trừ viền trên), bo góc dưới `16px`, đệm `20px`, đổ bóng nhẹ.

---

## 3. Phân rã Component (Component Decomposition)

Để đảm bảo tính tái sử dụng và tách biệt mã nguồn, giao diện được phân chia thành các Component con độc lập về mặt hiển thị và logic như sau:

### 3.1. Danh sách nhân viên (Employee List Sidebar)
Thành phần quản lý và hiển thị danh sách nhân viên phía bên trái.
- **Giao diện chi tiết:**
  - Danh sách cuộn chứa các phần tử nhân viên.
  - Mỗi phần tử nhân viên gồm:
    - *Avatar tròn (32x32px):* Nếu có `avatarUrl`, hiển thị ảnh thu nhỏ (cắt vừa khung `object-cover`). Nếu không có ảnh, hiển thị một khối hình tròn có màu nền và màu chữ pastel được sinh tự động, chứa 2 ký tự viết tắt của tên nhân viên.
    - *Thông tin văn bản:* Tên nhân viên ở trên (chữ đen, cỡ chữ 14px, in đậm, giới hạn trên 1 dòng `truncate`), Đội/Bộ phận làm việc ở dưới (chữ xám nhạt `#777169`, cỡ chữ 12px, giới hạn trên 1 dòng).
- **Logic xử lý (State, Hooks):**
  - **Lọc danh sách (Client-side search):** Sử dụng Hook `useMemo` theo dõi sự thay đổi của biến trạng thái tìm kiếm `searchQuery` và danh sách nhân viên gốc `employees`. Chuyển chuỗi tìm kiếm về dạng chữ thường và cắt khoảng trắng trước khi lọc chéo qua 3 trường dữ liệu: Tên (`name`), Mã số (`code`), Đội (`team`).
  - **Hàm chọn nhân viên:** Sự kiện `onClick` trên mỗi nút nhân viên gọi hàm `setSelectedEmployee(emp)` được truyền xuống từ component cha để thay đổi nhân viên đang được duyệt.
  - **Bảng mã màu Avatar ngẫu nhiên:** Hàm băm mã nhân viên `getAvatarStyle(code)` để sinh màu sắc ngẫu nhiên nhưng nhất quán cho các avatar không có ảnh:
    ```typescript
    const getAvatarStyle = (code: string) => {
      const num = parseInt(code.replace(/\D/g, ''), 10) || 0;
      const colors = [
        { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' }, // Green
        { bg: 'bg-[#e8eaf6]', text: 'text-[#3f51b5]' }, // Indigo
        { bg: 'bg-[#fce8e6]', text: 'text-[#c5221f]' }, // Red
        { bg: 'bg-[#fff3e0]', text: 'text-[#ef6c00]' }, // Orange
        { bg: 'bg-[#f3e5f5]', text: 'text-[#8e24aa]' }, // Purple
        { bg: 'bg-[#e0f7fa]', text: 'text-[#00838f]' }, // Cyan
      ];
      return colors[num % colors.length];
    };
    ```

### 3.2. Hồ sơ & Thống kê Tóm tắt (Profile & Stats Display)
Thành phần hiển thị thông tin tổng quan của nhân viên được chọn và tóm tắt công của tháng.
- **Giao diện chi tiết:**
  - *Vùng Hồ sơ:* Chứa Avatar lớn (56x56px, bo tròn, viền xám mỏng), Mã số nhân viên màu xám đậm (`#777169`, cỡ 11px), Tên nhân viên lớn (16px, đen, in đậm), và hai nhãn (Badge) nền xám nhạt (`#f5f3f1`) ghi rõ Đội nhóm (chữ đen) và Chức vụ (chữ xám).
  - *Vùng Thẻ thống kê:* Gồm 3 thẻ tương ứng với các trạng thái công:
    - **Đi Làm:** Nền xanh lá pastel `#e6f4ea`, chữ xanh đậm `#137333`. Số ngày in to đậm (36px). Icon chiếc cúp (`Award`) màu xanh lá đặt trong vòng tròn trắng mờ 60%.
    - **Nghỉ:** Nền đỏ pastel `#fce8e6`, chữ đỏ đậm `#c5221f`. Số ngày in to đậm (36px). Icon lịch (`Calendar`) màu đỏ đặt trong vòng tròn trắng mờ 60%.
    - **Đi muộn / Thiếu giờ:** Nền vàng pastel `#fef7e0`, chữ nâu cam đậm `#b06000`. Hiển thị tổng số ngày đi muộn + thiếu giờ. Icon tam giác cảnh báo (`AlertTriangle`) màu nâu cam đặt trong vòng tròn trắng mờ 60%.
- **Logic xử lý:**
  - **Viết tắt tên (Initials Fallback):** Sử dụng `useMemo` để trích xuất ký tự viết tắt của nhân viên được chọn. Tách tên bằng khoảng trắng. Nếu tên có từ 2 từ trở lên, lấy chữ cái đầu của 2 từ cuối ghép lại (ví dụ: "Nguyễn Văn A" -> từ cuối: "Văn", "A" -> lấy "V" và "A" -> "VA"). Nếu tên chỉ có 1 từ, lấy 2 ký tự đầu viết hoa.
  - Sử dụng trực tiếp dữ liệu số ngày đã được gom nhóm tính toán từ bảng công (`currentStats`): `totalWorkingDays`, `totalAbsentDays`, `totalLateDays`, `totalShortHours`.

### 3.3. Lưới lịch Chấm công (Monthly Calendar Card)
Thành phần cốt lõi hiển thị chi tiết lịch làm việc từng ngày trong tháng của nhân viên.
- **Giao diện chi tiết:**
  - Tiêu đề lưới ghi rõ tháng và năm đang xem kèm một hàng chú thích trạng thái màu sắc (Legend) nhỏ.
  - Hàng đầu tiên hiển thị các thứ từ CN đến T7.
  - Các ô lịch biểu thị cho từng ngày trong tháng (tối thiểu cao 96px, đệm 12px, Flexbox dọc phân bổ đều `justify-between`).
  - Thiết kế trực quan của các ô ngày dựa theo Trạng thái:
    - **Chưa đến (Ngày tương lai):** Nền xám nhạt mờ (`#f5f3f1` độ mờ 60%), chữ số ngày màu xám mờ. Giờ vào/ra hiển thị nét đứt `--:--`.
    - **Nghỉ:** Nền đỏ nhạt mờ (`#fce8e6` độ mờ 30%), chữ số ngày màu đỏ `#c5221f`. Góc trên bên phải xuất hiện nhãn nhỏ (Badge) ghi "NGHỈ" (nền đỏ `#fce8e6`, chữ đỏ `#c5221f`, bo tròn 12px, cỡ chữ 9px, in hoa đậm). Giờ vào/ra hiển thị nét đứt `--:--`.
    - **Đi muộn:** Nền xanh dương pastel mờ (`#e8f0fe` độ mờ 40%), chữ số ngày màu đen. Góc trên bên phải xuất hiện nhãn Badge ghi "MUỘN" (nền xanh `#e8f0fe`, chữ xanh `#0b57d0`). Phía dưới hiển thị thông tin: `Vào:` đi kèm giờ check-in đậm màu xanh dương, `Ra:` đi kèm giờ check-out đậm màu xanh dương (ví dụ: Vào: `08:35`, Ra: `17:00`).
    - **Thiếu giờ:** Nền vàng pastel mờ (`#fef7e0` độ mờ 45%), chữ số ngày màu đen. Góc trên bên phải xuất hiện nhãn Badge ghi "THIẾU" (nền vàng `#fef7e0`, chữ nâu cam `#b06000`). Phía dưới hiển thị thông tin: `Vào:` và `Ra:` đi kèm giờ check-in/out đậm màu nâu cam (ví dụ: Vào: `08:00`, Ra: `15:30`).
    - **Đi làm bình thường:** Nền xanh lá pastel mờ (`#e6f4ea` độ mờ 20%), chữ số ngày màu đen. Phía dưới hiển thị thông tin: `Vào:` và `Ra:` đi kèm giờ check-in/out đậm màu xanh lá cây `#137333` (ví dụ: Vào: `07:42`, Ra: `16:52`).
- **Logic xử lý (State, Hooks):**
  - **Tính số ô trống bù đầu tháng (Day Offset):** Hàm `useMemo` nhận diện thứ của ngày đầu tiên của tháng bằng cách khởi tạo `new Date(year, month - 1, 1).getDay()`. Kết quả trả về số từ `0` (Chủ Nhật) đến `6` (Thứ Bảy), dùng để render ra bấy nhiêu ô trống trước khi bắt đầu vẽ ngày mùng 1.
  - **Sinh dữ liệu lịch chấm công động (`currentRecords`):** 
    - Để phục vụ giao diện mẫu, dữ liệu lịch từng ngày được tự động sinh bằng thuật toán nhất quán (`useMemo` phụ thuộc vào `selectedEmployee`, `selectedMonth`, `selectedYear`):
      1. Tìm tổng số ngày của tháng bằng `new Date(year, month, 0).getDate()`.
      2. Chạy vòng lặp từ ngày `1` đến hết tháng. Với mỗi ngày, tính thứ của ngày đó bằng `new Date(year, month - 1, day).getDay()`.
      3. Xác định trạng thái của ngày:
         - Nếu ngày trong tháng > 28 (giả lập ngày tương lai): trạng thái = `'future'`.
         - Nếu là Chủ Nhật: trạng thái = `'absent'` (ngày nghỉ), giờ vào/ra rỗng.
         - Nếu là Thứ Bảy: trạng thái = `'short'` (làm nửa ngày), giờ vào `'08:00'`, giờ ra `'12:00'`.
         - Các ngày trong tuần khác (Thứ hai - Thứ sáu): sử dụng mã băm từ chữ cái cuối của ID nhân viên (`hash = employee.id.charCodeAt(lastIndex)`) để tạo tính ngẫu nhiên nhất quán:
           - Nếu `(ngày + hash) % 12` bằng `2`: trạng thái = `'late'` (đi muộn), vào lúc `'08:35'`, ra lúc `'17:00'`.
           - Nếu bằng `5`: trạng thái = `'absent'` (nghỉ phép), giờ vào/ra rỗng.
           - Nếu bằng `8`: trạng thái = `'short'` (về sớm/thiếu giờ), vào lúc `'08:00'`, ra lúc `'15:30'`.
           - Trường hợp khác: trạng thái = `'working'` (làm bình thường), giờ vào sinh động dạng `07:4{ngày % 5}`, giờ ra sinh động dạng `16:5{ngày % 5}`.
  - **Thống kê chỉ số chấm công tháng (`currentStats`):**
    - Sử dụng `useMemo` phụ thuộc vào mảng dữ liệu ngày `currentRecords` vừa sinh.
    - Lọc mảng để đếm số ngày theo từng loại trạng thái công để cấp cho phần 3.2.

### 3.4. Cặp Biểu đồ Phân tích (Analytics Charts)
Thành phần trực quan hóa dữ liệu thống kê chấm công.
- **Giao diện chi tiết:**
  - Gồm hai khối biểu đồ đặt cạnh nhau.
  - **Biểu đồ Donut (Tỉ lệ trạng thái công tháng hiện tại):** Biểu diễn cơ cấu các ngày Đi làm, Nghỉ, Thiếu giờ, Đi muộn trong tháng đã chọn của nhân viên.
  - **Biểu đồ Cột (Lịch sử công trong năm):** Biểu diễn số ngày nghỉ, thiếu giờ, đi làm của 12 tháng (từ T1 đến T12) dưới dạng các cột đơn lập đứng cạnh nhau.
- **Logic xử lý:**
  - **Dữ liệu biểu đồ tròn (`pieChartData`):** Định dạng dữ liệu từ kết quả `currentStats` sang cấu trúc đầu vào của thư viện biểu đồ, gán các mã màu hex tương ứng: Đi làm (`#10b981`), Nghỉ (`#ef4444`), Thiếu Giờ (`#f59e0b`), Đi Muộn (`#1a73e8`).
  - **Dữ liệu biểu đồ cột (`barChartData`):** Giả lập dữ liệu cho 12 tháng của năm đã chọn (`selectedYear`). Số liệu từng tháng được tính bằng công thức băm để tạo tính trực quan đa dạng nhưng đồng bộ:
    - Số ngày Nghỉ = `1 + ((thángIndex + hash) % 3)`
    - Số ngày Thiếu Giờ = `1 + ((thángIndex + hash) % 4)`
    - Số ngày Đi Làm = `14 + ((thángIndex + hash) % 4) * 2`

---

## 4. Dữ liệu & Biểu mẫu (Data & Form)

Màn hình này chủ yếu hoạt động ở chế độ đọc dữ liệu (Read-only) và lọc dữ liệu (Filter). 

- **Các trường tương tác (Inputs):**
  1. **Ô nhập Tìm kiếm (Search Input):**
     - Kiểu dữ liệu: Chuỗi (`string`).
     - Tác vụ: Lọc danh sách nhân viên theo thời gian thực (in-memory).
     - Kiểm tra dữ liệu (Validate): Không yêu cầu. Khi nhập chữ sẽ tự động chuyển về dạng chữ thường và cắt khoảng trắng đầu/cuối (`trim().toLowerCase()`).
  2. **Hộp chọn Tháng (Month Select):**
     - Kiểu dữ liệu: Chuỗi đại diện cho số tháng (`'1'` đến `'12'`).
     - Danh sách tùy chọn: Mảng 12 đối tượng gồm `{ label: "Tháng 1", value: "1" }` đến `{ label: "Tháng 12", value: "12" }`.
  3. **Hộp chọn Năm (Year Select):**
     - Kiểu dữ liệu: Chuỗi đại diện cho năm (`'2023'`, `'2024'`, `'2025'`).
     - Danh sách tùy chọn: Mảng 3 đối tượng gồm các năm `2023`, `2024`, `2025`.

- **Mô hình Dữ liệu Core (Data Models):**
  - **Nhân viên (Employee):**
    ```typescript
    interface Employee {
      id: string;          // Mã định danh duy nhất (ví dụ: 'emp_001')
      code: string;        // Mã số nhân viên hiển thị (ví dụ: 'NV001')
      name: string;        // Họ và tên nhân viên (ví dụ: 'Nguyễn Văn A')
      team: string;        // Tên phòng ban / đội nhóm (ví dụ: 'Đội Khai Thác')
      role: string;        // Chức vụ của nhân viên (ví dụ: 'Công Nhân')
      avatarUrl: string | null; // Link ảnh đại diện (hoặc null nếu dùng ảnh chữ cái)
    }
    ```
  - **Bản ghi chấm công ngày (DailyRecord):**
    ```typescript
    interface DailyRecord {
      date: string;        // Chuỗi định dạng ngày 'YYYY-MM-DD'
      dayOfWeek: 'CN' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';
      status: 'working' | 'absent' | 'late' | 'short' | 'future';
      checkIn: string;     // Giờ vào dạng 'HH:mm' (hoặc chuỗi rỗng nếu vắng mặt)
      checkOut: string;    // Giờ ra dạng 'HH:mm' (hoặc chuỗi rỗng nếu vắng mặt)
    }
    ```

- **Kết nối API & Tác vụ bất đồng bộ (API Interactions):**
  *Trong trường hợp triển khai thực tế kết nối cơ sở dữ liệu, cần xây dựng các API endpoints sau:*
  - **API Lấy danh sách nhân viên:**
    - Phương thức: `GET`
    - Đường dẫn: `/api/employees`
    - Phản hồi: Danh sách đối tượng nhân viên `Employee[]`.
  - **API Lấy chi tiết chấm công tháng:**
    - Phương thức: `GET`
    - Đường dẫn: `/api/timekeeping?employeeId={id}&month={month}&year={year}`
    - Phản hồi: Đối tượng chứa mảng chi tiết ngày làm việc `DailyRecord[]` và tóm tắt thống kê tháng `TimekeepingStats`.

---

## 5. Hướng dẫn Tái Cấu Trúc Độc Lập (Independent Rebuild Guide)
Để xây dựng lại màn hình này 100% trên một dự án khác hoàn toàn khác biệt (không dùng Tailwind CSS, không dùng các thư viện UI dùng chung đặc thù của dự án cũ), nhà phát triển hãy thực hiện theo đúng các bước sau đây sử dụng mã HTML và CSS thuần (Vanilla CSS) làm tiêu chuẩn:

### Bước 1: Khai báo cấu trúc HTML (DOM Tree)
Tạo cấu trúc các phần tử HTML như sau:
```html
<div class="app-layout">
  <!-- CỘT TRÁI: SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-card">
      <div class="sidebar-title">DANH SÁCH NHÂN VIÊN</div>
      <div class="search-wrapper">
        <input type="text" class="search-field" placeholder="Tìm kiếm..." />
      </div>
      <div class="employee-scroll-list">
        <!-- Lặp danh sách nhân viên bằng thẻ button -->
        <button class="employee-btn active">
          <div class="avatar-circle font-fallback" style="background-color: #e8f5e9; color: #2e7d32;">VA</div>
          <div class="employee-info">
            <span class="emp-name">Nguyễn Văn A</span>
            <span class="emp-team">Đội Khai Thác</span>
          </div>
        </button>
      </div>
    </div>
  </aside>

  <!-- CỘT PHẢI: NỘI DUNG CHÍNH -->
  <main class="main-content">
    
    <!-- PHẦN 1: PROFILE & THẺ THỐNG KÊ TÓM TẮT -->
    <section class="profile-stats-card">
      <div class="profile-detail">
        <div class="avatar-large">VA</div>
        <div class="profile-text">
          <span class="emp-code">Mã NV: NV001</span>
          <h3 class="emp-fullname">Nguyễn Văn A</h3>
          <div class="badge-row">
            <span class="badge">Đội Khai Thác</span>
            <span class="badge text-grey">Công Nhân</span>
          </div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-box box-green">
          <div class="stat-info">
            <span class="stat-label">SỐ NGÀY ĐI LÀM</span>
            <div class="stat-value">20 <span class="stat-unit">ngày</span></div>
          </div>
          <div class="stat-icon-wrapper">🏆</div>
        </div>
        <div class="stat-box box-red">
          <div class="stat-info">
            <span class="stat-label">SỐ NGÀY NGHỈ</span>
            <div class="stat-value">4 <span class="stat-unit">ngày</span></div>
          </div>
          <div class="stat-icon-wrapper">📅</div>
        </div>
        <div class="stat-box box-yellow">
          <div class="stat-info">
            <span class="stat-label">ĐI MUỘN / THIẾU GIỜ</span>
            <div class="stat-value">2 <span class="stat-unit">ngày</span></div>
          </div>
          <div class="stat-icon-wrapper">⚠️</div>
        </div>
      </div>
    </section>

    <!-- PHẦN 2: BỘ LỌC VÀ LỊCH CHẤM CÔNG THÁNG -->
    <section class="calendar-section">
      <div class="filters-row">
        <select class="select-dropdown"><option>Tháng 4</option></select>
        <select class="select-dropdown"><option>Năm 2024</option></select>
      </div>
      <div class="calendar-header-blue">
        <span class="calendar-title">Bảng Chấm Công Tháng 4/2024</span>
        <div class="legend-row">
          <span class="legend-item"><i class="dot bg-green"></i> Đi Làm</span>
          <span class="legend-item"><i class="dot bg-red"></i> Nghỉ</span>
          <span class="legend-item"><i class="dot bg-orange"></i> Thiếu Giờ</span>
          <span class="legend-item"><i class="dot bg-blue"></i> Đi Muộn</span>
          <span class="legend-item"><i class="dot bg-grey"></i> Chưa Đến</span>
        </div>
      </div>
      <div class="calendar-card-body">
        <div class="calendar-weekdays-grid">
          <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
        </div>
        <div class="calendar-days-grid">
          <!-- Các ô trống bù đầu tháng -->
          <div class="calendar-cell-empty"></div>
          <!-- Lặp các ô ngày thực tế -->
          <div class="calendar-day-cell cell-working">
            <div class="cell-top">
              <span class="day-num">1</span>
            </div>
            <div class="cell-bottom times-green">
              <div>Vào: <span class="time-bold">07:41</span></div>
              <div>Ra: <span class="time-bold">16:51</span></div>
            </div>
          </div>
          <div class="calendar-day-cell cell-absent">
            <div class="cell-top">
              <span class="day-num">7</span>
              <span class="badge-cell bg-red-pill">NGHỈ</span>
            </div>
            <div class="cell-bottom text-placeholder">--:--</div>
          </div>
        </div>
      </div>
    </section>

    <!-- PHẦN 3: BIỂU ĐỒ PHÂN TÍCH -->
    <section class="charts-grid">
      <div class="chart-box">
        <div class="chart-box-header">TÌNH TRẠNG CÔNG — THÁNG 4/2024</div>
        <div class="chart-box-content">
          <!-- Đồ thị Donut vẽ bằng thư viện JS hoặc SVG -->
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-box-header">THỐNG KÊ CHẤM CÔNG NĂM 2024</div>
        <div class="chart-box-content">
          <!-- Đồ thị cột Bar Chart vẽ bằng thư viện JS hoặc SVG -->
        </div>
      </div>
    </section>

  </main>
</div>
```

### Bước 2: Tạo tệp CSS quy chuẩn (Styling System)
Triển khai mã CSS thuần tương đương sau để tái lập giao diện chính xác:
```css
/* Thiết lập quy chuẩn chung */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #fdfcfc;
}

/* Cấu trúc Layout */
.app-layout {
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #fdfcfc;
}

/* Sidebar bên trái */
.sidebar {
  width: 300px;
  height: 100%;
  padding: 24px 12px 24px 24px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.sidebar-title {
  background-color: #1e3a8a;
  color: #ffffff;
  padding: 16px 20px;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-wrapper {
  padding: 12px 16px;
}

.search-field {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #000000;
  padding: 12px 20px 12px 40px;
  font-size: 14px;
  outline: none;
}

.employee-scroll-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 16px 8px;
}

.employee-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-left: 4px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s, border-left-color 0.2s;
  box-sizing: border-box;
}

.employee-btn:hover {
  background-color: #fdfcfc;
}

.employee-btn.active {
  background-color: #f5f3f1;
  border-left-color: #1e3a8a;
  padding-left: 12px;
}

/* Avatar hình tròn viết tắt */
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.employee-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.emp-name {
  font-size: 14px;
  font-weight: bold;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emp-team {
  font-size: 12px;
  color: #777169;
  margin-top: 2px;
}

/* Vùng nội dung chính bên phải */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 24px 24px 12px;
  gap: 24px;
  overflow-y: auto;
}

/* Card Hồ sơ và Thẻ chỉ số */
.profile-stats-card {
  background-color: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.02);
}

.profile-detail {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 24px;
  border-right: 1px solid rgba(229, 229, 229, 0.8);
  min-width: 240px;
}

.avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #e8eaf6;
  color: #3f51b5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.profile-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.emp-code {
  font-size: 11px;
  color: #777169;
  font-weight: 500;
}

.emp-fullname {
  font-size: 16px;
  font-weight: bold;
  color: #000000;
}

.badge-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  background-color: #f5f3f1;
  color: #000000;
  font-size: 10px;
  padding: 2px 8px;
  font-weight: 500;
  border-radius: 4px;
}

.badge.text-grey {
  color: #777169;
}

/* Lưới chỉ số tóm tắt */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  flex: 1;
}

.stat-box {
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-green { background-color: #e6f4ea; color: #137333; }
.box-red { background-color: #fce8e6; color: #c5221f; }
.box-yellow { background-color: #fef7e0; color: #b06000; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
}

.stat-unit {
  font-size: 11px;
  font-weight: normal;
}

.stat-icon-wrapper {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

/* Bộ lọc & Lịch tháng */
.calendar-section {
  display: flex;
  flex-direction: column;
}

.filters-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 8px;
}

.select-dropdown {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background-color: #ffffff;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.calendar-header-blue {
  background-color: #1e3a8a;
  color: #ffffff;
  padding: 16px 20px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-title {
  font-weight: bold;
  font-size: 14px;
}

.legend-row {
  display: flex;
  gap: 14px;
  font-size: 12px;
  font-weight: 500;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.bg-green { background-color: #10b981; }
.bg-red { background-color: #ef4444; }
.bg-orange { background-color: #f59e0b; }
.bg-blue { background-color: #1a73e8; }
.bg-grey { background-color: #e5e5e5; border: 1px solid rgba(255,255,255,0.2); }

/* Thân Card chứa lưới lịch */
.calendar-card-body {
  background-color: #ffffff;
  border: 1px solid #e5e5e5;
  border-top: none;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  overflow: hidden;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.02);
}

.calendar-weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #fdfcfc;
  border-bottom: 1px solid #e5e5e5;
  text-align: center;
}

.calendar-weekdays-grid > div {
  padding: 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #777169;
  border-right: 1px solid #e5e5e5;
}

.calendar-weekdays-grid > div:last-child {
  border-right: none;
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-left: 1px solid #e5e5e5;
}

.calendar-cell-empty {
  min-height: 96px;
  background-color: rgba(253, 252, 252, 0.2);
  border-right: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
}

.calendar-day-cell {
  min-height: 96px;
  padding: 12px;
  border-right: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: opacity 0.15s;
}

.calendar-day-cell:hover {
  opacity: 0.9;
}

.cell-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.day-num {
  font-size: 13px;
  font-weight: 600;
  color: #000000;
}

.badge-cell {
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 12px;
}

.bg-red-pill { background-color: #fce8e6; color: #c5221f; }
.bg-blue-pill { background-color: #e8f0fe; color: #0b57d0; }
.bg-yellow-pill { background-color: #fef7e0; color: #b06000; }

.cell-bottom {
  margin-top: 14px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-bottom.text-placeholder {
  color: rgba(119, 113, 105, 0.4);
  font-style: italic;
  text-align: right;
  font-size: 11px;
}

.times-green { color: #777169; }
.times-green .time-bold { color: #137333; font-weight: 600; }

.times-blue { color: #777169; }
.times-blue .time-bold { color: #0b57d0; font-weight: 600; }

.times-yellow { color: #777169; }
.times-yellow .time-bold { color: #b06000; font-weight: 600; }

/* Trạng thái màu sắc đặc biệt cho ô ngày */
.cell-future { background-color: rgba(245, 243, 241, 0.6); }
.cell-future .day-num { color: rgba(119, 113, 105, 0.4); }

.cell-working { background-color: rgba(230, 244, 234, 0.2); }
.cell-absent { background-color: rgba(252, 232, 230, 0.3); }
.cell-late { background-color: rgba(232, 240, 254, 0.4); }
.cell-short { background-color: rgba(254, 247, 224, 0.45); }

/* Khối biểu đồ */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.chart-box {
  display: flex;
  flex-direction: column;
}

.chart-box-header {
  background-color: #1e3a8a;
  color: #ffffff;
  padding: 16px 20px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chart-box-content {
  background-color: #ffffff;
  border: 1px solid #e5e5e5;
  border-top: none;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  padding: 20px;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Phản hồi responsive cơ bản */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .profile-stats-card {
    flex-direction: column;
    align-items: stretch;
  }
  .profile-detail {
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
    padding-right: 0;
    padding-bottom: 16px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

### Bước 3: Logic Dựng Lịch & Đổ dữ liệu động (Bằng Javascript thuần)
Nhà phát triển có thể sử dụng hàm sau để khởi tạo bảng lịch tự động trong ứng dụng của mình dựa trên tổ hợp tham số `month` (1-12) và `year` (ví dụ `2024`):
```javascript
function generateCalendar(year, month, employeeId) {
  const totalDays = new Date(year, month, 0).getDate();
  const startOffset = new Date(year, month - 1, 1).getDay(); // 0: CN, 1: T2 ...
  const dayOfWeekNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const hash = employeeId ? employeeId.charCodeAt(employeeId.length - 1) : 0;
  const records = [];

  for (let day = 1; day <= totalDays; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeekIndex = dateObj.getDay();
    const dayOfWeek = dayOfWeekNames[dayOfWeekIndex];
    
    // Ngày tương lai
    const isFuture = day > 28;
    
    let status = 'working';
    let checkIn = '08:00';
    let checkOut = '17:00';

    if (isFuture) {
      status = 'future';
      checkIn = '';
      checkOut = '';
    } else if (dayOfWeek === 'CN') {
      status = 'absent';
      checkIn = '';
      checkOut = '';
    } else if (dayOfWeek === 'T7') {
      status = 'short';
      checkIn = '08:00';
      checkOut = '12:00';
    } else {
      // Logic sinh dữ liệu ngẫu nhiên nhưng đồng bộ cho weekdays
      const seed = (day + hash) % 12;
      if (seed === 2) {
        status = 'late';
        checkIn = '08:35';
        checkOut = '17:00';
      } else if (seed === 5) {
        status = 'absent';
        checkIn = '';
        checkOut = '';
      } else if (seed === 8) {
        status = 'short';
        checkIn = '08:00';
        checkOut = '15:30';
      } else {
        status = 'working';
        const offset = day % 5;
        checkIn = `07:4${offset}`;
        checkOut = `16:5${offset}`;
      }
    }

    records.push({
      dayNum: day,
      dayOfWeek,
      status,
      checkIn,
      checkOut
    });
  }
  return { startOffset, records };
}
```
Sau đó, lập trình viên sử dụng hàm này kết hợp với mã HTML sinh động (ví dụ: dùng React `map`, Vue `v-for`, hoặc Javascript tạo DOM Element) để kết xuất chính xác kết quả lên màn hình.
