import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "demo_google_client_id";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "demo_google_client_secret";

const githubClientId = process.env.GITHUB_CLIENT_ID || "demo_github_client_id";
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || "demo_github_client_secret";

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0]?.value;
        const googleId = profile.id;
        const displayName = profile.displayName || profile.username || "Google User";
        const avatarUrl = profile.photos && profile.photos[0]?.value;

        if (!email) {
          return done(new Error("No email found from Google profile"), null);
        }

        let user = await User.findOne({ "oauthProviders.googleId": googleId });
        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.oauthProviders = user.oauthProviders || {};
          user.oauthProviders.googleId = googleId;
          if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
          await user.save();
          return done(null, user);
        }

        const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
        let username = baseUsername.toLowerCase();
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        user = await User.create({
          username,
          email: email.toLowerCase(),
          displayName,
          avatarUrl,
          emailVerified: true,
          oauthProviders: { googleId },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: githubClientId,
      clientSecret: githubClientSecret,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5001/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = (profile.emails && profile.emails[0]?.value) || `${profile.username}@github.user`;
        const githubId = profile.id;
        const displayName = profile.displayName || profile.username || "GitHub User";
        const avatarUrl = profile.photos && profile.photos[0]?.value;

        let user = await User.findOne({ "oauthProviders.githubId": githubId });
        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.oauthProviders = user.oauthProviders || {};
          user.oauthProviders.githubId = githubId;
          if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
          await user.save();
          return done(null, user);
        }

        let username = profile.username ? profile.username.toLowerCase() : `gh_${githubId}`;
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          username = `gh_${profile.username}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        user = await User.create({
          username,
          email: email.toLowerCase(),
          displayName,
          avatarUrl,
          emailVerified: true,
          oauthProviders: { githubId },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
