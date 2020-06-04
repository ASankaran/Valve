// 'use strict';

console.log("Attempting to load request");
const request = require('request-promise');
console.log("Finished loading request");

const constants = {
    //URL_GETPRICE: process.env.URL_GETPRICE,
    //URL_AUTHORIZECC: process.env.URL_AUTHORIZECC,
    //URL_PUBLISH: process.env.URL_PUBLISH,
    URL_GETPRICE: 'http://gateway.openfaas:8080/function/product-purchase-get-price',
    URL_AUTHORIZECC: 'http://gateway.openfaas:8080/function/product-purchase-authorize-cc',
    URL_PUBLISH: 'http://gateway.openfaas:8080/function/product-purchase-publish',
};

const functions = {
    getRequestObject: (requestVals, url) => {
        requestVals.user = "Owen";
        requestVals.pass = "owenspassword";
        return {
            method: 'POST',
            uri: url,
            body: requestVals,
            json: true,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
}

const api = {
    purchaseProduct: (event, context, callback) => {
        console.log("Incoming event:");
        console.log(event);

        var getPriceData = {
            "id": event.body["id"]
        };
        var authorizeCCData = {
            "user": event.body["user"],
            "creditCard": event.body["creditCard"]
        };

        var reqs = [
            request(functions.getRequestObject(getPriceData, constants.URL_GETPRICE), constants.URL_GETPRICE),
            request(functions.getRequestObject(authorizeCCData, constants.URL_AUTHORIZECC), constants.URL_AUTHORIZECC)
        ];

        Promise.all(reqs).then(res => {
            console.log("get-price and authorize-cc responses:")
            console.log(res);

            var publishData = {...res[0], ...res[1]};

            request(functions.getRequestObject(publishData, constants.URL_PUBLISH), constants.URL_PUBLISH)
                .then(res => {
                    console.log('publish response:');
                    console.log(res);

                    var respData = {
                        "chargedAmount": res.Data["productPrice"],
                        "authorization": res.Data["authorization"]
                    };

                    console.log("Outgoing response:");
                    console.log(respData);

                    callback(null, respData);
                })
        }).catch(error => {
            console.log(error);
        });
    }
}

module.exports = (event, context, callback) => {
    console.log('abcd')
    api.purchaseProduct(event, context, callback);
}
