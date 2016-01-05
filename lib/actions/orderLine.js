'use strict';

let jsforce = require('jsforce');
let messages = require('elasticio-node').messages;
let getMetaModel = require('../helpers/getMetaModel');

exports.process = processAction;
exports.getMetaModel = getMetaModel.bind({}, { type: 'OrderItem'});

function processAction(msg, cfg) {
    let self = this;
    let conn = new jsforce.Connection({
        instanceUrl: cfg.oauth.instance_url,
        accessToken: cfg.oauth.access_token
    });
    let orderItem;

    let productExternalId = msg.body.ProductCode;
    conn.sobject('PricebookEntry').find({External_ID__c: productExternalId}).execute(productFound);

    function productFound(err, pricebookEntries) {
        if (err) {
            self.emit('error', err);
            self.emit('end');
            return;
        }
        if (!pricebookEntries.length) {
            self.emit('rebounce');
            self.emit('end');
            return;
        }
        let pricebookEntry = pricebookEntries.pop();
        orderItem = {
            Quantity: msg.body.Quantity,
            PricebookEntryId: pricebookEntry.Id,
            UnitPrice: msg.body.UnitCostPrice,
            External_ID__c: msg.body.External_ID__c
        };
        conn.sobject('Order')
        .find({External_ID__c: msg.body.OrderId})
        .execute(orderFound);
    }

    function orderFound(err, orders) {
        if (err) {
            self.emit('error', err);
            self.emit('end');
            return;
        }
        if (!orders.length) {
            self.emit('rebounce');
            self.emit('end');
            return;
        }
        orderItem.OrderId = orders.pop().Id;
        conn.sobject("OrderItem").upsert(orderItem, 'External_ID__c')
        .then(orderItem => self.emit('data', messages.newMessageWithBody(orderItem)))
        .catch(err => self.emit('error', err))
        .done(() => self.emit('end'));
    }
}
