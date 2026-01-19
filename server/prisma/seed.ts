import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashed = bcrypt.hashSync('elite24', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@elite24crm.com' },
    update: {},
    create: {
      email: 'admin@elite24crm.com',
      passwordHash: hashed,
      name: 'Elite24 Admin',
      role: 'ADMIN'
    }
  })
  console.log('✅ Admin seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
