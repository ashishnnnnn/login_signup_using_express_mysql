const Joi = require("joi");

const schema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  // username is necessary with minimum character of 3 to max 30.
  firstname: Joi.string().alphanum().min(3).max(20).required(),
  // firstname is necessary with minimum character of 3 to max 30.
  lastname: Joi.string().alphanum().min(3).max(20),
  // lastname is optional with minimum character of 3 to max 30.
  email: Joi.string()
    .email({
      minDomainSegments: 2, // email should have main 2 segment
      tlds: { allow: ["com", "net"] }, // only .com and .net allowed
    })
    .required(),
  // email is required and it should end with "com" or "net" and should have minimum 2 component .
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
  // password must me follow the rejex pattern and it is required

  cnf_password: Joi.ref("password"),
  // confirm_password is also required and it should match the password provided before.
  phone_no: Joi.number().min(1000000000).max(9999999999).required(),
  // phone number should be integer and should havr 10 character and it is required .
});

module.exports = schema;
