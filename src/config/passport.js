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





passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3001/api/v1/auth/google/callback', // must match Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = getEmailFromProfile(profile);
        const photo = getPhotoFromProfile(profile);

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
        console.log("came here 1")
        if (user && user.status=="ACTIVE") {
          // Link Google to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              profilePicture: photo,
              provider: 'GOOGLE',
            },
          });
          console.log("came here 2")
          return done(null, user);
        }else{
          return res.json({error: "User needs to register before signing in"})
        }

   
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


export default passport;
