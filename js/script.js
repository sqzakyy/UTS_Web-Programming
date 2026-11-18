/* Nama: [Nama Lengkap Anda] | NIM: [NIM Anda] | UTS Pemrograman Web Dasar */

// C1: Data menu (sumber utama harga, bukan teks di layar)
const dataMenu = [
  { kode: "K01", nama: "Kopi Susu Senja",     kategori: "Minuman", harga: 18000 },
  { kode: "K02", nama: "Americano",           kategori: "Minuman", harga: 15000 },
  { kode: "K03", nama: "Es Kopi Aren",        kategori: "Minuman", harga: 20000 },
  { kode: "K04", nama: "Teh Tarik",           kategori: "Minuman", harga: 14000 },
  { kode: "M01", nama: "Roti Bakar Cokelat",  kategori: "Makanan", harga: 16000 },
  { kode: "M02", nama: "Pisang Goreng Madu",  kategori: "Makanan", harga: 15000 },
  { kode: "M03", nama: "Nasi Goreng Kampung", kategori: "Makanan", harga: 25000 },
  { kode: "M04", nama: "Kentang Goreng",      kategori: "Makanan", harga: 17000 }
];

// Jam buka: [jam buka, jam tutup] untuk hari kerja dan akhir pekan
const JAM_KERJA = [8, 22];
const JAM_AKHIR_PEKAN = [7, 23];
const KUNCI_KERANJANG = "senja-keranjang";
const KUNCI_TEMA = "senja-tema";

// Elemen yang sering dipakai
const gridMenu = document.querySelector("#menu-grid");
const kartuMenu = document.querySelectorAll(".card");
const daftarKeranjang = document.querySelector("#daftar-keranjang");
const teksKosong = document.querySelector("#keranjang-kosong");
const tombolKosongkan = document.querySelector("#tombol-kosongkan");
const form = document.querySelector("#form-pesan");
const kotakKonfirmasi = document.querySelector("#konfirmasi");

let keranjang = [];           // isi: { kode, jumlah }
let kategoriAktif = "Semua";

/* ---------- Fungsi bantu ---------- */

const formatRupiah = (angka) => "Rp " + angka.toLocaleString("id-ID");
const cariMenu = (kode) => dataMenu.find((m) => m.kode === kode);

// localStorage dibungkus try/catch agar aman bila diblokir browser
function simpanLokal(kunci, nilai) {
  try { localStorage.setItem(kunci, nilai); } catch (e) { /* diabaikan */ }
}
function ambilLokal(kunci) {
  try { return localStorage.getItem(kunci); } catch (e) { return null; }
}

// Membuat elemen dengan kelas dan teks (aman dari injeksi HTML)
function buatEl(tag, kelas, teks) {
  const el = document.createElement(tag);
  if (kelas) el.className = kelas;
  if (teks !== undefined) el.textContent = teks;
  return el;
}

/* ---------- C5 & C6: Perhitungan (dipisah per fungsi) ---------- */

function hitungSubtotal() {
  return keranjang.reduce((jml, item) => jml + cariMenu(item.kode).harga * item.jumlah, 0);
}

// Mengembalikan persen diskon berdasarkan subtotal
function hitungPersenDiskon(subtotal) {
  if (subtotal >= 100000) return 15;
  if (subtotal >= 50000) return 10;
  return 0;
}

// Urutan: subtotal -> diskon (dari subtotal) -> total bayar
function hitungRingkasan() {
  const subtotal = hitungSubtotal();
  const persen = hitungPersenDiskon(subtotal);
  const diskon = Math.round((subtotal * persen) / 100);
  return { subtotal, persen, diskon, total: subtotal - diskon };
}

/* ---------- C3 & C4: Keranjang ---------- */

function tambahKeKeranjang(kode) {
  const ada = keranjang.find((item) => item.kode === kode);
  if (ada) ada.jumlah += 1;           // sudah ada: jumlah +1, bukan baris baru
  else keranjang.push({ kode, jumlah: 1 });
  perbaruiKeranjang();
}

function ubahJumlah(kode, selisih) {
  const item = keranjang.find((i) => i.kode === kode);
  if (!item) return;
  item.jumlah += selisih;
  if (item.jumlah <= 0) hapusItem(kode); // jumlah 0: baris hilang
  else perbaruiKeranjang();
}

function hapusItem(kode) {
  keranjang = keranjang.filter((item) => item.kode !== kode);
  perbaruiKeranjang();
}

