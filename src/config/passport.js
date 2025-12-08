import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';           // correct relative path within src/config

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if email already exists (from regular signup)
        user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });

        if (user) {
          // Link Google account to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: profile.id,
              profilePicture: profile.photos[0]?.value,
              provider: 'google',
            },
          });

          // Ensure Agent profile exists for this user
          const existingAgent = await prisma.agent.findUnique({
            where: { userId: user.id },
          });

          if (!existingAgent && user.status === 'ACTIVE') {
            await prisma.agent.create({
              data: {
                userId: user.id,
                firstName: profile.name?.givenName || profile.displayName || 'User',
                lastName: profile.name?.familyName || '',
                dob: new Date('2000-01-01'), // Default DOB, can be updated later
              },
            });
          }

          return done(null, user);
        }

        // Create new user
        user = await prisma.user.create({
          data: {
            googleId: profile.id,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0]?.value,
            provider: 'google',
            status:'ACTIVE',
            emailVerified:true
            // password is null for OAuth users
          },
        });

        // Create Agent profile automatically for the new user
        if (user && user.status === 'ACTIVE') {
          await prisma.agent.create({
            data: {
              userId: user.id,
              firstName: profile.name?.givenName || profile.displayName || 'User',
              lastName: profile.name?.familyName || '',
              dob: new Date('2000-01-01'), // Default DOB, can be updated later
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;