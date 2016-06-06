var lat, long, tz, utcDate;

function paramsFromQuery() {
    var params = {};
    var parts = decodeURI(location.search.substring(1)).split('&');

    for (var i = 0; i < parts.length; i++) {
        var nv = parts[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }

    lat = params['lat'];
    long = params['long'];
    tz = params['tz'];
    utcDate = new Date(params['utcDatetime']);
}

function sendMail() {
    var from = $('#from').val();
    var to = $('#to').val();
    var cc = $('#cc').val();
    var msg = $('#msg').val();
    
    var search = decodeURI(location.search);
    var url = location.origin + "/email" + search + 
        "&from=" + from + "&to=" + to + "&cc=" + cc + "&msg=" + msg;
        
    window.location.href = url;
}
