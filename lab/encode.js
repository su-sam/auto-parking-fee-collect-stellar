let license = '1กง6798'

function encode(license) {
    const buf = new Buffer(license, 'utf8');
    console.log(buf)

}

function compare(camLicense, txLicense) {
    const buf1 = Buffer.from(camLicense);
    const buf2 = Buffer.from(txLicense);

    // const arr = [buf1, buf2];
    // Prints: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
    // console.log(arr.sort(Buffer.compare));

    // (This result is equal to: [buf2, buf1])
    // 0 is returned if target is the same as buf
    // 1 is returned if target should come before buf when sorted.
    // -1 is returned if target should come after buf when sorted.
    console.log(buf1.compare(buf2));
}


//encode(license);
compare('1กง6798',license);