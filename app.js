
// /* ===== DỮ LIỆU CHUNG =====
let danhSachAnh = [];   // mảng chứa 8 ảnh đã chụp (dạng dataURL)
let anhDaChon = [];   // mảng chứa index của 4 ảnh được chọn
let frameDaChon = null; // frame đang chọn (object {ten, url})
let dangChup = false;// đang trong quá trình chụp?


/* ===== FRAME CÓ SẴN =====
   Muốn thêm frame: thêm object vào mảng này
   - ten: tên hiển thị
   - url: đường dẫn file ảnh (đặt trong cùng thư mục)
   Ví dụ: { ten: "Frame hoa", url: "frames/hoa.png" } */
const FRAMES_CO_SAN = [
  { ten: "Không frame", url: null },
  // Thêm frame của bạn vào đây:
  // { ten: "Tên frame",  url: "frames/ten-frame.png" },
  { ten: "red_caro", url: "frames/red_caro_frame.png" },

];


/* ===== BƯỚC 1: CAMERA ===== */

// Bật camera từ laptop
async function batCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;
    document.getElementById("btn-chup").disabled = false;
    alert("✿ Camera đã bật! Nhấn 'Chụp 8 ảnh' để bắt đầu.");
  } catch (e) {
    alert("Không bật được camera. Hãy cho phép trình duyệt dùng camera nhé!");
  }
}


// Bắt đầu chụp 8 ảnh tự động
async function batDauChup() {
  if (dangChup) return;
  if (!document.getElementById("video").srcObject) {
    alert("Hãy bật camera trước!"); return;
  }
  if (danhSachAnh.length >= 8) {
    alert("Đã đủ 8 ảnh! Nhấn 'Chụp lại' nếu muốn xóa và chụp mới."); return;
  }

  dangChup = true;
  document.getElementById("btn-chup").disabled = true;

  // Tính số ảnh còn cần chụp
  const canChup = 8 - danhSachAnh.length;
  const giayDem = layGiayDemNguoc();

  for (let i = 0; i < canChup; i++) {
    await demNguoc(giayDem);   // đếm ngược
    await chupMotAnh();        // chụp 1 ảnh
    await cho(10000);            // nghỉ 10 giây trước khi chụp tiếp
  }

  dangChup = false;
  document.getElementById("btn-chup").disabled = false;
  document.getElementById("btn-xoa-het").style.display = "inline-block";
  document.getElementById("btn-chon-anh").style.display = "inline-block";
}


// Lấy số giây đếm ngược từ radio button
function layGiayDemNguoc() {
  const radio = document.querySelector('input[name="dem"]:checked');
  return radio ? parseInt(radio.value) : 3;
}


// Đếm ngược n giây rồi resolve
function demNguoc(giay) {
  return new Promise(resolve => {
    const hop = document.getElementById("dem-nguoc");
    let n = giay;

    function buoc() {
      hop.textContent = n;
      if (n === 0) {
        hop.textContent = "";
        resolve();
        return;
      }
      n--;
      setTimeout(buoc, 1000);
    }
    buoc();
  });
}


// Chụp 1 ảnh từ video, lưu vào danhSachAnh
async function chupMotAnh() {
  const video = document.getElementById("video");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;

  const ctx = canvas.getContext("2d");
  // Lật gương (giống gương soi)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  // Hiệu ứng flash
  const flash = document.getElementById("flash");
  flash.classList.add("hien");
  await cho(120);
  flash.classList.remove("hien");

  // Lưu ảnh và hiện thumbnail
  const dataURL = canvas.toDataURL("image/jpeg", 0.9);
  const viTri = danhSachAnh.length;
  danhSachAnh.push(dataURL);

  themThumbnail(viTri, dataURL);
  capNhatTienDo();
}


// Thêm 1 ô ảnh nhỏ vào lưới
function themThumbnail(viTri, dataURL) {
  const luoi = document.getElementById("luoi-anh");
  const div = document.createElement("div");
  div.className = "thumb";
  div.id = "thumb-" + viTri;
  div.innerHTML = `
    <img src="${dataURL}" alt="Ảnh ${viTri + 1}">
    <div class="so">${viTri + 1}</div>
    <button class="xoa" onclick="xoaAnh(${viTri})">✕</button>
  `;
  luoi.appendChild(div);
}


// Xóa 1 ảnh cụ thể
function xoaAnh(viTri) {
  danhSachAnh.splice(viTri, 1);
  veLaiThumbnail();
  capNhatTienDo();
  if (danhSachAnh.length < 8) {
    document.getElementById("btn-chon-anh").style.display = "none";
  }
}


// Vẽ lại toàn bộ thumbnail (sau khi xóa)
function veLaiThumbnail() {
  document.getElementById("luoi-anh").innerHTML = "";
  danhSachAnh.forEach((url, i) => themThumbnail(i, url));
}


// Cập nhật thanh tiến độ và số ảnh
function capNhatTienDo() {
  const n = danhSachAnh.length;
  document.getElementById("so-anh").textContent = `${n} / 8 ảnh`;
  document.getElementById("thanh-tien-do").style.width = `${(n / 8) * 100}%`;
}


