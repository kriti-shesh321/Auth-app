import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_PUBLIC_URL;
if (!connectionString) throw new Error('Database URL not set');

export const pool = new Pool({
  connectionString,
});