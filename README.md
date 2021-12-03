# API Madagascar hancraft shop

## Description

This project aims to provide an API for an shopping website.

Available on the "API" branch.
 
You will find in this project an almost turnkey API for the back of a website. This API was initially designated for the sale of product on a stand during a market or online. It sends automated emails to the customer and to the administrators after an order, it integrates Twillio for sending sms if it is desired, and it integrates Stripe for two available payment methods, bank transfer and SEPA. The stocks are updated after the orders, a refund method can be initiated by the customer according to the status of the order, or by the administrator as well. Caching is used through REDIS. Invoices in pdf format are automatically generated on the server and updated after refund. 

For security, only hash passwords are kept in DB, to protect against XSS attacks as best as possible, a Joi scheme was used for all POST routes, the validator package is used to clean the entries, and many regexes were also used. Against CRSF attacks, a fine and secure configuration of cookies has been installed. During connection, we send a token in the body which is intended to be stored in the local storage and a token in the cookie which is intended to be stored in the browser. When connecting to the API, the local storage token must be sent in the header with the custom header (x-xsrf-token) and the other automatically by the cookie via the browser. If the two tokens are sent by these two different routes are indeed identical once arrived in the back then we deduce the absence of CRSF attack. Prepared SQL queries have been used to guard against SQL injection and a connection rate limit is installed on the login route, to limit brute force attacks.

Unit test coverage is low and needs to be improved. The MCD and MLD for the design are also available in the design file. They were made with Jmerise software. The Jmerise file is also available.

Two REACT fronts are present to insert payments via stripe, to simulate a payment by bank card or by bank transfer. To make these two fronts work, it is necessary to hard paste the key of the intention payment in the "key" or "KeySEPA" method of the paymentController, in the "client_secret" property. Key that we get on the user / paymentkey route.
Laz most of the comments are in French and I apologize, they will be translated into English in the future.

Many CRUD methods have been coded in the models without them always being used.

Swagger documentation is available on the 404 and on the /api-docs.


## Stack

  * **Front**

    * REACT



    * **Back**

        * Node.js
         * Express 
        * Sqitch
        * STRIPE
        * TWILLIO
        * Joi
        * Mocha et chai 
        * PostgreSql
        * REDIS 
        * Bcrypt
        * Email-validator 



## Install

Work in progress....
  
