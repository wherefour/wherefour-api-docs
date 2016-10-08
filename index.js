var path = require('path');

var express = require('express');
var compression = require('compression');
var yaml = require('js-yaml');

var shins = require('shins/index.js');
var shinsDir = shins.srcDir();
var widdershins = require('widdershins');

var fetch = require('./fetch.js');

function checkParam(param,message,res) {
    if (param) return true;
    else {
        res.send('<html><h1>'+message);
        return false;
    }
}

var app = express();
app.use(compression());

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'index.html'))
});
app.get('/shins', function(req, res) {
    if (checkParam(req.query.url,'Please supply a URL parameter',res)) {
        fetch.get(req.query.url, {}, {}, function (err, resp, obj) {
            if (obj) {
                shins.render(obj, function(err, str){
                    res.send(str);
                });
            }
            else {
                res.status(500);
                res.end();
            }
        });
    }
});
app.get('/openapi', function (req, res) {
    if (checkParam(req.query.url,'Please supply a URL parameter',res)) {
        fetch.get(req.query.url, {}, {}, function (err, resp, obj) {
            if (obj) {
                var options = {};
                options.loadedFrom = req.query.url;
                try {
                    obj = JSON.parse(obj);
                }
                catch (ex) {
                    try {
                        obj = yaml.safeLoad(obj);
                    }
                    catch (ex) {}
                }
                if (typeof obj == 'object') {
                    var md = widdershins.convert(obj, options);
                    if (typeof req.query.raw !== 'undefined') {
                        res.send(md);
                    }
                    else {
                        shins.render(md, function (err, str) {
                            res.send(str);
                        });
                    }
                }
                else {
                    res.status(500);
                    res.end();
                }
            }
            else {
                res.status(404);
                res.end();
            }
        });
    }
});
app.use("/", express.static(shinsDir));

var myport = process.env.PORT || 5678;
if (process.argv.length > 2)
	myport = process.argv[2];

var server = app.listen(myport, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Shinola server listening at http://%s:%s', host, port);
});