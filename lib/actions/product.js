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

/*
let cfg = {
  oauth: {
    access_token: "00D24000000efwk!ARIAQJWXR1gKmbfgIxTtghb92Qbb0jiH6orI_wETpQBkPJlgQBsm6CvvGlpUAeHy1oEf8EHhCB1pCW3HQnyOQMeWyrwUebWb",
    instance_url: "https://fiberpartner.my.salesforce.com"
  }
}

let conn = new jsforce.Connection({
    instanceUrl: cfg.oauth.instance_url,
    accessToken: cfg.oauth.access_token
});
let exid = '110'
conn.search("FIND {" + exid.replace('-', '*') + "} IN ALL FIELDS RETURNING Product2(Id, Name, External_ID__c)")
.then(console.log).catch(console.log)
/*exports.process.bind({emit: console.log})({body: {
  cost_price: 10,
  rec_price: 12,
  sales_price: 13,
  External_ID__c: 'ret-23',
  Name: 'Console Product1'
}}, cfg)*/

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
                return productId = res.id;
            }
            priceBookId = priceBook.pop().Id;
            console.log('lets find a product with external ID '
            + msg.body.External_ID__c.replace('-', '*'));
            return conn.search("FIND {'" + msg.body.External_ID__c.replace('-', '*') + "'} IN ALL "
            + "FIELDS RETURNING Product2(Id, Name, External_ID__c)")
            .then(product => {
                productId = product.pop().Id;
            });
        })
        .then((x) => {
            console.log('product found ', x);
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
