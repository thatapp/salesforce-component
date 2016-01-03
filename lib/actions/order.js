'use strict';

let jsforce = require('jsforce');
let messages = require('elasticio-node').messages;
let getMetaModel = require('../helpers/getMetaModel');

exports.process = processAction;
exports.getMetaModel = getMetaModel.bind({}, { type: 'Order'});

function processAction(msg, cfg) {
    let self = this;
    let conn = new jsforce.Connection({
        instanceUrl: cfg.oauth.instance_url,
        accessToken: cfg.oauth.access_token
    });
    let AccountId = msg.body.AccountId; // -economic debtor handle
    let ContactId = msg.body.ContactId;

    conn.sobject('Account').find({External_ID__c: AccountId}).limit(1).execute(accountFound);

    function accountFound(err, accounts) {
        if (err) {
            self.emit('error', error);
            self.emit('end');
            return;
        }
        delete msg.body.AccountId;
        if (accounts.length) {
            msg.body.AccountId = accounts.pop().Id;
        }
        conn.sobject('Order')
        .upsert(msg.body, 'External_ID__c')
        .then(order => self.emit('data', messages.newMessageWithBody(order)))
        .catch(err => self.emit('error', err))
        .done(() => self.emit('end'));
    }
}
