
const otplib = require("otplib");
// MJWEY23IPFFCWZLKLJCVSKZWGBWVKTCE
function implementTOTP(secret) {
    return otplib.authenticator.generate(secret); //token
}
x = implementTOTP("MZSEKS3LPFEVM42MKVHWSQ3IIZSDSUCQ");
console.log(x);