import { PrismaClient } from '@carepath/database';

const prisma = new PrismaClient();

async function main() {
  console.log('Enabling Row-Level Security (RLS) on all public tables...');
  
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
          t record;
      BEGIN
          FOR t IN
              SELECT tablename
              FROM pg_tables
              WHERE schemaname = 'public'
          LOOP
              EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
              RAISE NOTICE 'Enabled RLS on %', t.tablename;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Successfully enabled RLS on all tables in the public schema.');
    console.log('Since CarePath uses a custom Fastify API connected via Prisma (postgres user) and Supabase Service Role, this secures the tables from unauthorized public access via the Supabase anonymous data API, without breaking the backend functionality.');
  } catch (error) {
    console.error('❌ Failed to enable RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
