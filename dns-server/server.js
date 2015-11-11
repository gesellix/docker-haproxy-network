(function () {
    "use strict";

    var options = {
        port: 53
    };

    var _ = require('lodash');
    var hostile = require('hostile');
    var dns = require('native-dns');

    var server = dns.createServer();

    server.on('request', function (request, response) {
        console.log(request);

        var preserveFormatting = false;

        hostile.get(preserveFormatting, function (err, lines) {
            if (err) {
                console.error(err.message)
            }
            //lines.forEach(function (line) {
            //    console.log(line)
            //});

            var match = _.find(lines,function(line){
                //console.log(line);
                return line[1] == request.question[0].name;
            });
            console.log("--> ", match);

            if (match) {
                response.answer.push(dns.A({
                    name: request.question[0].name,
                    address: _.first(match),
                    ttl: 600
                }));
            }
            response.send();
        });
    });

    server.on('error', function (err, buff, req, res) {
        console.log(err.stack);
        console.log(req);
    });

    server.serve(options.port);

    var promisedServer = new Promise(function (resolve, reject) {
        server.once('listening', function () {
            console.log("DNS server now listening on port: %s", options.port);
            console.log("");
            resolve(server);
        });
        server.once('close', reject);
    });

    module.exports = {
        server: promisedServer
    };

    if (!module.parent) {
        promisedServer.then(function (server) {
            server.once('close', function () {
                console.error("Socket closed, let's crash...");
                process.exit(1);
            });
        });
    }
})();
