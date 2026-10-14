/** The same rich document exercises both toolbar variants. */
export const EDITOR_DEMO_HTML = `<h2>Ghi chú dự án</h2>
<p>Chào <span class="ck-custom-mention" data-id="an" data-marker="@" contenteditable="false">@An</span>, đây là bản cập nhật <strong>tuần này</strong>.</p>
<p style="text-align:center;"><span style="color:#2457a7;font-size:18px;font-family:Arial;">Nội dung giữ nguyên khi đổi thanh công cụ.</span></p>
<ul><li>Hoàn thành bản thiết kế<ul><li>Kiểm tra trên màn hình nhỏ</li></ul></li><li>Đọc <a href="https://sdcorejs.github.io/sdcorejs-angular/" target="_blank" rel="noopener noreferrer">tài liệu Core UI</a></li></ul>
<figure class="table"><table><tbody><tr><th colspan="2">Kế hoạch</th></tr><tr><td>Thiết kế</td><td>Đã xong</td></tr><tr><td>Kiểm thử</td><td>Đang thực hiện</td></tr></tbody></table></figure>
<figure class="image" style="width:35%;"><img src="assets/brand/sdcorejs-logo.png" alt="Logo sdcorejs" loading="lazy" width="160"><figcaption>Ảnh có chú thích và kích thước riêng.</figcaption></figure>
<blockquote><p>Phím tắt và định dạng áp dụng trên phần văn bản đang chọn.</p></blockquote>`;

export const EDITOR_DEMO_MARKDOWN = `## Ghi chú nhanh

**Cần làm:** kiểm tra biểu mẫu và bàn phím.

- Hoàn thành thiết kế
- Đọc [tài liệu Core UI](https://sdcorejs.github.io/sdcorejs-angular/)

> Nội dung này được xuất dưới dạng Markdown.`;

/** This demo keeps the selected image in the HTML; no storage service is used. */
export function readDemoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Không đọc được ảnh.')));
    reader.onerror = () => reject(reader.error ?? new Error('Không đọc được ảnh.'));
    reader.readAsDataURL(file);
  });
}
