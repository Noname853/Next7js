import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const skip = (page - 1) * limit
  const isAdmin = session.user.role === 'admin'
  const userId = parseInt(session.user.id)

  const where = {
    ...(isAdmin ? {} : { userId }),
    ...(status ? { status } : {}),
  }

  const [peminjamans, total] = await Promise.all([
    prisma.peminjaman.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, kelas: true } },
        details: {
          include: { alat: { select: { id: true, nama: true, kode: true, kategori: true } } },
        },
      },
    }),
    prisma.peminjaman.count({ where }),
  ])

  return NextResponse.json({ data: peminjamans, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Admin tidak dapat membuat peminjaman' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { keperluan, tanggalBatasKembali, catatan, items } = body
    const userId = parseInt(session.user.id)

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Sesi tidak valid, silakan login ulang' }, { status: 401 })
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!userExists) {
      return NextResponse.json({ error: 'Akun tidak ditemukan, silakan login ulang' }, { status: 401 })
    }

    if (!keperluan || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keperluan dan items wajib diisi' }, { status: 400 })
    }

    for (const item of items) {
      if (!item.alatId || typeof item.alatId !== 'number' || item.alatId <= 0) {
        return NextResponse.json({ error: 'Alat belum dipilih' }, { status: 400 })
      }
      if (!item.jumlah || item.jumlah < 1) {
        return NextResponse.json({ error: 'Jumlah harus minimal 1' }, { status: 400 })
      }
    }

    for (const item of items) {
      const alat = await prisma.alat.findUnique({
        where: { id: item.alatId },
        include: {
          peminjamanDetails: {
            where: { peminjaman: { status: { in: ['menunggu_verifikasi', 'dipinjam'] } } },
            select: { jumlah: true },
          },
        },
      })
      if (!alat) return NextResponse.json({ error: `Alat ID ${item.alatId} tidak ditemukan` }, { status: 400 })

      const dipinjam = alat.peminjamanDetails.reduce((sum, d) => sum + d.jumlah, 0)
      const stokTersedia = alat.stok - dipinjam
      if (stokTersedia < item.jumlah) {
        return NextResponse.json({ error: `Stok ${alat.nama} tidak mencukupi (tersedia: ${stokTersedia})` }, { status: 400 })
      }
    }

    const totalItems = items.reduce((sum: number, i: { jumlah: number }) => sum + i.jumlah, 0)

    const peminjaman = await prisma.peminjaman.create({
      data: {
        userId,
        totalItems,
        keperluan,
        catatan: catatan ?? null,
        tanggalPinjam: new Date(),
        tanggalBatasKembali: tanggalBatasKembali ? new Date(tanggalBatasKembali) : null,
        status: 'menunggu_verifikasi',
        details: {
          create: items.map((item: { alatId: number; jumlah: number; keterangan?: string }) => ({
            alatId: item.alatId,
            jumlah: item.jumlah,
            keterangan: item.keterangan ?? null,
          })),
        },
      },
      include: {
        details: { include: { alat: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(peminjaman, { status: 201 })
  } catch (err) {
    console.error('[POST /api/peminjaman]', err)
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
