const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

let form = new FormData();

form.append("image", fs.createReadStream(__dirname + "/testing/test10.jpg"));

axios
  .create({ headers: form.getHeaders() })
  .post(
    "https://api.openalpr.com/v2/recognize?secret_key=sk_e4b183597fd436205ecb056f&recognize_vehicle=0&country=th&return_image=0&topn=10",
    form
  )
  .then(response => {
    console.log(response.data.results[0].plate);
  })
  .catch(error => {
    console.log(error);
  });
