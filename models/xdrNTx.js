const Joi = require("joi");

function validateXdrTx(data) {
    const schema = {
        txId: Joi.string().required(),
        xdr: Joi.string().required()
    };

    return Joi.validate(data, schema);
}

exports.validateXdrTx = validateXdrTx;