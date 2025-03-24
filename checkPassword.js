const bcrypt = require('bcrypt');

const hashedPassword = "$2b$10$gj3vfNtjKXW6JdfYhdQEQeJr0Qpd/nbAr/dODWgqNN/hKMNRgB9n2"; // Thay bằng giá trị password từ database
const plainPassword = "123456789";

bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
  if (err) {
    console.error('Error comparing passwords:', err);
    return;
  }
  console.log('Password match:', isMatch);
});