function buatBaris(item) {
  const menu = cariMenu(item.kode);
  const li = buatEl("li", "item-keranjang");
  li.append(buatEl("span", "nama", menu.nama));
  li.append(buatEl("span", "subtotal", formatRupiah(menu.harga * item.jumlah)));
  li.append(buatEl("span", "satuan", formatRupiah(menu.harga) + " per porsi"));

  const kontrol = buatEl("span", "kontrol");
  const aksi = [["kurang", "-", "Kurangi " + menu.nama], ["jumlah", item.jumlah], ["tambah", "+", "Tambah " + menu.nama], ["hapus", "x", "Hapus " + menu.nama]];
  aksi.forEach(([jenis, teks, label]) => {
    if (jenis === "jumlah") { kontrol.append(buatEl("span", "qty", String(teks))); return; }
    const tombol = buatEl("button", jenis === "hapus" ? "hapus" : "", teks);
    tombol.type = "button";
    tombol.dataset.aksi = jenis;
    tombol.dataset.kode = item.kode;
    tombol.setAttribute("aria-label", label);
    kontrol.append(tombol);
  });
  li.append(kontrol);
  return li;
}

function perbaruiKeranjang() {
  daftarKeranjang.replaceChildren(...keranjang.map(buatBaris));
  teksKosong.hidden = keranjang.length > 0;
  tombolKosongkan.disabled = keranjang.length === 0;

  const { subtotal, persen, diskon, total } = hitungRingkasan();
  document.querySelector("#jumlah-item").textContent = keranjang.reduce((n, i) => n + i.jumlah, 0) + " item";
  document.querySelector("#teks-subtotal").textContent = formatRupiah(subtotal);
  document.querySelector("#teks-diskon").textContent = "- " + formatRupiah(diskon) + " (" + persen + "%)";
  document.querySelector("#teks-total").textContent = formatRupiah(total);

  simpanLokal(KUNCI_KERANJANG, JSON.stringify(keranjang)); // Bonus 1
}

// Memuat keranjang tersimpan; data tidak valid dibuang
function muatKeranjang() {
  try {
    const tersimpan = JSON.parse(ambilLokal(KUNCI_KERANJANG)) || [];
    keranjang = tersimpan.filter((i) => cariMenu(i.kode) && Number.isInteger(i.jumlah) && i.jumlah > 0);
  } catch (e) {
    keranjang = [];
  }
}

// Event delegation: satu listener untuk semua tombol di keranjang
daftarKeranjang.addEventListener("click", (e) => {
  const tombol = e.target.closest("button[data-aksi]");
  if (!tombol) return;
  const { aksi, kode } = tombol.dataset;
  if (aksi === "tambah") ubahJumlah(kode, 1);
  else if (aksi === "kurang") ubahJumlah(kode, -1);
  else hapusItem(kode);
});

// C3: tombol "Tambah" pada kartu menu (kode dibaca dari data-kode)
gridMenu.addEventListener("click", (e) => {
  const tombol = e.target.closest(".btn-tambah");
  if (tombol) tambahKeKeranjang(tombol.closest(".card").dataset.kode);
});

// C9: Kosongkan keranjang dengan konfirmasi
tombolKosongkan.addEventListener("click", () => {
  if (confirm("Kosongkan seluruh isi keranjang?")) {
    keranjang = [];
    perbaruiKeranjang();
  }
});

/* ---------- C2 + Bonus 3: Filter kategori dan pencarian ---------- */

function terapkanFilter() {
  const kata = document.querySelector("#cari").value.trim().toLowerCase();
  let tampil = 0;
  kartuMenu.forEach((kartu) => {
    const menu = cariMenu(kartu.dataset.kode);
    const cocokKategori = kategoriAktif === "Semua" || menu.kategori === kategoriAktif;
    const cocokKata = menu.nama.toLowerCase().includes(kata);
    const tampilkan = cocokKategori && cocokKata;
    kartu.classList.toggle("hidden", !tampilkan);
    if (tampilkan) tampil += 1;
  });
  document.querySelector("#menu-kosong").hidden = tampil > 0;
}

document.querySelectorAll(".btn-filter").forEach((tombol) => {
  tombol.addEventListener("click", () => {
    kategoriAktif = tombol.dataset.filter;
    document.querySelectorAll(".btn-filter").forEach((t) => t.classList.toggle("active", t === tombol));
    terapkanFilter();
  });
});
document.querySelector("#cari").addEventListener("input", terapkanFilter);

/* ---------- C7: Validasi form ---------- */

// Menampilkan/menghapus pesan error dan mengatur kelas .error / .valid
function setPesan(idError, pesan, elemen) {
  document.querySelector("#" + idError).textContent = pesan;
  elemen.classList.toggle("error", pesan !== "");
  elemen.classList.toggle("valid", pesan === "");
  return pesan === "";
}

function hariIni() {
  const t = new Date();
  const dua = (n) => String(n).padStart(2, "0");
  return t.getFullYear() + "-" + dua(t.getMonth() + 1) + "-" + dua(t.getDate());
}

