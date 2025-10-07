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

    // Use stored procedure to bypass RLS (SECURITY DEFINER)
    const { data: registrationResult, error: registrationError } = await supabaseAdmin
      .rpc('register_organization_and_user' as any, {
        p_auth_user_id: authUser.user.id,
        p_email: email,
        p_full_name: fullName,
        p_organization_name: organizationName
      });

    if (registrationError) {
      logger.error({ err: registrationError }, 'Registration failed');
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      res.status(400).json({ error: registrationError.message || 'Failed to create organization and user' });
      return;
    }

    const result = registrationResult as any;
    if (!result || !result.organization_id || !result.user_id) {
      logger.error('Registration failed: invalid result');
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      res.status(400).json({ error: 'Failed to create organization and user' });
      return;
    }

    // Fetch created records for response
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', result.organization_id)
      .single();

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', result.user_id)
      .single();

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
