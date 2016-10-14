var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');

const DATA_FILE = "data.txt";
var dataFilePath = path.resolve(__dirname + path.sep + DATA_FILE);

var hostname = 'localhost';
var port = 8081;

var app = express();
var router = express.Router();

/* GET home page. */

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

router.get('/', dispTime)
    .get('/get', getTime)
    .get('/disp', dispTime)
    .get('/set', setTime)
    // PHP paths for backwards compatibility
    .get('/get_time.php', getTime)
    .get('/disp_time.php', dispTime)
    .get('/set_time.php', setTime);


app.use(morgan('combined'));

app.use("/", router);
app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});
