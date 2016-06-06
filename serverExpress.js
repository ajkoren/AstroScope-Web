/*jslint node:true*/
"use strict";

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
app.use(cookieParser());

var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
//var mailer = require("mailer");

var db = require("./js/pg");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/transits', function (req, res) {
    console.log("transits");
    res.sendFile(__dirname + '/transits.html');
});

app.get('/progressions', function (req, res) {
    console.log("progressions");
    res.sendFile(__dirname + '/progressions.html');
});

function chart(id, name, lat, long, utc_dt, tz, type) {
    this.id = id;
    this.name = name
    this.lat = lat;
    this.long = long;
    this.utc_dt = utc_dt;
    this.tz = tz;
    this.type = type;
}

app.post('/save', urlencodedParser, function (req, res) {
    console.log("save");
    var chartName = req.body.chartName;
    var chartType = req.body.chartType;
    res.cookie('chartName', chartName);
    res.cookie('chartType', chartType);
    
    var email = req.cookies.email;
    var lat = req.cookies.lat;
    var long = req.cookies.long;
    var utc = req.cookies.utc;
    var tz = req.cookies.tz;
    console.log('email: ' + email + ', chartName: ' + chartName + ', chartType: ' + chartType); 
    console.log('lat: ' + lat + ', long: ' + long + 
                ', datetime: ' + utc + ', tz: ' + tz);
    
    var saveChart = new chart(0, chartName, lat, long, utc, tz, chartType);
    db.saveChart(email, saveChart, function(dbRes) {
        if (dbRes) {
            console.log("save chart id: " + dbRes.rows);
            res.sendFile(__dirname + '/list.html');
        } else {
            res.status(200).json(dbRes);
        }
    });
});

app.get('/list', function (req, res) {
    console.log("list");
    
    var email = req.cookies.email;
    //var dest = req.cookies.dest;
    var asLogged = req.cookies.asLogged;
    if (asLogged) {
        console.log("list for: " + email);

        db.list(email, function(dbRes) {
            if (dbRes) {
                console.log(JSON.stringify(dbRes.rows, null, "    "));
                //res.cookie('list', dbRes);
                //res.redirect(dest);
                res.status(200).json(dbRes.rows);
            }
        });
    } else {
        res.status(500);
    }
});

app.get('/delete', function (req, res) {
    console.log("delete");
    
    var email = req.cookies.email;
    var chartId = req.query.chartId;
    var asLogged = req.cookies.asLogged;
    if (asLogged) {
        console.log("delete for email: ", email, ", chartId: " + chartId);

        db.deleteChart(email, chartId, function(dbRes) {
        if (dbRes ==0) {
            console.log("deleted successfuly; redirecting");
            //console.log(JSON.stringify(dbRes.rows, null, "    "));
            res.redirect("/list.html");
        }
        });
    } else {
        res.status(500);
    }
});


app.get('/send', function (req, res) {
    console.log("send");
    res.sendFile(__dirname + '/send.html');
});

app.get('/print', function (req, res) {
    console.log("print");
    res.sendFile(__dirname + '/print.html');
});

app.post('/register', urlencodedParser, function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var pw = req.body.pw;
    var dest = req.cookies.dest;
    console.log("register: dest=", dest, ", name=", name, ", email=", email, ", pw=", pw);

    db.register(name, email, pw, function(dbRes) {
        if (dbRes > 0) {
            if (dbRes == 23505) { // duplicate key
                res.cookie('asLogged', '-3');
            } else {
                res.cookie('asLogged', '-1');
            }
            res.cookie('email', email);
            res.clearCookie('pw');
            res.redirect("/account.html");
        } else if (dbRes == 0) {
            res.cookie('asLogged', '1');
            res.cookie('email');
            res.clearCookie('pw');
            res.redirect(dest);
        }
    });
});

app.post('/settings', urlencodedParser, function (req, res) {
    var oldEmail = req.body.oldEmail;
    var name = req.body.name;
    var email = req.body.email;
    var pw = req.body.pw;
    console.log("settings: oldEmail=", oldEmail, ", name=", name, ", email=", email, ", pw=", pw);

    db.settings(oldEmail, name, email, pw, function(dbRes) {
        if (dbRes > 0) {
            res.cookie('updated', '-1');
        } else if (dbRes == 0) {
            res.cookie('updated', '1');
        }
        res.cookie('name', name);
        res.cookie('email', email);
        res.redirect("/settings.html");
    });
});

