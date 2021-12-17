## Description

This project aims to provide an API for an shopping website.
 
You will find in this project an almost turnkey API for the back of a website. This API was initially designated for the sale of product on a stand during a market or online. It sends automated emails to the customer and to the administrators after an order, it integrates Twillio for sending sms if it is desired, and it integrates Stripe for two available payment methods, bank transfer and SEPA. The stocks are updated after the orders, a refund method can be initiated by the customer according to the status of the order, or by the administrator as well. Caching is used through REDIS. Invoices in pdf format are automatically generated on the server and updated after refund. 

For security, only hash passwords are kept in DB, to protect against XSS attacks as best as possible, a Joi scheme was used for all POST routes, the validator package is used to clean the entries, and many regexes were also used. Against CRSF attacks, a fine and secure configuration of cookies has been installed. During connection, we send a token in the body which is intended to be stored in the local storage and a token in the cookie which is intended to be stored in the browser. When connecting to the API, the local storage token must be sent in the header with the custom header (x-xsrf-token) and the other automatically by the cookie via the browser. If the two tokens are sent by these two different routes are indeed identical once arrived in the back then we deduce the absence of CRSF attack. Prepared SQL queries have been used to guard against SQL injection and a connection rate limit is installed on the login route, to limit brute force attacks.

Unit test coverage is low and needs to be improved. The MCD and MLD for the design are also available in the design file. They were made with Jmerise software. The Jmerise file is also available.

Two REACT fronts are present to insert payments via stripe, to simulate a payment by bank card or by bank transfer. To make these two fronts work, it is necessary to hard paste the key of the intention payment in the "key" or "KeySEPA" method of the paymentController, in the "client_secret" property. Key that we get on the user / paymentkey route.
Most of the comments are in French and I apologize, they will be translated into English in the future.

Many CRUD methods have been coded in the models without them always being used.

Swagger documentation is available on the 404 and on the /api-docs.

The type of design pattern is active record.

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



For **Stripe**, after creating an account, you must be in test mode (for developpement), go to the "developer" area, the Webhook tab, and create 4 webhooks (and later wroute their secret key in the .env.back file) :

- "https://your-domain-name/v1/webhookRefund" with the event => "charge.refunded"
- "https://your-domain-name/v1/webhookRefundUpdate" with the event => "charge.refund.updated"
- "https://your-domain-name/v1/webhookpaiementSEPA" with the event => "payment_intent.processing"
- "https://your-domain-name/v1/webhookpaiement" with the events => "payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"

In the FRONT folder, rename the .env.example file in .env and paste the public key from Stripe, in the .env file for the "PUBLIC_KEY=" variable.

In the BACK folder, rename the .env.back.example file in .env.back and paste the secrete key from the Stripe dashboarb in the STRIPE_TEST_KEY and the 4 secrete keys for the 4 webhooks.

=> After having cloned the repo, create an .env.back file in the BACK folder by following the .env.back.example file.

-------------------------------------------------------------------------------------------------------------------------------

The API branch uses an HTTP2 server via the SPDY package while the main branch uses an express server in HTTP.

For the API branch, you must create a certificate, and store it with its key in the ```BACK/app/certificates``` folder and inform the .env.back by filling the variables : SSL_CRT_FILE and SSL_KEY_FILE with the path, location of the key and the certificat.
In this folder you will find a readme.txt file dedicated to how to generate an SSL certificate to work in HTTPS locally.
### After cloning the repo and editing the .env.back file :

#### In the BACK folder :
- Run ```npm install``` (Install the dependencies in the local node_modules folder)
- Be sure REDIS server is working (run ```redis-cli``` to test)
- Run ```npm test``` to launch tests.
- Run ```npm run seed``` to implement the database and insert data into it. The .env.back file must be correctly completed.
- Run ```npm start``` to launch the API. 
- Customize your API: 
  - In the router (BACK => app => router.js) on the routes of your wish, you can add / remove certain MW: 
    - "cache" to cache the result of the route in REDIS, "flush "for the routes in POST in order to empty all the data present in REDIS so as not to give false data later (temporal invalidation) you will find the" time to live "configuration at the top of the router  
    - " dev "," admin "," client " => to allow only certain privileges to access the route 
    - " apiLimiter " to restrict access to the route according to the visitor's IP: the current configuration => If more than 100 connection attempts in 10 hours, access is refused until the end of 10 hours (you will find the config at the top of the router).

