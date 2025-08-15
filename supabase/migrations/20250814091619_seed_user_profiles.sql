-- Migration: Seed User Profiles
-- Description: Create 18 verified user profiles for BPS Kota Batu employees
-- Date: 2025-08-14

-- First, let's check what's already in the database
DO $$
DECLARE
  existing_users_count INTEGER;
  existing_profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_users_count FROM auth.users;
  SELECT COUNT(*) INTO existing_profiles_count FROM public.profiles;
  
  RAISE NOTICE 'Current database state: % users, % profiles', existing_users_count, existing_profiles_count;
END $$;

-- Create a safer function that handles conflicts properly
CREATE OR REPLACE FUNCTION safe_create_user_profile(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_username TEXT,
  user_position TEXT,
  user_department TEXT
) RETURNS TEXT AS $$
DECLARE
  user_id UUID;
  result_message TEXT;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    result_message := 'User ' || user_email || ' already exists, skipping...';
    RAISE NOTICE '%', result_message;
    RETURN result_message;
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
    result_message := 'Profile for ' || user_email || ' already exists, skipping...';
    RAISE NOTICE '%', result_message;
    RETURN result_message;
  END IF;

  -- Generate a unique ID and ensure it's unique
  LOOP
    user_id := gen_random_uuid();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = user_id 
      UNION 
      SELECT 1 FROM public.profiles WHERE id = user_id
    );
  END LOOP;

  BEGIN
    -- Insert into auth.users with conflict handling
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('full_name', user_full_name, 'username', user_username),
      false,
      '',
      '',
      '',
      ''
    );

    -- Insert into profiles with conflict handling
    INSERT INTO public.profiles (
      id,
      email,
      username,
      full_name,
      position,
      department,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      user_username,
      user_full_name,
      user_position,
      user_department,
      NOW(),
      NOW()
    );

    result_message := 'Successfully created user and profile for ' || user_email;
    RAISE NOTICE '%', result_message;
    RETURN result_message;

  EXCEPTION WHEN OTHERS THEN
    result_message := 'Error creating user ' || user_email || ': ' || SQLERRM;
    RAISE NOTICE '%', result_message;
    RETURN result_message;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create users one by one with proper error handling
DO $$
DECLARE
  result TEXT;
  success_count INTEGER := 0;
  skip_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting user creation process...';
  
  -- Create each user and track results
  result := safe_create_user_profile(
    'herlina@gmail.com',
    '12345678',
    'Herlina Prasetyowati Sambodo, SST., M.Si',
    'herlina',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'yuniarni@gmail.com',
    '12345678',
    'Ir. Yuniarni Erry Wahyuti, MM',
    'yuniarni',
    'Statistisi Madya',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'adam@gmail.com',
    '12345678',
    'Adam Mahmud, SE, MM',
    'adam',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'gatot@gmail.com',
    '12345678',
    'Gatot Suharmoko, M.Si.',
    'gatot',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'muhammad@gmail.com',
    '12345678',
    'Muhammad Arief Nurohman, S.Si',
    'muhammad',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'sayu@gmail.com',
    '12345678',
    'Sayu Made Widiari, S.ST, M.Si',
    'sayu',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'eka@gmail.com',
    '12345678',
    'Eka Cahyani, S.ST',
    'eka',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'dwi@gmail.com',
    '12345678',
    'Dwi Esti Kurniasih, S.Si, M.AP, M.P.P.',
    'dwi',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'arif@gmail.com',
    '12345678',
    'Arif Nugroho Wicaksono, S.Si',
    'arif',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'gugus@gmail.com',
    '12345678',
    'FX Gugus Febri Putranto, SST, M.E.',
    'gugus',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'sulistyono@gmail.com',
    '12345678',
    'Sulistyono, SE',
    'sulistyono',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'adina@gmail.com',
    '12345678',
    'Adina Astasia, S.ST, M.Stat',
    'adina',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'eko@gmail.com',
    '12345678',
    'Eko Wibowo, SE',
    'eko',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'singgih@gmail.com',
    '12345678',
    'Singgih Wicaksono, SE',
    'singgih',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'nurlaila@gmail.com',
    '12345678',
    'Nurlaila Oktarahmayanti, S.ST',
    'nurlaila',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'dhika@gmail.com',
    '12345678',
    'Dhika Devara Prihastiono, S.ST',
    'dhika',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'mulia@gmail.com',
    '12345678',
    'Mulia Estiwilaras, SM',
    'mulia',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  result := safe_create_user_profile(
    'wahyu@gmail.com',
    '12345678',
    'Wahyu Mega Alfazip, A.Md.Kb.N.',
    'wahyu',
    'Statistisi Muda',
    'BPS Kota Batu'
  );
  IF result LIKE 'Successfully%' THEN success_count := success_count + 1;
  ELSIF result LIKE 'already exists%' THEN skip_count := skip_count + 1;
  ELSE error_count := error_count + 1; END IF;

  -- Final summary
  RAISE NOTICE 'User creation process completed!';
  RAISE NOTICE 'Summary: % users created, % skipped, % errors', success_count, skip_count, error_count;
END $$;

-- Clean up the function
DROP FUNCTION safe_create_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Final verification
DO $$
DECLARE
  final_users_count INTEGER;
  final_profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO final_users_count FROM auth.users;
  SELECT COUNT(*) INTO final_profiles_count FROM public.profiles;
  
  RAISE NOTICE 'Final database state: % users, % profiles', final_users_count, final_profiles_count;
END $$;

-- Note: All 18 users have been processed with:
-- - Email: [nama]@gmail.com
-- - Password: 12345678
-- - Full profile information
-- - Duplicate handling included
-- - Error handling included
-- - Detailed logging and summary
