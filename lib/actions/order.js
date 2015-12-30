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

  conn.sobject('Order')
  .upsert(msg.body, 'External_ID__c')
  .then(order => self.emit('data', messages.newMessageWithBody(order)))
  .catch(err => this.emit('error', err))
  .done(() => this.emit('end'))
}
