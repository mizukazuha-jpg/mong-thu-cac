# Mộng Thư Các v2 — Website truyện có quản trị, Netlify

## Có gì trong bản này?
- Trang đọc truyện công khai, responsive.
- Trang quản trị tại `/admin.html`.
- Tạo / sửa / xóa truyện và nhiều chương.
- Upload ảnh bìa; ảnh được lưu trên Netlify Blobs.
- Bình luận công khai theo từng truyện; quản trị có thể xóa bình luận.
- Dữ liệu truyện, ảnh và bình luận lưu trên Netlify Blobs nên vẫn còn sau khi deploy lại.
- Tìm kiếm, lọc trạng thái/thể loại, chế độ sáng tối, chỉnh cỡ chữ.

## Deploy lần đầu
1. Giải nén ZIP.
2. Tạo tài khoản Netlify: https://www.netlify.com/
3. Mở https://app.netlify.com/drop và kéo thả toàn bộ thư mục đã giải nén.
4. Đợi deploy xong, mở địa chỉ `...netlify.app`.
5. Mở `...netlify.app/admin.html` để thêm/sửa truyện.
6. Lần deploy đầu, dữ liệu seed mẫu hiển thị nếu chưa có dữ liệu trong Blobs. Khi lưu lần đầu trong admin, dữ liệu mẫu sẽ được lưu làm dữ liệu thật.

**Lưu ý:** Netlify Drop hỗ trợ deploy thủ công. Nếu deploy từ thư mục tĩnh qua Drop, Netlify Functions và dependency cần được build đúng cách. Cách khuyến nghị: kết nối repository GitHub hoặc dùng Netlify CLI để cài dependency và deploy Functions.

## Deploy khuyến nghị bằng GitHub
1. Tạo repository GitHub mới và upload toàn bộ file trong thư mục này.
2. Trong Netlify chọn Add new project → Import an existing project → GitHub.
3. Chọn repository.
4. Build command: để trống (hoặc `npm install` nếu giao diện yêu cầu cài dependencies).
5. Publish directory: `.` (dấu chấm).
6. Functions directory: `netlify/functions`.
7. Deploy. Netlify sẽ cài `@netlify/blobs` từ package.json và đóng gói Function.
8. Sau deploy, kiểm tra `/.netlify/functions/api` và trang `/admin.html`.

## Deploy bằng Netlify CLI
Cần Node.js 18+ và Netlify CLI:
```bash
npm install
npm install -g netlify-cli
netlify login
netlify link
netlify deploy --build
netlify deploy --build --prod
```

## Cách đăng truyện
- Mở `https://TEN-WEBSITE.netlify.app/admin.html`.
- Nhập tên truyện, tác giả, thể loại, trạng thái, mô tả.
- Chọn ảnh bìa (tối đa 4MB).
- Thêm từng chương, nhập tiêu đề/ngày/nội dung.
- Nhấn Lưu truyện.
- Vào trang chính để xem.

## BẢO MẬT — ĐỌC KỸ
Bạn đã chọn không dùng mật khẩu. Vì vậy trang quản trị và API ghi dữ liệu KHÔNG được bảo vệ: bất kỳ ai biết hoặc đoán được địa chỉ quản trị/API đều có thể thêm, sửa, xóa truyện, upload ảnh hoặc xóa bình luận. Đường dẫn khó đoán không phải là bảo mật. Bình luận công khai cũng có thể bị spam.

Không dùng bản không mật khẩu cho nội dung cần bảo vệ. Nếu sau này muốn bảo vệ, nên thêm xác thực Netlify Identity/Netlify Auth hoặc một lớp đăng nhập server-side và giới hạn API ghi dữ liệu; chỉ ẩn link quản trị không đủ.

## Ghi chú kỹ thuật
- Lưu trữ sử dụng Netlify Blobs qua Netlify Function `netlify/functions/api.mjs`.
- Stores: `mong-thu-cac-data`, `mong-thu-cac-images`, `mong-thu-cac-comments`.
- Không cần tạo biến môi trường cho Blobs khi chạy trong Netlify Functions.
- Dữ liệu khởi tạo mẫu ở `seed.json` đồng thời có fallback trong `app.js`. Có thể xóa truyện mẫu trong trang quản trị.
- Đây là nền tảng gọn cho website cá nhân, không phải CMS quy mô lớn; bình luận chưa có chống spam/rate-limit và lưu danh sách theo từng truyện trong một blob.


## Nội dung chương kết hợp chữ và ảnh
Trong trang quản trị, mỗi chương có thể gồm nhiều khối nội dung. Dùng **＋ Thêm đoạn chữ** và **＋ Chèn ảnh** để sắp xếp văn bản và ảnh xen kẽ theo thứ tự. Ảnh PNG/JPG/WEBP/GIF tối đa 4MB mỗi ảnh; có thể thêm chú thích. Các chương cũ chỉ có `content` vẫn được hiển thị bình thường.


## Tính năng bổ sung (bản nâng cấp)
- Độc giả có thể bấm **Đọc tiếp** ở thư viện để quay lại truyện, chương và vị trí cuộn đã đọc gần nhất. Tiến độ lưu trong localStorage của trình duyệt/thiết bị hiện tại.
- Trong mỗi chương ở trang quản trị, nút **Tải nhiều ảnh** cho phép chọn hàng loạt ảnh (ví dụ 60 ảnh) và tải tự động lần lượt. Có thanh tiến trình và danh sách tệp lỗi.
- Mỗi ảnh vẫn phải là PNG/JPG/WEBP/GIF và tối đa 4MB; ảnh được lưu vào Netlify Blobs như trước.