const validasi = {
  nama() {
    const el = document.querySelector("#nama");
    const nilai = el.value.trim();
    const ok = /^[A-Za-z\s]+$/.test(nilai) && nilai.replace(/\s/g, "").length >= 3;
    return setPesan("err-nama", ok ? "" : "Nama minimal 3 huruf dan tanpa angka", el);
  },
  hp() {
    const el = document.querySelector("#hp");
    const ok = /^08\d{8,11}$/.test(el.value.trim());   // diawali 08, total 10-13 digit
    return setPesan("err-hp", ok ? "" : "Nomor HP tidak valid", el);
  },
  email() {
    const el = document.querySelector("#email");
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
    return setPesan("err-email", ok ? "" : "Format email tidak benar", el);
  },
  jenis() {
    const dipilih = document.querySelector('input[name="jenis"]:checked');
    return setPesan("err-jenis", dipilih ? "" : "Pilih jenis pesanan", document.querySelector("#grup-jenis"));
  },
  tanggal() {
    const el = document.querySelector("#tanggal");
    const ok = el.value !== "" && el.value >= hariIni();  // format YYYY-MM-DD bisa dibandingkan sebagai teks
    return setPesan("err-tanggal", ok ? "" : "Tanggal tidak boleh di masa lalu", el);
  },
  keranjang() {
    const ok = keranjang.length > 0;
    document.querySelector("#err-keranjang").textContent = ok ? "" : "Pilih minimal satu menu";
    return ok;
  }
};

// C8: Ringkasan pesanan ditampilkan di halaman (bukan alert)
function tampilkanKonfirmasi(nama, ringkasan) {
  const judul = buatEl("h3", "", "Pesanan diterima");
  const daftar = buatEl("ul");
  keranjang.forEach((item) => {
    const menu = cariMenu(item.kode);
    daftar.append(buatEl("li", "", menu.nama + " x" + item.jumlah + " = " + formatRupiah(menu.harga * item.jumlah)));
  });
  kotakKonfirmasi.replaceChildren(
    judul,
    buatEl("p", "", "Terima kasih, " + nama + ". Pesanan Anda:"),
    daftar,
    buatEl("p", "", "Total bayar: " + formatRupiah(ringkasan.total))
  );
  kotakKonfirmasi.hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  // Semua dijalankan (tanpa berhenti di error pertama) agar semua pesan tampil
  const hasil = Object.values(validasi).map((cek) => cek());
  if (hasil.includes(false)) {
    kotakKonfirmasi.hidden = true;
    return;
  }
  tampilkanKonfirmasi(document.querySelector("#nama").value.trim(), hitungRingkasan());

  // Kosongkan form dan keranjang
  form.reset();
  form.querySelectorAll(".error, .valid").forEach((el) => el.classList.remove("error", "valid"));
  document.querySelectorAll(".pesan-error").forEach((el) => { el.textContent = ""; });
  keranjang = [];
  perbaruiKeranjang();
  kotakKonfirmasi.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

/* ---------- C10: Status buka/tutup ---------- */

function cekStatusBuka() {
  const sekarang = new Date();
  const hari = sekarang.getDay();                       // 0 = Minggu, 6 = Sabtu
  const [buka, tutup] = (hari === 0 || hari === 6) ? JAM_AKHIR_PEKAN : JAM_KERJA;
  const jam = sekarang.getHours() + sekarang.getMinutes() / 60;
  const sedangBuka = jam >= buka && jam < tutup;
  const teks = document.querySelector("#status-buka");
  teks.textContent = sedangBuka ? "Kami sedang buka" : "Kami sedang tutup";
  teks.className = "status-buka " + (sedangBuka ? "buka" : "tutup");
}

/* ---------- Bonus 2: Mode gelap / terang ---------- */

function aturTema(tema) {
  document.documentElement.dataset.tema = tema;
  const tombolTema = document.querySelector("#tombol-tema");
  tombolTema.textContent = tema === "gelap" ? "\u2600" : "\u263E";   // matahari / bulan
  tombolTema.setAttribute("aria-label", tema === "gelap" ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  simpanLokal(KUNCI_TEMA, tema);
}

document.querySelector("#tombol-tema").addEventListener("click", () => {
  aturTema(document.documentElement.dataset.tema === "gelap" ? "terang" : "gelap");
});

/* ---------- Menu hamburger (ponsel) ---------- */

const tombolMenu = document.querySelector("#tombol-menu");
const navMenu = document.querySelector("#menu-nav");

function aturMenu(buka) {
  navMenu.classList.toggle("terbuka", buka);
  tombolMenu.setAttribute("aria-expanded", String(buka));
  tombolMenu.setAttribute("aria-label", buka ? "Tutup menu" : "Buka menu");
}

tombolMenu.addEventListener("click", () => aturMenu(!navMenu.classList.contains("terbuka")));
navMenu.addEventListener("click", (e) => { if (e.target.closest("a")) aturMenu(false); }); // tutup setelah memilih section
document.addEventListener("keydown", (e) => { if (e.key === "Escape") aturMenu(false); });

/* ---------- Inisialisasi ---------- */

document.querySelector("#tanggal").min = hariIni();
aturTema(ambilLokal(KUNCI_TEMA) === "gelap" ? "gelap" : "terang");
muatKeranjang();
perbaruiKeranjang();
terapkanFilter();
cekStatusBuka();
setInterval(cekStatusBuka, 60000);   // perbarui status tiap menit
