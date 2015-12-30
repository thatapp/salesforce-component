'use strict';

let jsforce = require('jsforce');
let getMetaModel = require('../helpers/getMetaModel');

exports.process = processAction;
exports.getMetaModel = getMetaModel.bind({}, { type: 'Account'});

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
