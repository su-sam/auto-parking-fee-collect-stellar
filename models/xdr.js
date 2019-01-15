const Joi = require("joi");

function validateXdr(data) {
    const schema = {
        xdr: Joi.string().required()
    };

    return Joi.validate(data, schema);
}

exports.validateXdr = validateXdr;