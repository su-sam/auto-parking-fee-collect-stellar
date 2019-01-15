const Joi = require("joi");

function validateTxId(data) {
    const schema = {
        txEnterId: Joi.string().required(),
        txExitId: Joi.string().required()
    };

    return Joi.validate(data, schema);
}

exports.validate = validateTxId;