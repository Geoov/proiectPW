const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const bcrypt = require('bcrypt');

const port = 7777;

app.use(cookieParser());
app.use(session({ secret: 'shhhhhhhh', saveUninitialized: true, resave: false, cookie: { secure: false, maxAge: 6000000 } }));

app.get('/status', (req, res) => { res.status(200).end(); });
app.head('/status', (req, res) => { res.status(200).end(); });

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* < ------------------------------------------------- PARTEA BD ------------------------------------------------- > */

var mysql = require('mysql');

var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mysqlroot",
  database: "rc"
});

conn.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

/* < ------------------------------------------------- PARTEA BD ------------------------------------------------- > */


/* < ------------------------------------------------- LAYOUT AUTH ------------------------------------------------- > */

app.get('/login', (req, res) => {
  if (req.cookies.mesajEroare) {
    mesaj = req.cookies.mesajEroare;
  } else {
    mesaj = " ";
  }

  res.render('login', { layout: 'layoutAuth', locals: { mesaj: mesaj } });
});

app.get('/register', (req, res) => {

  if (req.cookies.mesajEroare) {
    mesaj = req.cookies.mesajEroare;
  } else {
    mesaj = " ";
  }

  res.render('register', { layout: 'layoutAuth', locals: { mesaj: mesaj } });
});

app.post('/register', (req, res) => {

  let uname = req.body['username'];
  conn.query('SELECT id FROM user WHERE username = ?', uname, (err, result, fields) => {
    if (err) throw err;
    if (result != "") {
      res.cookie("mesajEroare", 'User-ul deja exista');
      res.redirect('/register');
    } else {
      res.clearCookie("mesajEroare");
      let pss = req.body['password'];
      bcrypt.hash(pss, 10, function (err, hash) {
        let values = [[uname, hash]]
        conn.query("INSERT INTO user(username, password) VALUES ?", [values], function (err, result, fields) {
          if (err) throw err;
          console.log(result);
          res.redirect('/login');
        });
      });

    }
  });

});

app.post('/login', (req, res) => {

  let uname = req.body['username'];
  conn.query('SELECT * FROM user WHERE username = ?', uname, (err, result, fields) => {
    if (err) throw err;
    if (result != "") {
      bcrypt.compare(req.body['password'], result[0].password, function (err, response) {
        if (response) {
          res.clearCookie("mesajEroare");
          req.session._id = result[0].id;
          req.session.uname = result[0].username;
          req.session.rol = result[0].rol;

          req.session.save(function (err) {
            res.redirect("/");
          });

        } else {
          res.cookie("mesajEroare", 'Credentiale gresite!');
          res.redirect("/login");
        }
      });
    } else {
      res.cookie("mesajEroare", 'User-ul nu exista!');
      res.redirect('/register');
    }

  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/');
  });

});

/* < ------------------------------------------------- LAYOUT AUTH ------------------------------------------------- > */

/* < ------------------------------------------------- LAYOUT INDEX ------------------------------------------------- > */

