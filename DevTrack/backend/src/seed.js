const bcrypt = require('bcryptjs');
const prisma = require('./prismaClient');

async function main() {
  const email = 'admin@devtrack.com';
  const password = 'admin123';

  console.log(`Checking for existing admin user (${email})...`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('Admin user already exists! You can log in with:');
    console.log(`Email: ${email}`);
    console.log(`Password: (the password you previously set, default was admin123)`);
    return;
  }

  console.log('Creating default admin user...');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.create({
    data: {
      name: 'Administrator',
      email: email,
      password: hashedPassword,
    },
  });

  console.log('✅ Default admin successfully created!');
  console.log('-------------------------------------------');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
