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

app.get('/', (req, res) => {
  sess_id = req.session._id;
  sess_uname = req.session.uname;
  sess_rol = req.session.rol;

  if(sess_rol == 1)
  {
    res.render("index", { layout: 'layoutIndex' })
  }

  console.log(sess_uname);
  res.send("da");
});

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

          // req.session.currentUser = [];

          // let promise = new Promise((resolve, reject) => {
          //   req.session.currentUser._id = result[0].id;
          //   req.session.currentUser.uname = result[0].username;
          //   req.session.currentUser.rol = result[0].rol;
          //   resolve("done!");
          // });
          
          // promise.then((value) => {
          //   req.session.save(function (err) {
          //     // session saved
          //     console.log(value);
          //     console.log("Session Before Redirect: ", req.session);
          //     res.redirect("/");
          //   });
          // });
          
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

/* < ------------------------------------------------- LAYOUT AUTH ------------------------------------------------- > */

/* < ------------------------------------------------- LAYOUT INDEX ------------------------------------------------- > */

app.get('/index', (req, res) => {
  sess_id = req.session._id;
  sess_uname = req.session.uname;
  sess_rol = req.session.rol;

  res.render('index', { layout: 'layoutIndex', locals: { rol: sess_rol } });
});

/* < ------------------------------------------------- LAYOUT INDEX ------------------------------------------------- > */

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));
