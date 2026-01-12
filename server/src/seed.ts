import bcrypt from 'bcrypt';
import prisma from './client.js';

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@amarillosecurity.com' },
        update: {},
        create: {
            email: 'admin@amarillosecurity.com',
            passwordHash: hashedPassword,
            name: 'Admin User',
        },
    });

    console.log('✅ Admin user created:', admin.email);
    console.log('   Email: admin@amarillosecurity.com');
    console.log('   Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