app.get('/', (req, res) => {
  sess_id = req.session._id;
  sess_uname = req.session.uname;
  sess_rol = req.session.rol;

  if (sess_rol && sess_id && sess_uname) {

    // conn.query('SELECT * FROM devices WHERE user = ?', sess_id, (err, result, fields) => {

    //   if (err) throw err;

    //   var devices = [];

    //   result.forEach(function (row) {
    //     if (row['device_type'] == 'Computer' || row['device_type'] == ['Printer']) {
    //       let newRow = {};
    //       newRow.MAC = row['MAC'];
    //       newRow.IP = row['IP'];
    //       newRow.device_type = row['device_type'];
    //       newRow.OS = row['OS'];
    //       devices.push(newRow);

    //     } else {
    //       conn.query('SELECT AP_ESSID FROM access_point WHERE MAC = ?', row['MAC'], (err, ap_essid) => {
    //         if (err) throw err;

    //         conn.query('SELECT SSID FROM access_point_details WHERE AP_ESSID = ?', ap_essid[0].AP_ESSID , (err, ssid) => {

    //           let newRow = {};
    //           newRow.MAC = row['MAC'];
    //           newRow.IP = row['IP'];
    //           newRow.device_type = row['device_type'];
    //           newRow.SSID = ssid;
    //           newRow.OS = row['OS'];
    //           devices.push(newRow);
    //         });

    //       });
    //     }

    //   });

    //   for(let i in devices)
    //   {
    //     console.log(devices[i]);
    //   }

    //   if (sess_rol == 1) {
    //     res.render('index', { layout: 'layout', locals: { _id: sess_id, uname: sess_uname, rol: sess_rol } });
    //   }
    // });

      conn.query('SELECT * FROM devices WHERE user = ?', sess_id, (err, result, fields) => {
        if (err) throw err;

        var devices = [];

        const promise = new Promise(function (resolve, reject) {

          result.forEach(function (row) {
            if (row['device_type'] == 'Computer' || row['device_type'] == ['Printer']) {
              let newRow = {};
              newRow.MAC = row['MAC'];
              newRow.IP = row['IP'];
              newRow.device_type = row['device_type'];
              newRow.OS = row['OS'];
              devices.push(newRow);
              console.log("intra x1");
            } else {
              conn.query('SELECT AP_ESSID FROM access_point WHERE MAC = ?', row['MAC'], (err, ap_essid) => {
                if (err) throw err;
                conn.query('SELECT SSID FROM access_point_details WHERE AP_ESSID = ?', ap_essid[0].AP_ESSID, (err, ssid) => {
                  let newRow = {};
                  newRow.MAC = row['MAC'];
                  newRow.IP = row['IP'];
                  newRow.device_type = row['device_type'];
                  newRow.SSID = ssid[0].SSID;
                  newRow.OS = row['OS'];
                  devices.push(newRow);
                  console.log("intra x2");
                });
              });
            }
          });
          resolve(devices);

        }).then(function (value) {
          console.log("aia e");
      });

    });


    res.render('index', { layout: 'layout', locals: { _id: sess_id, uname: sess_uname, rol: sess_rol } });

  } else {
    res.redirect('/login');
  }

});

app.get('/add-device', (req, res) => {
  sess_id = req.session._id;
  sess_uname = req.session.uname;
  sess_rol = req.session.rol;

  if (sess_rol && sess_id && sess_uname) {

    if(req.cookies.mesajInsert) {
      mesaj = req.cookies.mesajInsert;
    } else {
      mesaj = " ";
    }

    res.render('add-device', { layout: 'layout', locals: { _id: sess_id, uname: sess_uname, rol: sess_rol, mesaj: mesaj } });
  } else {
    res.redirect('/login');
  }

});

app.post('/add-device', (req, res) => {
  var MAC_flag = 0;
  var IP_flag = 0;

  var p1 = new Promise(function(resolve, reject) {
    conn.query('SELECT MAC FROM devices WHERE MAC = ?', req.body['deviceMAC'], (err, MAC) => {
      if (err) throw err;
      if (MAC != "") {
        MAC_flag = 1;
        res.cookie("mesajEroareInsert", 'MAC already exist');
      } else {
        MAC_flag = 0;
      }
      resolve(MAC_flag);
    });
  });

  var p2 = new Promise(function (resolve, reject) {
    conn.query('SELECT IP FROM devices WHERE IP = ?', req.body['deviceIP'], (err, IP) => {
      if (err) throw err;
      if (IP != "") {
        IP_flag = 1;
        res.cookie("mesajInsert", 'IP already exists');
      } else {
        IP_flag = 0;
      }
      return resolve(IP_flag);
    });
  });

  Promise.all([p1, p2]).then(flag => {

      if(flag[0] == 1 && flag[1] == 1) // MAC_flag == 1 && IP_flag == 1
      {
        res.cookie("mesajInsert", 'This combination of MAC & IP already exists');
        res.redirect('/add-device');
      } else if(flag[0] == 1 || flag[1] == 1)
      {
        res.redirect('/add-device');
      } else{
        let values = [[req.body['deviceMAC'], req.body['deviceIP'], req.body['deviceType'], req.body['userOS'], req.session._id]];
        conn.query("INSERT INTO devices(MAC, IP, device_type, OS, user) VALUES ?", [values], function (err, result, fields) {
          if (err) throw err;
          res.cookie("mesajInsert", 'Device added in our permitted devices list');
          res.redirect('/add-device');
        });
      }

    }, reason => {
      console.log(reason)
    });

});

/* < ------------------------------------------------- LAYOUT INDEX ------------------------------------------------- > */

/* < ------------------------------------------------- LAYOUT ADMIN PANEL ------------------------------------------------- > */

app.get('/admin-panel', (req, res) => {

  console.log("mare pizdar tată");

  res.render('admin-panel', { layout: 'layoutAdmin', locals: { _id: sess_id, uname: sess_uname, rol: sess_rol } });
});

/* < ------------------------------------------------- LAYOUT ADMIN PANEL ------------------------------------------------- > */

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));
