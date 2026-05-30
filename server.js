<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GPS & Alamat Terbaru</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-sA+UjyK7iYj4kI8T9oFsWy5tYpYH4P1wYsGr1uJTf7k=" crossorigin="" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f6fb; color: #1f2937; }
    .container { max-width: 980px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    .back-link { display: inline-block; margin-bottom: 18px; text-decoration: none; color: #003f8a; font-weight: 700; }
    .card { background: #fff; border: 1px solid #d1d5db; border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
    .info-box { padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .info-box b { display: block; margin-bottom: 8px; color: #111827; }
    .info-item { margin-bottom: 12px; font-size: 15px; }
    .info-item span { display: block; color: #334155; }
    .map { width: 100%; min-height: 360px; border-radius: 14px; border: 1px solid #cbd5e1; overflow: hidden; }
    .image-box img { width: 100%; border-radius: 14px; display: block; }
    .meta-link { margin-top: 12px; display: inline-block; color: #1d4ed8; text-decoration: none; font-weight: 600; }
    .status { margin-top: 18px; font-size: 14px; color: #475569; }
    .empty { padding: 48px; text-align: center; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <a class="back-link" href="/">← Kembali ke halaman utama</a>
    <h1>GPS & Alamat Terbaru</h1>
    <div id="content"></div>
    <div id="status" class="status"></div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-o9N1j7kBoSAfQ+273J3z6bUyZ8s8XzkEy+f1f5eM92I=" crossorigin=""></script>
  <script>
    async function loadLatest() {
      const content = document.getElementById('content');
      const status = document.getElementById('status');
      status.textContent = 'Memuat lokasi terbaru...';

      try {
        const response = await fetch('/api/latest');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Gagal memuat data.');
        }

        const item = result.data;
        if (!item) {
          content.innerHTML = '<div class="empty">Belum ada data foto dan GPS yang tersimpan.</div>';
          status.textContent = '';
          return;
        }

        const lat = item.location.latitude;
        const lon = item.location.longitude;
        const time = new Date(item.location.timestamp).toLocaleString('id-ID');
        const address = await reverseGeocode(lat, lon);

        content.innerHTML = `
          <div class="card">
            <div class="row">
              <div class="info-box">
                <div class="info-item"><b>Latitude</b><span>${lat}</span></div>
                <div class="info-item"><b>Longitude</b><span>${lon}</span></div>
                <div class="info-item"><b>Akuras</b><span>${item.location.accuracy} meter</span></div>
                <div class="info-item"><b>Waktu GPS</b><span>${time}</span></div>
                <div class="info-item"><b>Alamat</b><span>${address}</span></div>
                <a class="meta-link" href="/uploads/${item.metaFile}" target="_blank">File metadata ${item.metaFile}</a>
              </div>
              <div class="map" id="map"></div>
            </div>
            <div class="image-box">
              <img src="${item.imageUrl}" alt="Capture image" />
            </div>
          </div>
        `;

        const map = L.map('map').setView([lat, lon], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        L.marker([lat, lon]).addTo(map).bindPopup('Lokasi terakhir').openPopup();

        status.textContent = 'Data terakhir ditampilkan.';
      } catch (error) {
        content.innerHTML = '<div class="empty">Terjadi kesalahan saat memuat data.</div>';
        status.textContent = error.message;
      }
    }

    async function reverseGeocode(lat, lon) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'GPS-Viewer/1.0' } });
        const data = await response.json();
        return data.display_name || 'Alamat tidak ditemukan';
      } catch (err) {
        return 'Alamat tidak tersedia';
      }
    }

    loadLatest();
  </script>
</body>
</html>
