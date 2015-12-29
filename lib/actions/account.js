'use strict';

let jsforce = require('jsforce');
let getMetaModel = require('../helpers/getMetaModel')
/*
let conn = new jsforce.Connection({
    instanceUrl : 'https://fiberpartner.my.salesforce.com/',
    accessToken : "00D24000000efwk!ARIAQDNKY5n_IvgbKWQsjFRw9ofDZL0J.A2Tv76oH59r4B7iSLWRaFltN79iXWEqTPypusqSrdz4mFCYAoMKJ0ns14yVSyYv"
});
processAction({body: {Name: 'Test Acc 1', External_ID__c: 12}})
*/

exports.process = processAction;
exports.getMetaModel = getMetaModel.bind({}, 'Account')

function processAction(msg, cfg) {
    let self = this;

    let conn = new jsforce.Connection({
        instanceUrl: cfg.oauth.instance_url,
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
