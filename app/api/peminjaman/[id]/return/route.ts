import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const peminjaman = await prisma.peminjaman.findUnique({ where: { id: parseInt(id) } })

  if (!peminjaman) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (peminjaman.status !== 'dipinjam')
    return NextResponse.json({ error: 'Status tidak valid untuk pengembalian' }, { status: 400 })

  const updated = await prisma.peminjaman.update({
    where: { id: parseInt(id) },
    data: {
      status: 'dikembalikan',
      tanggalKembali: new Date(),
      returnedBy: parseInt(session.user.id),
      catatanPengembalian: body.catatan ?? null,
    },
  })

  return NextResponse.json(updated)
}
