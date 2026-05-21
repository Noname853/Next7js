import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const peminjaman = await prisma.peminjaman.findUnique({ where: { id: parseInt(id) } })

  if (!peminjaman) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (peminjaman.status !== 'menunggu_verifikasi')
    return NextResponse.json({ error: 'Status tidak valid untuk verifikasi' }, { status: 400 })

  const updated = await prisma.peminjaman.update({
    where: { id: parseInt(id) },
    data: {
      status: 'dipinjam',
      tanggalVerifikasi: new Date(),
      verifiedBy: parseInt(session.user.id),
    },
  })

  return NextResponse.json(updated)
}