=> You can have a look on the online API : [swagger doc](https://artisanat-madagascar.art/api-docs).

#### In the FRONT folder :

You can go in the FRONT/stripefrontend folder for launch a front CB payment or in the FRONT/stripefrontendSEPA for launch a front SEPA transfert bank account payment
- Run ```yarn install``` 
- Run ```yarn start```


#### To make a payment :

(Here for the example, I would take as port, the port 4000 and a server running in https.) Adapt http or https depending on whether you use a spdy (https) or express (http) server in index.js file.

##### => Ngrok install :
If you try to make a payment in local, in development, whithout a domain name, you will need to open port 4000 on the internet.  
Install [Ngrok](https://ngrok.com/download), to connect your port on which the API is running with internet so that webhooks can work with your localhost.  
Run ngrok => ```ngrok http https://localhost:4000 -region eu```   
In your terminal, in the line: ```Forwarding https://36c8-90-48-188-29.eu.ngrok.io -> https://localhost:4000 ```  
Copy tne new url which will give access to your port 4000 : ```https://36c8-90-48-188-29.eu.ngrok.io```.  
And, in the Stripe dashboard, for each webhook, replace all the domain name by the url of ngrok : "https://your-domain-name/v1/webhookpaiement" =>  https://36c8-90-48-188-29.eu.ngrok.io/v1/webhookpaiement.
Do the same for the Twilio webhook url.


- Launch the API => in the BACK folder : ```npm start```
- Open a new shell and go to /FRONT/stripefrontend or /FRONT/stripefrontendSEPA, and launch the front : ```yarn start``` . A new react window should open in your browser.  
- Register a user => with your favorite test software (postman, insomnia ..) make a POST request to https://localhost:4000/v1/inscription, with the object ```{password:value1, passwordConfirm:value1, prenom:value2, nomFamille:value3, email:value4}```. A welcome email will be sent to this email (value4). 
- Connect a user => POST request to https://localhost:4000/v1/connexion with the object ```{paswword:value1, email:value4}```. In the body you will receive a JSON object with an property :xsrfToken. Copy the value of this token.
- Accept the General Conditions of Sale => Paste the xsrfToken value in a custom header : "x-xsrf-token" and GET request to https://localhost:4000/v1/cgv
- Add product in your cart => GET request to https://localhost:4000/v1/user/addPanier/3 to add the product id 3 (per example).
- Add an address for your user => Paste the xsrfToken value from the /connexion in a custom header "x-xsrf-token" and POST request to https://localhost:4000/v1/client/adresse/new with the object ```{titre:value5, prenom:value6, nomFamille:value7, ligne1: value8, codePostal:value9, ville:value10, pays:value10, telephone:value11, envoie:value12, password:value13}```.
- Add a transporter choice => POST request to https://localhost:4000/v1/client/livraisonChoix with the object ```{nomTransporteur:Chronopost Chrono Relais 13, commentaire:value15, sendSmsWhenShipping:value16}``` The property "commentaire" and "senSmsWhenShipping" can be null.  

    - For a credit card payment =>
      (- Launch the CB payment front : in FRONT/stripefrontend run ```yarn start```.)
      - Paste the xsrfToken value in a custom header : "x-xsrf-token" and GET request to https://localhost:4000/v1/user/paiementCB
      - Paste the xsrfToken value in a custom header : "x-xsrf-token" and GET request to https://localhost:4000/v1/user/paiementkey
      - Copy the generated key in the terminal, starting with pi _...  Do NOT take the rendered key in the JSON object in postman or insomnia.
      - Go to BACK/app/controllers/paiementController.js, line 1358, in the "key" method, and change the client secret property by pasting the key previously copied.
      - Once the secret key has been modified in the code, valid the payment in the front, use one of this [testing card number](https://stripe.com/docs/testing#cards) and valid the "Pay" button.


    - for a SEPA transfert bank account payment => 
      (-  Launch the SEPA payment front : in FRONT/stripefrontendSepa run ```yarn start```.)
      -  Paste the xsrfToken value in a custom header : "x-xsrf-token" and GET request to https://localhost:4000/v1/user/paiementSEPA
      -  Paste the xsrfToken value in a custom header : "x-xsrf-token" and GET request to https://localhost:4000/v1/user/paiementkeySEPA
      -  Copy the generated key in the terminal, starting with pi _...  Do NOT take the rendered key in the JSON object in postman or insomnia.
      - Go to BACK/app/controllers/paiementController.js, line 1409, in the "keySEPA" method, and change the client secret property by pasting the key previously copied.
      - Once the secret key has been modified in the code, valid the payment in the front, use one of this [testing account number](https://stripe.com/docs/testing#pr%C3%A9l%C3%A8vement-sepa) and valid the "Pay" button.

Emails will be send to the admin in database and to the user. Stock of produce id 3 are changed, and a new payment, command, comman_line are now in the paiement table, ligne_commande table and commande table. A stripe transfer to the bank account is automatically initiated. Bank error codes were also taken into account.

This API is online => https://artisanat-madagascar.art/


