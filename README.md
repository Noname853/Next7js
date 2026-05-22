# Inventaris TKJ

Aplikasi web untuk manajemen peminjaman alat di lab TKJ. Dibuat dengan Next.js 16, Prisma 7 (SQLite via libSQL adapter), dan NextAuth v5.

## Prasyarat

- **Node.js 20+** (disarankan 22 atau 24)
- **pnpm** — install sekali dengan: `npm install -g pnpm`
- **Git**

Cek versi:
```bash
node -v
pnpm -v
```

## Setup pertama kali

### 1. Clone repo

```bash
git clone https://github.com/Noname853/Next.js.git
cd Next.js
```

### 2. Install dependency

```bash
pnpm install
```

### 3. Buat file `.env`

Copy template lalu isi nilainya:

```bash
cp .env.example .env
```

Generate `AUTH_SECRET` (Git Bash / WSL / Linux / macOS):

```bash
openssl rand -base64 32
```

Buka `.env` di editor, isi seperti ini:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="tempel_hasil_openssl_disini"
```

> **Penting:** `AUTH_SECRET` **wajib** diisi. Tanpa nilai, aplikasi gagal start dengan error `AUTH_SECRET environment variable is required`.

### 4. Setup database

Sekali jalan saja — migrate + seed:

```bash
pnpm run setup
```

Perintah ini akan:
- Membuat file `dev.db` (SQLite)
- Menerapkan semua migration Prisma
- Mengisi data awal (admin + 3 siswa + 12 alat + contoh peminjaman)

### 5. Jalankan dev server

```bash
pnpm dev
```

Buka http://localhost:3000

## Akun default

| Role  | Email           | Password   |
|-------|-----------------|------------|
| Admin | admin@tkj.com   | admin123   |
| Siswa | budi@tkj.com    | siswa123   |
| Siswa | siti@tkj.com    | siswa123   |
| Siswa | ahmad@tkj.com   | siswa123   |

## Script yang tersedia

```bash
pnpm dev      # jalankan dev server (port 3000)
pnpm build    # build production
pnpm start    # jalankan hasil build
pnpm lint     # cek lint
pnpm seed     # re-seed database (tidak menghapus, pakai upsert)
pnpm run setup # migrate + seed (untuk setup pertama atau reset penuh)
```

## Reset database

Kalau database rusak / mau mulai dari nol:

```bash
rm dev.db
pnpm run setup
```

## Troubleshooting

**Error: `AUTH_SECRET environment variable is required`**
File `.env` tidak ada atau `AUTH_SECRET` belum diisi. Cek dengan `cat .env`. Lihat langkah 3.

**Error: `JWTSessionError: no matching decryption secret` + loop redirect**
Cookie session lama dienkripsi dengan secret berbeda. Hapus cookie `http://localhost:3000` di browser (DevTools → Application → Cookies → Clear) atau pakai jendela incognito.

**Error: `The Driver Adapter undefined, based on undefined`**
Versi lama dari `lib/prisma.ts` atau `prisma/seed.ts`. Pastikan adapter diberikan sebagai instance, bukan factory function:
```ts
adapter: new PrismaLibSql({ url })   // betul
adapter: async () => new PrismaLibSql({ url })   // salah
```

**Port 3000 sudah dipakai**
Jalankan di port lain:
```bash
pnpm dev -- --port 3001
```

## Struktur project

```
app/                  # Next.js App Router (pages + API routes)
  (protected)/        # halaman yang butuh login
  api/                # endpoint REST
components/           # komponen UI reusable
lib/
  auth.ts             # konfigurasi NextAuth
  prisma.ts           # Prisma client singleton
  generated/prisma/   # client hasil generate (tidak di-commit)
prisma/
  schema.prisma       # skema database
  migrations/         # history migration
  seed.ts             # data awal
```

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Prisma 7** dengan **libSQL adapter** untuk SQLite
- **NextAuth v5 (beta)** dengan provider Credentials
- **Tailwind CSS 4** + **Radix UI**
- **TypeScript 5**
