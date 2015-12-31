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
        let isInserted = false;
        conn.search("FIND {Standard Price Book} IN ALL FIELDS RETURNING Pricebook2(Id, Name)")
        .then(priceBook => {
            priceBookId = priceBook.pop().Id;
            if (res.id) {
                isInserted = true;
                return productId = res.id;
            }
        })
        .then((x) => {
            let data = {
                External_ID__c: msg.body.External_ID__c,
                Cost_Price__c: msg.body.cost_price,
                Rec_Price__c: msg.body.rec_price,
                UnitPrice: msg.body.sales_price
            };
            if (isInserted) {
                data.Pricebook2Id = priceBookId;
                data.Product2Id = productId;
            }
            return conn.sobject("PricebookEntry").upsert(data, 'External_ID__c');
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
