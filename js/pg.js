"use strict";

var pg = require("pg");

var conString = "pg://postgres:alan123@localhost:5432/postgres";
var client = new pg.Client(conString);
client.connect();

function testDb() {
    //var client = new pg.Client(conString);
    //client.connect();

    // client.query("CREATE TABLE IF NOT EXISTS astro_users(" +
    //    "id serial primary key, name varchar(30), email varchar(30), pw varchar(30)))");

    //client.query("INSERT INTO astro_users(name, email, pw) " +
    //             "values($1, $2, $3)", ['AK Gmail', 'ajkoren@gmail.com', '123456']);
    //client.query("INSERT INTO astro_users(name, email, pw) " +
    //             "values($1, $2, $3)", ['AK Yahoo', 'ajkoren@yahoo.com', '123456']);
    //client.query("INSERT INTO astro_charts(chart_name, latitude, longitude, utc_datetime, tz) " +
    //             "values($1, $2, $3, $4, $5)", 
    //             ['AK chart', 32.79, 35.00, '1959-12-22 16:51', 3]);

    var testEmail = 'ajkoren@gmail.com';
    var testPw = '123456';
    
    var query = client.query(
        "SELECT name, email, pw " +
        "FROM astro_users " +
        "WHERE email = $1 and pw = $2",
        [testEmail, testPw]
    );
    query.on("error", function (err) {
        console.log('test error. code: ', err.code, ", message: ", err.message);
        callback(err.code);
    });
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        console.log(JSON.stringify(result.rows, null, "    "));
        //client.end();
    });

//    var query = client.query(
//        "SELECT chart_name, latitude, longitude, utc_datetime, tz " + 
//        "FROM astro_charts ORDER BY chart_name");
//    query.on("row", function (row, result) {
//        result.addRow(row);
//    });
//    query.on("end", function (result) {
//        console.log(JSON.stringify(result.rows, null, "    "));
//        client.end();
//    });
}

testDb();

exports.login = function(email, pw, callback) {
    console.log('login. email = "' + email + '", pw = "' + pw + '"');

    //var client = new pg.Client(conString);
    //client.connect();

    var query = client.query(
        "SELECT name, email, pw " +
        "FROM astro_users " +
        "WHERE email = $1 and pw = $2",
        [email, pw]
    );
    query.on("error", function (err) {
        console.log('login error. code: ', err.code, ", message: ", err.message);
        callback(err.code);
    });
    query.on("row", function (row, result) {
        console.log('add row');
        result.addRow(row);
    });
    query.on("end", function (result) {
        console.log('end');
        console.log(JSON.stringify(result.rows, null, "    "));
        
        console.log('callback: ', result.rows.length, result.rows[0].name);
        callback(result.rows.length, result.rows[0].name);

        //client.end();
    });
}

exports.register = function(name, email, pw, callback) {
    console.log('register. name = " + name + ", email = "' + email + '", pw = "' + pw + '"');

    //var client = new pg.Client(conString);
    //client.connect();

    var query = client.query(
        "INSERT INTO astro_users(name, email, pw) " +
        "VALUES($1, $2, $3)",
        [name, email, pw]
    );
    query.on("error", function (err) {
        console.log('register error. code: ', err.code, ", message: ", err.message);
        callback(err.code);
    });
    query.on("row", function (row, result) {
        console.log('add row');
        result.addRow(row);
    });
    query.on("end", function (result) {
        console.log('end');
        console.log(JSON.stringify(result.rows, null, "    "));
        
        callback(0);

        //client.end();
    });
}

exports.list = function(email, callback) {
    console.log('list. email = "' + email + '" ');
    var query = client.query(
        "SELECT chart_id, chart_name, latitude, longitude, " +
            "to_char(utc_datetime, 'YYYY/MM/DD HH24:MI') as utc_datetime, tz " +
        "FROM astro_charts JOIN astro_users ON astro_charts.user_id = astro_users.id " +
        "AND astro_users.email = $1 ",
        [email,]
    );
    query.on("error", function (err) {
        console.log('list error. code: ', err.code, ", message: ", err.message);
        callback(err.code);
    });
    query.on("row", function (row, result) {
        console.log('add row');
        result.addRow(row);
    });
    query.on("end", function (result) {
        console.log('end list');
        //console.log(JSON.stringify(result.rows, null, "    "));
        //console.log('callback: ', result.rows.length, result.rows[0].chart_name);
        callback(result);

        //client.end();
    });
}

exports.saveChart = function(email, chart, callback) {
    console.log('saveChart: ', chart);

    //var client = new pg.Client(conString);
    //client.connect();

    var query = client.query(
        "INSERT INTO astro_charts(chart_name, latitude, longitude, utc_datetime, tz, chart_type, user_id) " +
        "SELECT $1, $2, $3, $4, $5, $6, id from astro_users where email = $7 ",
        [chart.name, chart.lat, chart.long, chart.utc_dt, chart.tz, chart.type, email]
    );
    query.on("error", function (err) {
        console.log('saveChart error. code: ', err.code, ", message: ", err.message);
        callback(err.code);
    });
    query.on("row", function (row, result) {
        console.log('add row');
        result.addRow(row);
    });
    query.on("end", function (result) {
        console.log('end save');
        console.log(JSON.stringify(result.rows, null, "    "));
        callback(result);

        //client.end();
    });
}

exports.deleteChart = function(email, chartId, callback) {
    console.log('deleteChart, email: ', email, ', chartId: ', chartId);

    //var client = new pg.Client(conString);
    //client.connect();

    var query = client.query(
        "DELETE FROM astro_charts " +
        "WHERE user_id = (SELECT id FROM astro_users WHERE email = $1) " +
        "AND chart_id = $2",
        [email, chartId]
    );
    query.on("error", function (err) {
        console.log('deleteChart error. code: ', err.code, ", message: ", err.message);
        callback(err.code);
    });
    query.on("row", function (row, result) {
        console.log('add row');
        result.addRow(row);
    });
    query.on("end", function (result) {
        console.log('end delete');
        console.log(JSON.stringify(result.rows, null, "    "));
        
        callback(0);

        //client.end();
    });
}

