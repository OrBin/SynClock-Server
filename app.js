var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var passport = require('passport');
var session = require('express-session');

const DATA_FILE = "data.txt";
var dataFilePath = path.resolve(__dirname + path.sep + DATA_FILE);

var hostname = 'localhost';
var port = 8081;

var app = express();
var router = express.Router();

var getTime = function(req, res, next) {

    fs.readFile(dataFilePath, function(err, data)
    {
        if (err)
        {
            res.status(500).send("Internal error occurred.");
            throw err;
        }
        else
        {
            fs.stat(dataFilePath, function(err, stats)
            {
                if (err)
                {
                    res.status(500).send("Internal error occurred.");
                    throw err;
                }
                else
                {
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });
                    res.end(data + " " + Math.floor(stats.mtime.getTime() / 1000));
                }
            });
        }
    });
};

var setTime = function(req, res, next) {

    var unixTime = req.query.time;

    if (unixTime == undefined || unixTime === "")
    {
        res.status(400).send("Parameter 'time' is required.");
    }
    else
    {
        var date = new Date(unixTime*1000);

        if (isNaN(date.getTime()))
        {
            res.status(400).send("Parameter 'time' must be a unix timestamp in seconds.");
            throw err;
        }
        else
        {
            fs.writeFile(dataFilePath, unixTime, {"mode": 0o660}, function(err)
            {
                if (err)
                {
                    res.status(500).send("Internal error occurred.");
                    throw err;
                }
                else
                {
                    console.log('Saved date successfully: ' + date.toString());
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Saved date successfully: ' + date.toString());

                }
            });
        }
    }
};

var dispTime = function(req, res, next) {

    fs.readFile(dataFilePath, function(err, data)
    {
        if (err)
        {
            res.status(500).send("Internal error occurred.");
            throw err;
        }
        else
        {
            fs.stat(dataFilePath, function(err, stats) {
                if (err) {
                    res.status(500).send("Internal error occurred.");
                    throw err;
                }
                else
                {
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });

                    var alarmDate = new Date(String(data) * 1000);
                    var modifiedDate = stats.mtime;

                    if (data == '0')
                    {
                        res.write("No alarm clocks are set.")
                    }
                    else
                    {
                        res.write("Next alarm clock:\n");
                        res.write(alarmDate.toString());
                    }

                    res.write("\n\n[Last updated ");

                    var millisecDiff = Date.now() - stats.mtime;

                    if (millisecDiff < 60*1000)
                    {
                        res.end("just now]")
                    }
                    else
                    {
                        var days = millisecDiff / 1000 / 60 / 60 / 24;
                        millisecDiff -= Math.floor(days) * 1000 * 60 * 60 * 24;
                        var hh = millisecDiff / 1000 / 60 / 60;
                        millisecDiff -= Math.floor(hh) * 1000 * 60 * 60;
                        var mm = millisecDiff / 1000 / 60;
                        millisecDiff -= Math.floor(mm) * 1000 * 60;

                        var num, unit;

                        if (Math.round(days) >= 1)
                        {
                            num = days;
                            unit = "day";
                        }
                        else if (Math.round(hh) >= 1)
                        {
                            num = hh;
                            unit = "hour";
                        }
                        else
                        {
                            num = mm;
                            unit = "minute";
                        }

                        num = Math.round(num);
                        if (num > 1)
                            unit = unit + "s";

                        res.end(num + " " + unit + " ago]")
                    }
                }
            });
        }
    });
};

// Route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // If user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // If they aren't, redirect them to the authentication page
    res.redirect('./auth/google');
}

// required for passport session
app.use(session({
    secret: require('./config/auth').sessionSecret,
    saveUninitialized: true,
    resave: true
}));

var GoogleStrategy = require('./passport')(passport);
app.use(passport.initialize());
app.use(passport.session());


router.get('/auth/google',
    passport.authenticate('google', {
        scope : ['profile', 'email']
    }));

// the callback after google has authenticated the user
router.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '../../disp',
        failureRedirect : '../../forbidden'
    }));

router.get('/', isLoggedIn, dispTime)

    .get('/get', isLoggedIn, getTime)
    .get('/get_time.php', isLoggedIn, getTime) // PHP path for backwards compatibility

    .get('/disp', isLoggedIn, dispTime)
    .get('/disp_time.php', isLoggedIn, dispTime) // PHP path for backwards compatibility

    .get('/set', setTime)
    .get('/set_time.php', setTime) // PHP path for backwards compatibility

    .get('/forbidden', function(req, res, next)
    {
        res.status(403).end("403 Forbidden\nYou are not authorized to access this page!")
    });

app.use(morgan('combined'));

app.use("/", router);

app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});
