const bcrypt = require('bcrypt');

const password = "123456789";
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Hashed password:", hash);
});