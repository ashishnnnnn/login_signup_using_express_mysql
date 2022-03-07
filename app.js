const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv"); // To handle the sensitive information like password, username
const bodyParser = require("body-parser"); // to parse the post request body
const { v4: uuidv4 } = require("uuid");
// To generate unique token .
const schema = require("./helper_module/joi");
// to test the input provided by user, is it correct or not.
const currtime = require("./helper_module/time");
// to get the current time and date .

dotenv.config({ path: "./.env" }); // This will look for the variables in the dotenv file

const app = express();

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
}); // using .env will enhance the security of database

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("MySql Connected"); // to get confirmation that our data is connected and working fine .
  }
});

app.get("/", (req, res) => {
  res.status(200).send({
    status: 200,
    message: "You have arrived at mock authorization api",
  });
});

app.post(
  "/register",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    const username = req.body.username || ""; // using OR operator to make sure that value should be string in case of undefined value .
    const firstname = req.body.firstname || "";
    const lastname = req.body.lastname || "";
    const email = req.body.email || "";
    const password = req.body.password || "";
    const cnf_password = req.body.cnf_password || "";
    const phone_no = req.body.phone_no || "";

    const schema_check = schema.validate({
      username: username,
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password,
      cnf_password: cnf_password,
      phone_no: phone_no,
    });
    if (schema_check.error) {
      // If the user input is not following the rule set by JOI SCHEMA, then this if conditon will be  true;
      return res.send({
        status: 404,
        message: schema_check.error.details[0].message,
      });
      // sending the detail error message of JOI SCHEMA along with status code.
    }
    const sqlSearch =
      "SELECT * FROM users WHERE username = ? or email = ? or phone_no = ?";
    const search_query = mysql.format(sqlSearch, [username, email, phone_no]);
    db.query(search_query, (err, result) => {
      // query to make sure that if the user is already registered or the new one, i.e, for new user they should have unique "username","email" and "phone number".
      if (err) {
        res.send({
          status: 404,
          message: "Some Error Came",
        });
        // handle the error of search operation.
        throw err;
      }
      if (result.length != 0) {
        // if result length is not zero means "username","phone number" or "email" is not unique, i.e, some user have already used any of them.
        res.send({
          status: 409,
          message: "User Already Exists",
        });
      } else {
        const time_now = currtime(); // To get current time .
        const sqlInsert = "INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)";
        const insert_query = mysql.format(sqlInsert, [
          username,
          firstname,
          lastname,
          email,
          password,
          cnf_password,
          phone_no,
          time_now,
          time_now,
        ]); // inserting a row with time_now as the value of "created_at" and "updated_at" column of database.
        db.query(insert_query, (err, result) => {
          if (err) throw err; // throwing error if came while inserting the new row.
          const token_id = uuidv4(); // To get Unique toekn_id
          const sqlInsert = "INSERT INTO user_token VALUES (?,?)";
          const insert_query = mysql.format(sqlInsert, [token_id, username]);
          // inserting the token and username in new table named "user_token".
          db.query(insert_query, (err, result) => {
            if (err) throw err;
            console.log("--------> Created new User");
            res.send({
              status: 201,
              token_id: token_id,
              message: "User Created",
            });
            // returning the token and message.
          });
        });
      }
    });
  }
);

app.post("/login", bodyParser.urlencoded({ extended: false }), (req, res) => {
  const token_id = req.body.token_id; // the Token provided by user while logging in.
  const sqlSearch = "SELECT * FROM user_token WHERE token_id = ?";
  const search_query = mysql.format(sqlSearch, [token_id]);
  db.query(search_query, (err, result) => {
    // query to check if token_id is present in the user_token or not.
    if (err) {
      res.send({
        status: 404,
        message: "Some Error Came",
      });
      throw err; // handling the error.
    }
    if (result.length == 0) {
      // user is new and haven't registered.
      return res.send({
        status: 409,
        message: "User Haven't Registered , Please Register",
      });
    } else {
      const user = result[0];
      console.log(user);
      res.send({
        status: 201,
        message: "Welcome " + user.username,
      });
      // sending the message along with the username of the current user.
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on pot 3000");
});

// sudo /opt/lampp/manager-linux-x64.run -> To open the Xampp

// https://joi.dev/api/?v=17.6.0#numbergreaterlimit -> Joi Documentation
