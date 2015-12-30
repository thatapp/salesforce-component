'use strict';

let jsforce = require('jsforce');
let getMetaModel = require('../helpers/getMetaModel');
let _ = require('lodash');

exports.process = processAction;
exports.getMetaModel = getMetaModel.bind({}, {
    type: 'Product2',
    additionalFields: [
        {
            label: 'Cost Price',
            name: 'cost_price'
        },
        {
            label: 'Reccomended Price',
            name: 'rec_price'
        },
        {
            label: 'Sales Price',
            name: 'sales_price'
        }
    ]
});

function processAction(msg, cfg) {
    let self = this;
    let conn = new jsforce.Connection({
        instanceUrl: cfg.oauth.instance_url,
        accessToken: cfg.oauth.access_token
    });
    let product = _.omit(msg.body, 'cost_price', 'rec_price', 'sales_price');
    conn.sobject("Product2").upsert(product, 'External_ID__c', upserted);

    function upserted(err, res) {
        if (err || !res.success) {
            self.emit('error', err);
            self.emit('end');
            return;
        }
        let productId;
        let priceBookId;
        conn.search("FIND {Standard Price Book} IN ALL FIELDS RETURNING Pricebook2(Id, Name)")
        .then(priceBook => {
            if (res.id) {
                return priceBookId = res.id;
            }
            priceBookId = priceBook.pop().Id;
            return conn.search("FIND {'" + msg.body.External_ID__c.replace('-', '*') + "'} IN ALL "
            + "FIELDS RETURNING Product2(Id, Name, External_ID__c)")
            .then(product => {
                productId = product.pop().Id;
            });
        })
        .then(() => {
            return conn.sobject("PricebookEntry").upsert({
                External_ID__c: msg.body.External_ID__c,
                Pricebook2Id: priceBookId,
                Product2Id: productId,
                Cost_Price__c: msg.body.cost_price,
                Rec_Price__c: msg.body.rec_price,
                UnitPrice: msg.body.sales_price
            }, 'External_ID__c');
        })
        .then((res) => {
            self.emit('data', res);
            self.emit('end');
        })
        .catch(err => {
            self.emit('error', err);
            self.emit('end');
        });
    }
}