// Xóa hết ảnh, chụp lại
function xoaHet() {
  if (!confirm("Xóa hết ảnh và chụp lại?")) return;
  danhSachAnh = [];
  veLaiThumbnail();
  capNhatTienDo();
  document.getElementById("btn-xoa-het").style.display = "none";
  document.getElementById("btn-chon-anh").style.display = "none";
}


/* ===== BƯỚC 2: CHỌN 4 ẢNH ===== */

function sangBuoc2() {
  if (danhSachAnh.length === 0) { alert("Chưa có ảnh!"); return; }
  anhDaChon = [];
  xayDungLuoiChon();
  hienBuoc(2);
}


// Hiển thị 8 ảnh để người dùng chọn
function xayDungLuoiChon() {
  const luoi = document.getElementById("luoi-chon");
  luoi.innerHTML = "";
  danhSachAnh.forEach((url, i) => {
    const div = document.createElement("div");
    div.className = "anh-chon";
    div.id = "chon-" + i;
    div.onclick = () => chonHoacBo(i);
    div.innerHTML = `
      <img src="${url}" alt="Ảnh ${i + 1}">
      <div class="phu"></div>
      <div class="badge" id="badge-${i}"></div>
    `;
    luoi.appendChild(div);
  });
}


// Chọn hoặc bỏ chọn 1 ảnh
function chonHoacBo(viTri) {
  const idx = anhDaChon.indexOf(viTri);
  if (idx !== -1) {
    // Bỏ chọn
    anhDaChon.splice(idx, 1);
  } else {
    if (anhDaChon.length >= 4) return; // đã đủ 4
    anhDaChon.push(viTri);
  }
  capNhatGiaoDienChon();
}


// Cập nhật giao diện bước 2
function capNhatGiaoDienChon() {
  // Reset tất cả
  danhSachAnh.forEach((_, i) => {
    document.getElementById("chon-" + i)?.classList.remove("da-chon");
    const badge = document.getElementById("badge-" + i);
    if (badge) badge.textContent = "";
  });

  // Đánh dấu ảnh đã chọn
  anhDaChon.forEach((viTri, stt) => {
    document.getElementById("chon-" + viTri)?.classList.add("da-chon");
    const badge = document.getElementById("badge-" + viTri);
    if (badge) badge.textContent = stt + 1;
  });

  document.getElementById("so-da-chon").textContent = anhDaChon.length;
  document.getElementById("btn-sang-frame").disabled = (anhDaChon.length !== 4);
}


/* ===== BƯỚC 3: FRAME ===== */

function sangBuoc3() {
  if (anhDaChon.length !== 4) { alert("Hãy chọn đúng 4 ảnh!"); return; }
  xayDungFrameCoSan();
  hienBuoc(3);
  veStripTruoc();
}


// Hiển thị danh sách frame có sẵn
function xayDungFrameCoSan() {
  const danhSach = document.getElementById("danh-sach-frame");
  danhSach.innerHTML = "";

  FRAMES_CO_SAN.forEach((frame, i) => {
    const div = document.createElement("div");
    div.className = "frame-item" + (i === 0 ? " da-chon" : "");
    div.onclick = () => chonFrame(frame, div);

    if (frame.url) {
      div.innerHTML = `<img src="${frame.url}" alt="${frame.ten}"><span>${frame.ten}</span>`;
    } else {
      div.innerHTML = `<div style="width:60px;height:150px;background:var(--kem-dam);border-radius:4px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">—</div><span>${frame.ten}</span>`;
    }
    danhSach.appendChild(div);
  });

  // Mặc định chọn frame đầu tiên
  if (FRAMES_CO_SAN.length > 0) {
    frameDaChon = FRAMES_CO_SAN[0];
  }
}


// Chọn 1 frame
function chonFrame(frame, phanTu) {
  frameDaChon = frame;
  // Bỏ chọn tất cả
  document.querySelectorAll(".frame-item").forEach(el => el.classList.remove("da-chon"));
  phanTu.classList.add("da-chon");
  veStripTruoc(); // vẽ lại xem trước
}


// Upload frame từ máy tính
function uploadFrame(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const frame = { ten: file.name, url: e.target.result };

    // Thêm vào đầu danh sách
    FRAMES_CO_SAN.unshift(frame);

    // Cập nhật giao diện và chọn luôn frame mới
    xayDungFrameCoSan();
    frameDaChon = frame;

    // Đánh dấu frame đầu tiên là đang chọn
    const phanTuDau = document.querySelector(".frame-item");
    if (phanTuDau) {
      document.querySelectorAll(".frame-item").forEach(el => el.classList.remove("da-chon"));
      phanTuDau.classList.add("da-chon");
    }

    veStripTruoc();
  };
  reader.readAsDataURL(file);
}


/* ===== VẼ PHOTO STRIP ===== */

/* Kích thước strip:
   - Rộng: 400px
   - Mỗi ảnh cao: ~250px (tỉ lệ 4:3)
   - Khoảng cách & viền: 20px mỗi bên
   Bạn có thể chỉnh các số này dưới đây */
