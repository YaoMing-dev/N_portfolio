# Portfolio — Nguyễn Lê Bảo Ngân

Portfolio dạng game pixel 2D. Người xem điều khiển nhân vật đi trên bản đồ, bước vào từng ngôi nhà để đọc nội dung, và đi ra thuyền để xem thông tin liên hệ.

**Live:** https://baongan.vercel.app

---

## ⚠️ QUY TẮC CẬP NHẬT — ĐỌC TRƯỚC KHI SỬA BẤT KỲ THỨ GÌ

> **Dự án đã hoàn thiện và được khoá lại.**
>
> Việc cập nhật về sau **chỉ gồm một loại duy nhất: thêm ảnh / video mới vào mục "Works & Projects"**, theo đúng hướng dẫn ở phần [Thêm ảnh / video mới](#thêm-ảnh--video-mới) bên dưới.
>
> **Không chỉnh sửa** phần engine game, va chạm, bố cục bản đồ, CSS responsive, hay logic cuộn trang.

Lý do khoá: toàn bộ toạ độ nhà cửa, đường đi, vùng va chạm và phần responsive trên mobile phụ thuộc lẫn nhau rất chặt. Chỉ cần đổi một con số toạ độ là có thể chặn đường vào nhà hoặc làm hỏng bố cục mobile mà không hề báo lỗi — những lỗi này chỉ lộ ra khi thao tác tay trên máy thật.

Các file thuộc diện **không sửa**:

| File | Vai trò |
|---|---|
| `scripts/game.js` | Engine game: di chuyển, va chạm, cuộn trang, responsive |
| `scripts/data.js` | Toạ độ nhà, cửa, đường đi (dùng cho va chạm) |
| `style.css` | Toàn bộ giao diện, bao gồm bố cục mobile |
| `index.html` | Cấu trúc bản đồ và các ngôi nhà |

Ngoại lệ duy nhất: khối `projectGalleries` trong `index.html` — xem bên dưới.

---

## Thêm ảnh / video mới

Toàn bộ danh sách tác phẩm nằm trong biến `projectGalleries` ở cuối `index.html` (khoảng dòng 497). Đây là **nơi duy nhất** cần sửa khi có tác phẩm mới.

Có 5 bộ sưu tập:

| Khoá | Hiển thị | Loại |
|---|---|---|
| `image_editor` | Ảnh Edit | ảnh |
| `ai_image_editor` | AI Ảnh Edit | ảnh |
| `video_editor` | Video Edit | video |
| `ai_video_editor` | AI Video Edit | video |
| `recently_project` | Recently Project | video |

### Thêm một tấm ảnh

1. Chép file ảnh vào thư mục tương ứng, ví dụ `Project/editor/` hoặc `Project/AI editor/`.
2. Mở `index.html`, tìm bộ sưu tập cần thêm, và thêm một dòng vào mảng `items`:

```js
{ title: "Ảnh Edit Showcase #5", thumb: "Project/editor/ten-file-anh.jpg" }
```

### Thêm một video

1. Chép file video (`.mp4`) vào thư mục video, ví dụ `video/AI/`.
2. Chép **ảnh thumbnail** của video vào `Project/thumbs/<tên-bộ-sưu-tập>/`.
3. Thêm một khối vào mảng `items`:

```js
{
    title: "Tên video",
    thumb: "Project/thumbs/ai_video_editor/ten-thumbnail.jpg",
    video: "video/AI/ten-file-video.mp4",
    tag: "CapCut PC • Motion Design",
    desc: "Mô tả ngắn về video."
}
```

### Lưu ý khi thêm

- Đường dẫn phân biệt **chữ hoa/chữ thường** và phải khớp tuyệt đối với tên file thật (Vercel chạy trên Linux, khác với Windows).
- Nếu tên file có dấu cách hoặc tiếng Việt có dấu, vẫn dùng được, nhưng nên đặt tên không dấu, không khoảng trắng để chắc chắn.
- Sau khi thêm, nhớ cập nhật con số trong tiêu đề bộ sưu tập nếu có, ví dụ `"Dự Án Ảnh Edit (4 Hình Ảnh)"` → `(5 Hình Ảnh)`.
- Video nên nén gọn trước khi thêm; file quá nặng sẽ làm trang tải chậm trên điện thoại.

---

## Chạy thử trên máy

Trang là HTML/CSS/JS thuần, không cần cài đặt gì. Mở terminal tại thư mục dự án:

```bash
python -m http.server 8000
```

Rồi mở `http://localhost:8000/index.html`.

**Quan trọng:** trình duyệt cache rất dai các file `.js` và `.css`. Sau khi sửa, luôn nhấn `Ctrl+Shift+R` (hard refresh) hoặc mở tab ẩn danh, nếu không bạn sẽ thấy bản cũ và tưởng là thay đổi không có tác dụng.

### Cần kiểm tra tay sau mỗi lần thêm media

1. Mở mục **Works & Projects** (ngôi nhà thứ ba), bấm vào bộ sưu tập vừa sửa.
2. Ảnh/video mới hiện đúng thumbnail, bấm vào phát/phóng to được.
3. Thử lại trên khung hình điện thoại (DevTools → chế độ mobile).

---

## Cấu trúc thư mục

```
index.html              Trang chính: bản đồ, 3 ngôi nhà, danh sách tác phẩm
style.css               Toàn bộ giao diện + responsive
reset.css               CSS reset
scripts/
  game.js               Engine game (di chuyển, va chạm, cuộn trang)
  data.js               Toạ độ nhà / cửa / đường
  jquery-1.6.3.min.js   Thư viện jQuery
  jquery.spritely-0.6.js Thư viện animation sprite nhân vật
images/                 Ảnh nền, nhà cửa, nhân vật, giao diện
Project/                Ảnh tác phẩm
  editor/               Ảnh Edit
  AI editor/            AI Ảnh Edit
  thumbs/               Thumbnail cho các video
video/                  File video tác phẩm
fonts/                  Font pixel
```

---

## Triển khai

Đẩy code lên nhánh `main` là Vercel tự động build và cập nhật `baongan.vercel.app`. Không cần thao tác gì thêm.
