var tls = require('tls');
var fs = require('fs');
var level = require('level');
var multilevel = require('multilevel');

var db = level('db');

var server = tls.createServer({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  ca: [fs.readFileSync('client-cert.pem')]
}, function(socket){
  socket.pipe(multilevel.server(db)).pipe(socket);
});

server.listen(3000, function(){
  var con = tls.connect(3000, {
    key: fs.readFileSync('client-key.pem'),
    cert: fs.readFileSync('client-cert.pem'),
    ca: [fs.readFileSync('server-cert.pem')]
  });
  con.on('secureConnect', function(){
    var db = multilevel.client();
    con.pipe(db.createRpcStream()).pipe(con);

    db.put('foo', 'bar', function(err){
      if (err) throw err;
      db.get('foo', function(err, val){
        if (err) throw err;
        console.log('foo is %s', val);
        process.exit();
      });
    });
  });
});