function veStrip(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // --- Thông số (chỉnh ở đây nếu muốn thay đổi kích thước) ---
  const W = 400;   // chiều rộng strip
  const VIEN = 20;    // viền xung quanh
  const KHOANG = 10;    // khoảng cách giữa ảnh
  const CAO_ANH = Math.round((W - VIEN * 2) * 0.75); // tỉ lệ 4:3
  const CAO_TIEU = 50;    // chiều cao tiêu đề
  const CAO_CHAN = 40;    // chiều cao chân trang

  const H = VIEN + CAO_TIEU + 4 * (CAO_ANH + KHOANG) - KHOANG + CAO_CHAN + VIEN;
  canvas.width = W;
  canvas.height = H;

  // --- Nền ---
  ctx.fillStyle = "#ede8df";  // màu kem (đổi nếu muốn)
  ctx.fillRect(0, 0, W, H);

  // --- Viền ngoài ---
  ctx.strokeStyle = "#3a3530";
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, W - 6, H - 6);

  // --- Tiêu đề ---
  ctx.fillStyle = "#7a8a6e";
  ctx.fillRect(VIEN, VIEN, W - VIEN * 2, CAO_TIEU);
  ctx.fillStyle = "#ede8df";
  ctx.font = "bold 18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✿ PhotoBooth ✿", W / 2, VIEN + CAO_TIEU / 2);

  // --- Vẽ 4 ảnh ---
  const anhCan = anhDaChon.map(i => danhSachAnh[i]);
  let loaded = 0;

  anhCan.forEach((url, i) => {
    const img = new Image();
    img.onload = () => {
      const x = VIEN;
      const y = VIEN + CAO_TIEU + i * (CAO_ANH + KHOANG);

      // Nền trắng cho ảnh
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, W - VIEN * 2, CAO_ANH);

      // Vẽ ảnh (crop để vừa ô)
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, W - VIEN * 2, CAO_ANH);
      ctx.clip();
      const rong = W - VIEN * 2;
      const ty_le = Math.max(rong / img.width, CAO_ANH / img.height);
      const iw = img.width * ty_le;
      const ih = img.height * ty_le;
      ctx.drawImage(img, x + (rong - iw) / 2, y + (CAO_ANH - ih) / 2, iw, ih);
      ctx.restore();

      // Viền ảnh
      ctx.strokeStyle = "#7a8a6e";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, rong, CAO_ANH);

      loaded++;

      // Sau khi vẽ xong 4 ảnh thì vẽ frame lên trên
      if (loaded === 4) veFrame(ctx, canvas, W, H);
    };
    img.src = url;
  });

  // --- Chân trang ---
  ctx.fillStyle = "#7a8a6e";
  ctx.font = "12px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.7;
  const homNay = new Date().toLocaleDateString("vi-VN");
  ctx.fillText(homNay, W / 2, H - VIEN / 2 - 8);
  ctx.globalAlpha = 1;
}

// Vẽ frame PNG lên trên (frame có nền trong suốt)
function veFrame(ctx, canvas, W, H) {
  if (!frameDaChon || !frameDaChon.url) return; // không có frame thì thôi

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, W, H); // vẽ frame phủ toàn bộ strip
  };
  img.src = frameDaChon.url;
}

// Vẽ canvas xem trước (bước 3)
function veStripTruoc() {
  if (anhDaChon.length !== 4) return;
  veStrip("canvas-truoc");
}


/* ===== BƯỚC 4: LƯU ẢNH ===== */

function sangBuoc4() {
  hienBuoc(4);
  veStrip("canvas-cuoi"); // vẽ lại vào canvas cuối
}

// Tải ảnh xuống máy tính
function taiAnh() {
  // Vẽ lại một lần nữa để chắc chắn có đủ ảnh
  veStrip("canvas-cuoi");

  // Chờ 1 giây để ảnh tải xong rồi mới tải về
  setTimeout(() => {
    const canvas = document.getElementById("canvas-cuoi");
    const link = document.createElement("a");
    link.download = "photobooth-" + Date.now() + ".jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }, 1000);
}

// Làm mới, bắt đầu lại từ đầu
function batDauLai() {
  danhSachAnh = [];
  anhDaChon = [];
  frameDaChon = null;
  document.getElementById("luoi-anh").innerHTML = "";
  capNhatTienDo();
  document.getElementById("btn-xoa-het").style.display = "none";
  document.getElementById("btn-chon-anh").style.display = "none";
  hienBuoc(1);
}


/* ===== ĐIỀU HƯỚNG GIỮA CÁC BƯỚC ===== */

// Hiện section của bước n, ẩn các bước khác
function hienBuoc(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById("buoc-" + i);
    if (el) el.style.display = (i === n) ? (i === 1 ? "grid" : "block") : "none";
  }
}

// Nút quay lại
function quayLai(buc) { hienBuoc(buc); }


/* ===== HÀM PHỤ ===== */

// Chờ ms mili giây
function cho(ms) { return new Promise(r => setTimeout(r, ms)); }
