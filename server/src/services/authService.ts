import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';

const SALT_ROUNDS = 10;

/** Shared hashing helper so every code path that needs to create a User
 * document (registration, the demo data seed script, etc.) hashes
 * passwords the exact same way instead of re-implementing it. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function validateRegisterInput({ name, email, password }: RegisterInput) {
  if (!name || name.trim().length < 2) {
    throw ApiError.badRequest('Name must be at least 2 characters');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ApiError.badRequest('A valid email is required');
  }
  if (!password || password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters');
  }
}

export async function registerUser(input: RegisterInput): Promise<{ user: IUser; token: string }> {
  validateRegisterInput(input);

  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({ name: input.name.trim(), email, passwordHash });

  const token = signToken(user._id.toString());
  return { user, token };
}

export async function loginUser(input: LoginInput): Promise<{ user: IUser; token: string }> {
  if (!input.email || !input.password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const email = input.email.trim().toLowerCase();
  // passwordHash is `select: false` on the schema, so it must be requested explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken(user._id.toString());
  return { user, token };
}

export async function getUserById(id: string): Promise<IUser> {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}
