import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';

// Helper: safely get email, photo, and names from Google profile
//Profile is basically information sent by google after oAuth
function getEmailFromProfile(profile) {
  return profile?.emails?.[0]?.value?.toLowerCase() || null;
}

function getPhotoFromProfile(profile) {
  return profile?.photos?.[0]?.value || null;
}

function getNameFromProfile(profile) {
  return {
    firstName: profile?.name?.givenName || profile?.displayName || 'User',
    lastName: profile?.name?.familyName || '',
  };
}

// Helper: ensure an Agent record exists for an ACTIVE user
//user is the parameter of user of our db
//names is the parameter we got from the google oAuth
async function ensureAgentForActiveUser(user, names) {
  if (!user || user.status !== 'ACTIVE') return;

  // const existingAgent = await prisma.agent.findUnique({
  //   where: { userId: user.id },
  // });

  // //Just In Case the user doesnt exist
  // if (!existingAgent) {
  //   await prisma.agent.create({
  //     data: {
  //       userId: user.id,
  //       firstName: names.firstName || 'User',
  //       lastName: names.lastName || '',
  //       dob: new Date('2000-01-01'), // default DOB; editable later
  //     },
  //   });
  // }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = getEmailFromProfile(profile);
        const photo = getPhotoFromProfile(profile);
        const { firstName, lastName } = getNameFromProfile(profile);

        // Log In Logic(If already signed with google before)
        let user = await prisma.user.findUnique({ where: { googleId } });
        //null basically here means no error
        if (user) {
          return done(null, user);
        }

        // If user does not exist for this email
        if (!email) {
          return done(new Error('Google profile has no email'), null);
        }

        //Log In Logic for fist time (Practically Speaking)
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Link Google to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              profilePicture: photo,
              provider: 'google',
            },
          });

          await ensureAgentForActiveUser(user, { firstName, lastName });
          return done(null, user);
        }

        // 3) Sign Up Logic(Practically speaking)
        user = await prisma.user.create({
          data: {
            googleId,
            email,
            profilePicture: photo,
            provider: 'google',
            status: 'ACTIVE',
            emailVerified: true,
            // password is null for OAuth users
          },
        });

        await ensureAgentForActiveUser(user, { firstName, lastName });
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


export default passport;
