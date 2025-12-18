import prisma from '../../../config/db.js'
import { generateAccessToken, generateRefreshTokenValue, hashRefreshToken } from '../../../utils/token.js'

const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // 1) Issue short-lived access token
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      status: user.status,
    });

    // 2) Issue long-lived refresh token (store only hash)
    const rawRefreshToken = generateRefreshTokenValue();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const ttlDays = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 3) Set refresh token as httpOnly cookie
    //Refresh token is sent as cookie 
    //secure:Lax : Meaning Cookie is not sent on most cross-site requests but send on top level navigations
    //secure:None : Meaning Cookie is sent cross-site but browser requires https true
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.FRONTEND_URL?.startsWith('https://') ? 'None' : 'Lax',
      expires: expiresAt,
      path: '/',
      // domain: process.env.COOKIE_DOMAIN || undefined, // uncomment if you need a specific domain
    });

    // 4) Redirect with access token for the frontend to pick up
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`
    );
  } catch (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
  }
};


export {googleCallback}