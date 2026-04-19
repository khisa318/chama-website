import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@db/schema';
import { env } from '../lib/env';

const connection = mysql.createPool(env.databaseUrl);

export const getDb = () => drizzle(connection, { schema, mode: 'default' });