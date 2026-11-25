<<<<<<< HEAD
# Bre Berber

Tunceli Atatürk Mahallesi — randevu ve galeri sitesi.  
Arayüz: React + TypeScript + Tailwind (Vite) · API: PHP PDO · DB: MySQL (XAMPP)

## Gereksinimler

- XAMPP (Apache + MySQL) — önerilen yol: `C:\xampp`
- Node.js 20+

## Veritabanı

1. XAMPP Control Panel → **Apache** ve **MySQL** Start
2. Proje masaüstündeyse `htdocs\berber` junction’ı oluşmuş olabilir; yoksa:
   - `mklink /J C:\xampp\htdocs\berber C:\Users\lenovo\Desktop\berber`
3. `api\.env` dosyasını kontrol et (`DB_PASS` boş olabilir)
4. Migrasyon + admin:

```bat
C:\xampp\php\php.exe api\scripts\migrate.php
C:\xampp\php\php.exe api\scripts\create_admin.php
C:\xampp\php\php.exe api\scripts\smoke_test.php
```

İlk admin (`.env`):

- E-posta: `admin@breberber.local`
- Şifre: `DegistirBeni123!` (değiştir)

## API

- Doğrudan: http://localhost/berber/api/public/
- Vite üzerinden proxy: http://localhost:5173/api/...

## Frontend

```bat
cd frontend
npm install
npm run dev
```

Tarayıcı: http://localhost:5173/

> `npm run build` bu projede agent tarafından çalıştırılmaz; build’i sen alırsın.

## Sayfalar

| Yol | Açıklama |
|-----|----------|
| `/` | Ana sayfa |
| `/galeri` | Galeri |
| `/randevu` | Randevu |
| `/giris` `/kayit` | Üyelik |
| `/hesabim` | Müşteri randevuları |
| `/admin` | Admin paneli |

## Notlar

- Randevu `pending` başlar; admin onaylar/reddeder. Bekleyen saat dolu sayılır.
- İptal: randevudan en az 2 saat önce.
- Slot: 30 dakika.
=======
# Berber-Randevu-Sistemi
Kullanıcıların berberlerinin sayfasına girip sistem üzerinde randevu alabilecekleri bir program
>>>>>>> 8e7221a555b6036477b7b46d1147e142c979639d
