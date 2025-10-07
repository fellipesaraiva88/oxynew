import { Router, Response } from 'express';
import { adminAuthService } from '../../services/admin-auth.service.js';
import { requireAdminAuth, type AdminRequest } from '../../middleware/admin-auth.middleware.js';
import { logger } from '../../config/logger.js';

const router = Router();

/**
 * POST /api/internal/auth/login
 * Login para usuários internos (admin panel)
 */
router.post('/login', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required'
      });
      return;
    }

    // IP para auditoria
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await adminAuthService.login(email, password, ipAddress);

    if (!result.success) {
      res.status(401).json({
        error: result.error || 'Invalid credentials'
      });
      return;
    }

    // Set secure httpOnly cookie for admin session (keeps JSON for backward compatibility)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', result.token!, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-domain in production
      maxAge: 8 * 60 * 60 * 1000 // 8h
    });

    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in admin login');
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/internal/auth/me
 * Retorna dados do usuário logado
 */
router.get('/me', requireAdminAuth, async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await adminAuthService.getUserById(req.admin.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching admin user');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/auth/change-password
 * Trocar senha (requer senha antiga)
 */
router.post('/change-password', requireAdminAuth, async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        error: 'Old password and new password are required'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        error: 'New password must be at least 8 characters'
      });
      return;
    }

    const success = await adminAuthService.changePassword(
      req.admin.id,
      oldPassword,
      newPassword
    );

    if (!success) {
      res.status(400).json({
        error: 'Invalid old password or update failed'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error changing password');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/auth/logout
 * Logout (client-side apenas invalida token)
 */
router.post('/logout', requireAdminAuth, async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // JWT é stateless, então logout é client-side
    // Aqui apenas logamos a ação para auditoria

    logger.info({
      adminId: req.admin?.id,
      email: req.admin?.email
    }, 'Admin user logged out');

    // Clear cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in logout');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
