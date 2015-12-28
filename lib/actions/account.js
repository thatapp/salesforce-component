'use strict';

let jsforce = require('jsforce');
/*
let conn = new jsforce.Connection({
    instanceUrl : 'https://fiberpartner.my.salesforce.com/',
    accessToken : "00D24000000efwk!ARIAQDNKY5n_IvgbKW
    QsjFRw9ofDZL0J.A2Tv76oH59r4B7iSLWRaFltN79iXWEqTPypusqSrdz4mFCYAoMKJ0ns14yVSyYv"
});
*/

exports.process = processAction;

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

//processAction({body: {Name: 'Test Acc 1', External_ID__c: 12}})
exports.getMetaModel = function getMetaModel(cfg, cb) {
    let conn = new jsforce.Connection({
        instanceUrl: 'https://fiberpartner.my.salesforce.com/',
        accessToken: cfg.oauth.access_token
    });
    conn.sobject("Account").describe(descriptionGot);
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
                required: !field.nillable
            };
        });
        cb(null, {in: fields});
    }
};

function processAction(msg, cfg) {
    let self = this;

    let conn = new jsforce.Connection({
        instanceUrl: 'https://fiberpartner.my.salesforce.com/',
        accessToken: cfg.oauth.access_token
    });

    conn.sobject("Account").upsert(msg.body, 'External_ID__c', accountUpserted);

    function accountUpserted(err, res) {
        if (err || !res.success) {
            self.emit('error', err);
            self.emit('end');
            return;
        }
        self.emit('data', res);
        self.emit('end');
    }
}
