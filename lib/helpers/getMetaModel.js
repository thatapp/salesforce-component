'use strict';

let jsforce = require('jsforce');

module.exports = getMetaModel;

function getType(sfType) {
    let typesMap = {
        id: 'string',
        string: 'string',
        textarea: 'string',
        picklist: 'string',
        double: 'number',
        address: 'string',
        phone: 'string',
        url: 'string',
        int: 'string'
    };
    return typesMap[sfType] || 'string';
}

function getMetaModel(options, cfg, cb) {
    let conn = new jsforce.Connection({
        instanceUrl: cfg.oauth.instance_url,
        accessToken: cfg.oauth.access_token
    });

    conn.sobject(options.type).describe(descriptionGot);
    function descriptionGot(err, meta) {
        if (err) {
            return cb(err);
        }
        let fields = {
            type: 'object',
            properties: {}
        };
        meta.fields.forEach(field => {
            fields.properties[field.name] = {
                title: field.label,
                type: getType(field.type),
                required: false
            };
        });
        if (options.additionalFields) {
            options.additionalFields.forEach(field => {
                fields.properties[field.name] = {
                    title: field.label,
                    type: 'string',
                    required: false
                };
            });
        }
        cb(null, {in: fields});
    }
};
