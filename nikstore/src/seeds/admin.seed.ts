/**
 * Create or promote a user to admin.
 * Run: npx ts-node -r tsconfig-paths/register src/seeds/admin.seed.ts <phone> <password>
 * Example: npx ts-node -r tsconfig-paths/register src/seeds/admin.seed.ts 09121234567 MyStrongPass1
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nikstore';

const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
    firstName: String,
    lastName: String,
    email: String,
    password: { type: String, select: false },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  },
  { timestamps: true, strict: false },
);

function normalizePhone(phone: string): string {
  if (phone.startsWith('+98')) return '0' + phone.slice(3);
  if (phone.startsWith('98')) return '0' + phone.slice(2);
  return phone;
}

async function run() {
  const [, , rawPhone, plainPassword] = process.argv;

  if (!rawPhone || !plainPassword) {
    console.error('Usage: seed:admin <phone> <password>');
    process.exit(1);
  }

  if (!/^(\+98|0)?9\d{9}$/.test(rawPhone)) {
    console.error('Phone must match an Iranian mobile format, e.g. 09121234567');
    process.exit(1);
  }

  if (plainPassword.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }

  const phone = normalizePhone(rawPhone);
  const hashed = await bcrypt.hash(plainPassword, 12);

  await mongoose.connect(MONGODB_URI);
  const UserModel = mongoose.model('User', UserSchema, 'users');

  const existing = await UserModel.findOne({ phone });
  const user = await UserModel.findOneAndUpdate(
    { phone },
    { phone, password: hashed, isAdmin: true, role: 'admin', isActive: true },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  console.log(
    existing
      ? `Promoted existing user ${phone} to admin.`
      : `Created new admin user ${phone}.`,
  );
  console.log(`User id: ${user!._id}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
