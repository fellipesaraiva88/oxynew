import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { authLimiter } from '../middleware/rate-limiter.js';
import type { Tables, TablesInsert } from '../types/database.types.js';

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// Register organization and first user
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { organizationName, email, password, fullName } = req.body;

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      logger.error({ err: authError }, 'Auth user creation failed');
      res.status(400).json({ error: authError.message });
      return;
    }

    // Create organization
    const orgData: TablesInsert<'organizations'> = {
      name: organizationName,
      email
    };
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert(orgData)
      .select()
      .single() as { data: Tables<'organizations'> | null; error: any };

    if (orgError || !org) {
      logger.error('Organization creation failed', orgError);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      res.status(400).json({ error: orgError?.message || 'Failed to create organization' });
      return;
    }

    // Create user record
    const userData: TablesInsert<'users'> = {
      id: authUser.user.id,
      organization_id: org.id,
      email,
      full_name: fullName,
      role: 'owner'
    };
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single() as { data: Tables<'users'> | null; error: any };

    if (userError || !user) {
      logger.error('User creation failed', userError);
      res.status(400).json({ error: userError?.message || 'Failed to create user' });
      return;
    }

    // Create organization settings
    const settingsData: TablesInsert<'organization_settings'> = {
      organization_id: org.id
    };
    await supabaseAdmin
      .from('organization_settings')
      .insert(settingsData);

    res.json({
      success: true,
      organization: org,
      user
    });
  } catch (error: any) {
    logger.error('Registration error', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({
      success: true,
      session: data.session,
      user: data.user
    });
  } catch (error: any) {
    logger.error('Login error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', async (req, res): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    logger.info({ authHeader }, 'Auth header received');

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    logger.info({ tokenLength: token.length }, 'Token extracted');

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    logger.info({ user, error }, 'Supabase getUser result');

    if (error || !user) {
      logger.error({ error }, 'Invalid token from Supabase');
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    logger.info({ user_id: user.id }, 'Fetching profile for user');

    // Fetch user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      logger.error({ userError, code: userError?.code }, 'Error fetching user');
      res.status(500).json({ error: 'Failed to fetch user', details: userError?.message });
      return;
    }

    // Fetch organization separately to avoid RLS recursion
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single();

    if (orgError) {
      logger.warn({ orgError }, 'Error fetching organization, continuing without it');
    }

    // Combine data manually
    const profile = {
      ...userData,
      organizations: orgData || null
    };

    logger.info({ profile }, 'Profile fetched successfully');
    res.json({ user: profile });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Get user error');
    res.status(500).json({ error: error.message });
  }
});

export default router;
