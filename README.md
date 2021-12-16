# API Madagascar hancraft shop

## Description

This project aims to provide an API for an shopping website.
 
You will find in this project an almost turnkey API for the back of a website. This API was initially designated for the sale of product on a stand during a market or online. It sends automated emails to the customer and to the administrators after an order, it integrates Twillio for sending sms if it is desired, and it integrates Stripe for two available payment methods, bank transfer and SEPA. The stocks are updated after the orders, a refund method can be initiated by the customer according to the status of the order, or by the administrator as well. Caching is used through REDIS. Invoices in pdf format are automatically generated on the server and updated after refund. 

For security, only hash passwords are kept in DB, to protect against XSS attacks as best as possible, a Joi scheme was used for all POST routes, the validator package is used to clean the entries, and many regexes were also used. Against CRSF attacks, a fine and secure configuration of cookies has been installed. During connection, we send a token in the body which is intended to be stored in the local storage and a token in the cookie which is intended to be stored in the browser. When connecting to the API, the local storage token must be sent in the header with the custom header (x-xsrf-token) and the other automatically by the cookie via the browser. If the two tokens are sent by these two different routes are indeed identical once arrived in the back then we deduce the absence of CRSF attack. Prepared SQL queries have been used to guard against SQL injection and a connection rate limit is installed on the login route, to limit brute force attacks.

Unit test coverage is low and needs to be improved. The MCD and MLD for the design are also available in the design file. They were made with Jmerise software. The Jmerise file is also available.

Two REACT fronts are present to insert payments via stripe, to simulate a payment by bank card or by bank transfer. To make these two fronts work, it is necessary to hard paste the key of the intention payment in the "key" or "KeySEPA" method of the paymentController, in the "client_secret" property. Key that we get on the user / paymentkey route.
Most of the comments are in French and I apologize, they will be translated into English in the future.

Many CRUD methods have been coded in the models without them always being used.

Swagger documentation is available on the 404 and on the /api-docs.


## Stack

  * **Front**

    * REACT



    * **Back**

        * Node.js
         * Express 
        * STRIPE
        * TWILLIO
        * Joi
        * Mocha et chai 
        * PostgreSql
        * REDIS 
        * Bcrypt
        * Email-validator 



## Install

### For the API :

First of all, you must have a [**Stripe**](https://dashboard.stripe.com/register) account (free) , a [**Twilio**](https://www.twilio.com/try-twilio) account if you wish to receive / send sms and an account to use the "V2 tracking" API from the postal carrier [**La poste**](https://developer.laposte.fr/products/suivi/2) . For these three accounts you must have an API key to enter later in an .env.back file.

For **Twilio** you must subscribe to a phone number, subscribe to verify method and create a webhook : 

- "Explore product" => "Phone Numbers" (Super Network) => "Buy a number" (an english phone number can be bought quickly...)  
- Suscribe to "verify method": "Explore product" => "Verify" (account security) => add a service avec the name of your app with a 6 code lenght. The "service id" code will be to enter in .env.back file (for "SERVICE_SID_VERIFY").  
- After having acquired a phone number you must create a webkook : In "Active number", choose your phone number, in the "configure" tab, the "Messaging" part, configure "a message comes in" => choose "Webhook" and paste "https://<your-domain-name>/v1/admin/smsRespond", in HTTP POST.  



For **Stripe**, after creating an account, you must be in test mode (for developpement), go to the "developer" area, the Webhook tab, and create 4 webhooks :

- "https://<your-domain-name>/v1/webhookRefund" with the event => "charge.refunded"
- "https://<your-domain-name>/v1/webhookRefundUpdate" with the event => "charge.refund.updated"
- "https://<your-domain-name>/v1/webhookpaiementSEPA" with the event => "payment_intent.processing"
- "https://<your-domain-name>/v1/webhookpaiement" with the events => "payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"

=> After having cloned the repo, create an .env.back file in the BACK folder by following the .env.back.example file.

-------------------------------------------------------------------------------------------------------------------------------
### After cloning the repo and editing the .env.back file :

#### In the BACK folder :
- Run ```npm install``` (Install the dependencies in the local node_modules folder)
- Be sure REDIS server is working (run ```redis-cli``` to test)
- Run ```npm test``` to lunch tests.
- Run ```npm run seed``` to implement the database and insert data into it. The .env.back file must be correctly completed.
- Run ```npm start``` to lunch the API. 
- Customize your API: 
  - In the router (BACK => app => router.js) on the routes of your wish, you can add / remove certain MW: 
    - "cache" to cache the result of the route in REDIS, "flush "for the routes in POST in order to empty all the data present in REDIS so as not to give false data later (temporal invalidation) you will find the" time to live "configuration at the top of the router  
    - " dev "," admin "," client " => to allow only certain privileges to access the route 
    - " apiLimiter " to restrict access to the route according to the visitor's IP: the current configuration => If more than 100 connection attempts in 10 hours, access is refused until the end of 10 hours (you will find the config at the top of the router).

=> You can have a look on the online API : [swagger doc](https://artisanat-madagascar.art/api-docs).
