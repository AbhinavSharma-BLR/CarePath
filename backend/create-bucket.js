import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const { data, error } = await supabase.storage.getBucket('prescriptions');
  if (error && error.message.includes('not found')) {
    console.log('Creating prescriptions bucket...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('prescriptions', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
    if (createError) {
      console.error('Failed to create bucket:', createError);
    } else {
      console.log('Bucket created successfully!');
    }
  } else if (error) {
    console.error('Error checking bucket:', error);
  } else {
    console.log('Bucket already exists.');
  }
}

main();
