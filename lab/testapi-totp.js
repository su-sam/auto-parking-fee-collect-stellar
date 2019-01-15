
const otplib = require("otplib");
// MJWEY23IPFFCWZLKLJCVSKZWGBWVKTCE
function implementTOTP(secret) {
    return otplib.authenticator.generate(secret); //token
}
x = implementTOTP("MJWEY23IPFFCWZLKLJCVSKZWGBWVKTCE");
console.log(x);