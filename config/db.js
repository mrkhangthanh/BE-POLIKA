require('dotenv').config();
module.exports = {
    mongodb: {
        uri: process.env.DB_URI,
    },
};