var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = 'harrypotter';

module.exports = function(app, passport) {


    app.use(passport.initialize());
    app.use(passport.session());
    app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true, cookie: { secure: false } }));

    passport.serializeUser(function(user, done) {
        if (user.active) {
            token = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' });
        } else {
            token = 'inactive/error'
        }
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new FacebookStrategy({
            clientID: '1426211850783332',
            clientSecret: '629827c56f42a50dd0a8ce61bb74e577',
            callbackURL: "http://localhost:8080/auth/facebook/callback",
            profileFields: ['id', 'displayName', 'photos', 'email']
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile._json.email }).select('username active password email').exec(function(err, user) {
                if (err) done(err);

                if (user && user != null) {
                    done(null, user);
                } else {
                    done(err);
                }
            });
        }
    ));

    passport.use(new GoogleStrategy({
            clientID: '222026588030-22ufi2s10r2t577d791o54oifvvluu6g.apps.googleusercontent.com',
            clientSecret: 'SvW9xF_x8cpbB-w14O-ylpWl',
            callbackURL: "http://localhost:8080/auth/google/callback"
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile.emails[0].value }).select('username active password email').exec(function(err, user) {
                if (err) done(err);

                if (user && user != null) {
                    done(null, user);
                } else {
                    done(err);
                }
            });
        }
    ));

    app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/googleerror' }), function(req, res) {
        res.redirect('/google/' + token);
    });

    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/facebookerror' }), function(req, res) {
        res.redirect('/facebook/' + token);
    });
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

    return passport;
}