app.post('/login', urlencodedParser, function (req, res) {
    var email = req.body.email;
    var pw = req.body.pw;
    
    var dest = req.cookies.dest;
    console.log("login: dest=", dest, ", email=", email, ", pw=", pw);
    
    db.login(email, pw, function(dbRes, name) {
        if (dbRes) {
            res.cookie('name', name);
            res.cookie('email', email);
            res.cookie('asLogged', '1');
            res.clearCookie('pw');
            
            var logObj = {
                logged: 1,
                name: name,
                email: email
            }
            res.cookie('log', logObj);
            
            console.log("logObj: ", logObj);
            
            res.redirect(dest);
        } else {
            res.cookie('asLogged', '-1');
            res.redirect("/login.html");
        }
    });
});

app.get('/users', urlencodedParser, function (req, res) {
    var retObj = 
            [{"id": "3",
            "fname": "John",
            "lname": "Doe"
            },
            {"id": "4",
            "fname": "Jane",
            "lname": "Doe"
            }];

    res.status(200).json(retObj);
});

app.set('json spaces', 2);

app.get('/email', function (req, res) {
    console.log('email');
    
    // Solution, following this link:
    // https://github.com/nodemailer/nodemailer-wellknown/issues/3
    // 1) I used this link to set astroscope@gmail.com to use a "less secure" connection:
    // https://www.google.com/settings/security/lesssecureapps
    // 2) At some point, I should replace this solution with use of OAuth2. Here's a guide:
    // http://masashi-k.blogspot.it/2013/06/sending-mail-with-gmail-using-xoauth2.html

    var lat = req.query.lat;
    var long = req.query.long;
    var utc = req.query.utc;
    var tz = req.query.tz;
    var from = req.query.from;
    var to = req.query.to;
    var cc = req.query.cc;
    var msg = req.query.msg;
    
    console.log('host = ' + req.get('host'));
    console.log('lat: ' + lat + ', long: ' + long + 
                ', datetime: ' + utc + ', tz: ' + tz);
    console.log('from: ' + from + ', to: ' + to + ', cc: ' + cc + ', msg: ' + msg);

    var link = req.protocol + "://" + req.get('host') + "/print" +
        "?lat=" + lat + "&long=" + long + "&utc=" + utc + "&tz=" + tz;
    
    var htmlText = 
        '<div id="rtetext" class="cm-rtetext undoreset fullSSL" role="document" ' +
        'aria-label="Message Body" spellcheck="true" autocorrect="false">' +
        msg + '<br><br>' +
        'You received an astrological chart from ' + from + '. <br>' +
        'To view the chart, please follow this link: </p>' +
        '<br>' +
        '<a href="' + link + '">' + link + '</a></p>' +
        '<br></p></div>';

    var transporter = nodemailer.createTransport(smtpTransport({
        transport: "SMTP",
        host: "smtp.gmail.com",
        secureConnection : false,
        port: 587,
        requireAuth: true,
        domains: ["gmail.com", "googlemail.com"],
        auth : {
            user: "astroscope2016@gmail.com",
            pass: "Jonny123"
        }
    }));
    
    var mailOptions = {
        from: "AstroScope <astroscope2016@gmail.com>",
        to: to,
        cc: cc,
        subject: from + " sent you a message",
        //text: htmlText,
        generateTextFromHTML: true,
        html: htmlText
    }
    
    transporter.sendMail(mailOptions, function(error, response) {
    //mailer.send(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
        }else{
            console.log("Message sent: ");
            res.send("<html><head><title>Email sent</title></head>" +
                     "<body><h3>Email sent</h3>" +
                     "<input type='button' value='Close window' onclick='window.close()'>" +
                     "</body>" +
                     "</html>");
        }

        transporter.close();
    });
});

/* serves main page */
app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

/* serves all the static files */
app.get(/^(.+)$/, function (req, res) { 
    //console.log('static file request: ', req.params);
    //console.log(req.params);
    res.sendFile( __dirname + req.params[0]); 
});


app.listen(3000);
console.log('Server w/Express running at http://localhost:3000');

module.exports = app;
