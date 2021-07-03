------------------------------------------------------------
--        Script Postgres BDD MADA
------------------------------------------------------------
BEGIN;

-- suppression du schéma public

DROP SCHEMA IF EXISTS public;
DROP SCHEMA IF EXISTS mada;

-- création d'un schéma perso ou je vais ranger mes tables : 

CREATE SCHEMA mada;

-- je définit mon schéma par défaut pour la création de table et le requêtage

SET search_path TO mada;



-- Création de domaines =

CREATE DOMAIN posint AS INT CHECK (VALUE >= 0); -- un domaine permettant de créer un type de donnée nombre entier ne pouvant être négatif
CREATE DOMAIN posintsup AS INT check (VALUE > 0); -- un domaine permettant de créer un type de donnée nombre entier strictement positif
CREATE DOMAIN posreal AS REAL CHECK (VALUE > 0); -- un domaine permettant de créer un type de donnée nombre réelle strictement positif
CREATE DOMAIN email AS text -- un domaine (type de donnée) permettant de vérifier la validité d'une adresse email via une regex
	CHECK (

		VALUE ~* '^[A-Za-z0-9._%\-+!#$&/=?^|~]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'
	);

CREATE DOMAIN postale_code_fr AS text -- un domaine (type de donnée) permettant de vérifier la validité d'un code postale via une regex
	CHECK (

		VALUE ~* '^(([0-8][0-9])|(9[0-8]))[0-9]{3}$'
	);
-- Les département français vont de 01 a 98.

CREATE DOMAIN phonenumber AS text -- un domaine (type de donnée) permettant de vérifier la validité d'un numéro de téléphone via une regex
	CHECK (

		VALUE ~* '^(0|\\+33|0033)[1-9][0-9]{8}$'
	);

CREATE DOMAIN password as text  -- un domaine (type de donnée) permettant de vérifier la validité d'un mot de passe en hash via une regex (fonctionne uniquement avec bcrypt qui commence ces hash de la même maniére)
CHECK (

		VALUE ~* '^\$2[ayb]\$.{60}$'
	);

	-- https://stackoverflow.com/questions/31417387/regular-expression-to-find-bcrypt-hash
	-- https://stackoverflow.com/questions/5393803/can-someone-explain-how-bcrypt-verifies-a-hash

CREATE DOMAIN text_length AS text -- un domaine pour les descriptions = mini 15 caractéres sans espace autour
    CHECK (
        char_length(trim(both from VALUE)) >= 15
    );

CREATE DOMAIN text_valid AS text -- un domaine pour les textes valides = mini 2 caractéres sans espaces autour
    CHECK (
        char_length(trim(both from VALUE)) >= 2
    );


------------------------------------------------------------
-- Table: Manufacturer
------------------------------------------------------------
CREATE TABLE manufacturer(
	id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	manufacturerName text_valid NOT NULL,
	manufacturerLogo text_valid NOT NULL
);


------------------------------------------------------------
-- Table: Category
------------------------------------------------------------
CREATE TABLE category(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	categoryName          text_valid NOT NULL,
	categoryDescription   text_length NOT NULL,
	categoryOrder         INT  NOT NULL ,
	categoryImageURL      text_valid NOT NULL
);


------------------------------------------------------------
-- Table: TaxRate
------------------------------------------------------------
CREATE TABLE taxRate(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	taxRateValue          posreal  NOT NULL,
	taxeRateName          text_valid NOT NULL,
	taxeRateDescription   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: ZipCode
------------------------------------------------------------
CREATE TABLE zipCode(
	id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	zipCodeCity   postale_code_fr NOT NULL 
);


------------------------------------------------------------
-- Table: Country
------------------------------------------------------------
CREATE TABLE country(
	id  		 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	countryName  text_valid NOT NULL
);


------------------------------------------------------------
-- Table: City
------------------------------------------------------------
CREATE TABLE city(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	cityName   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: OrderedProduct
------------------------------------------------------------
CREATE TABLE orderedProduct(
	id                       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderedProductName       text_valid NOT NULL,
	orderedProductQuantity   posintsup  NOT NULL,
	orderedProductPrice      posreal  NOT NULL,
	orderedProductTax        posreal  NOT NULL 

);


------------------------------------------------------------
-- Table: Pivilege
------------------------------------------------------------
CREATE TABLE privilege(
	id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	privilegeName   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: Custumer
------------------------------------------------------------
CREATE TABLE custumer(
	id                         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customerGender             text_valid NOT NULL,
	customerFirstName          text_valid NOT NULL,
	customerLastName           text_valid NOT NULL,
	custumerEmail              email NOT NULL UNIQUE,
	custumerPhoneForAdminOnly  phonenumber,
	custumerPassword           password NOT NULL,
	custumerCreatedDate        timestamptz NOT NULL DEFAULT now(),
	custumerUpdatedDate        timestamptz  NOT NULL,
	id_privilege               INT NOT NULL REFERENCES privilege(id),
	CHECK (custumerCreatedDate < custumerUpdatedDate)	
);


------------------------------------------------------------
-- Table: BasquetProduct
------------------------------------------------------------
CREATE TABLE basquetProduct(
	id                        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	basquetProductQuantity    posint NOT NULL,
	basquetProductDateAdded   DATE  DEFAULT now(),
	basquetProductStatus      text_valid NOT NULL,
	basquetProductImageMini   text_valid NOT NULL,
	id_custumer               INT  NOT NULL  REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: AddressCustumer
------------------------------------------------------------
CREATE TABLE addressCustumer(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	addressCustumerTitle         text_valid NOT NULL,
	addressCustumerFirstName     text_valid NOT NULL,
	addressCustumerLastName      text_valid NOT NULL,
	addressCustumerCompany       text_valid NOT NULL,
	addressCustumerLine1         text_valid NOT NULL,
	addressCustumerLine2         text_valid NOT NULL,
	addressCustumerPhone         phonenumber NOT NULL,
	addressCustumerCreatedDate   timestamptz NOT NULL DEFAULT now(),
	addressCustumerUpdatedDate   timestamptz  NOT NULL,
	id_custumer                  INT  NOT NULL REFERENCES custumer(id),
	id_country                   INT  NOT NULL REFERENCES country(id),
	id_zipCode                   INT  NOT NULL REFERENCES zipCode (id),
	CHECK (addressCustumerCreatedDate < addressCustumerUpdatedDate)
);


------------------------------------------------------------
-- Table: CustumerVerification
------------------------------------------------------------
CREATE TABLE AdminVerification(
	id                           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	AdminVerificationEmail       BOOLEAN  NOT NULL DEFAULT FALSE,
	AdminVerificationPhone       BOOLEAN  NOT NULL DEFAULT FALSE,
	AdminVerificationEmailDate   timestamptz NOT NULL DEFAULT now(),
	AdminVerificationPhoneDate   timestamptz NOT NULL DEFAULT now(),
	id_custumer                  INT  NOT NULL REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: CustumerInteret
------------------------------------------------------------
CREATE TABLE custumerInteret(
	id                             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	custumerInteretOrderedAmount   posreal  NOT NULL DEFAULT 0,
	custumerInteretNumberOrder     posint  NOT NULL DEFAULT 0,
	id_custumer                    INT  NOT NULL REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: Product
------------------------------------------------------------
CREATE TABLE product(
	id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	productName          text_valid NOT NULL,
	productDescription   text_valid NOT NULL,
	productPrice         posreal  NOT NULL,
	productColor         text_valid NOT NULL,
	productSize          text_valid NOT NULL,
	productCreatedDate	 timestamptz NOT NULL DEFAULT now(),
	productUpdatedDate	 timestamptz NOT NULL,
	productStockQuantity posint NOT NULL,
	ProductQuantitySold	 posint NOT NULL DEFAULT 0,
	id_manufacturer      INT  NOT NULL REFERENCES manufacturer(id),
	id_category          INT  NOT NULL REFERENCES category(id),
	id_taxRate           INT  NOT NULL REFERENCES taxRate(id),
	CHECK (productCreatedDate < productUpdatedDate)
);


------------------------------------------------------------
-- Table: ImageProduct
------------------------------------------------------------
CREATE TABLE imageProduct(
	id                        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	imageProductDescription   text_length  NOT NULL,
	imageProductOrder         text_valid NOT NULL,
	imageProductURL           text_valid NOT NULL,
	id_product                INT  NOT NULL REFERENCES product(id)
	
);


------------------------------------------------------------
-- Table: SpecialPriceProduct
------------------------------------------------------------
CREATE TABLE specialPriceProduct(
	id                                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	specialPriceProductNewProductPrice    posreal,
	specialPriceProductStartDate          DATE,
	specialPriceProductExpiryDate         DATE,
	id_product                            INT  NOT NULL REFERENCES product(id),
	CHECK (specialPriceProductStartDate < specialPriceProductExpiryDate)
);


------------------------------------------------------------
-- Table: Review
------------------------------------------------------------
CREATE TABLE review(
	id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reviewRating   INT  NOT NULL,
	reviewstext    text_length NOT NULL,
	reviewTitle    text_valid NOT NULL,
	id_product     INT  NOT NULL REFERENCES product(id),
	id_custumer    INT  NOT NULL REFERENCES custumer(id)
);

------------------------------------------------------------
-- Table: OderPayement
------------------------------------------------------------
CREATE TABLE orderPayement(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderPayementReference text_valid NOT NULL,
	orderPayementAmount   posreal  NOT NULL,
	orderPayementWay      text_valid NOT NULL,
	orderPayementDate     timestamptz NOT NULL
);

-- clé étrangére rajoutée a la fin...

------------------------------------------------------------
-- Table: Invoice
------------------------------------------------------------
CREATE TABLE invoice(
	id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	invoiceReference   text_valid NOT NULL,
	invoiceDate        DATE  NOT NULL DEFAULT now(),
	id_custumer        INT  NOT NULL REFERENCES custumer(id)
);

-- clé étrangére rajoutée a la fin...

------------------------------------------------------------
-- Table: Order
------------------------------------------------------------
CREATE TABLE "order"(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderReference        posint  NOT NULL,
	orderPurchaseDate     timestamptz NOT NULL DEFAULT now(),
	orderStatus           text_valid NOT NULL,
	orderComments         text_valid NOT NULL,
	id_custumer           INT  NOT NULL REFERENCES custumer(id),
	id_orderPayement      INT  NOT NULL REFERENCES orderPayement(id),
	id_invoice            INT  NOT NULL REFERENCES invoice(id)
);


------------------------------------------------------------
-- Table: OrderShipping
------------------------------------------------------------
CREATE TABLE orderShipping(
	id                             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderShippingCost              posreal  NOT NULL,
	orderShippingNameTransporter   text_valid NOT NULL,
	orderShippingShippedDate	   date,
	orderShippingTrackingNumber    text_valid,
	orderShippingLinkForTracking   text_valid,
	orderShippingWeight            text_valid,
	id_order                       INT  NOT NULL REFERENCES "order"(id)
);

-- tables pour les cardinalitée NN :

------------------------------------------------------------
-- Table: basquetProduct_has_product
------------------------------------------------------------
CREATE TABLE basquetProduct_has_product(
	id 					int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_basquetProduct   INT  NOT NULL REFERENCES basquetProduct(id),
	id_product          INT  NOT NULL REFERENCES product(id)
);


------------------------------------------------------------
-- Table: orderedProduct_has_product
------------------------------------------------------------
CREATE TABLE orderedProduct_has_product(
	id 					int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_orderedProduct   INT  NOT NULL REFERENCES orderedProduct(id),
	Id_product          INT  NOT NULL REFERENCES product(id)
);


------------------------------------------------------------
-- Table: orderedProduct_has_order
------------------------------------------------------------
CREATE TABLE order_has_orderedProduct(
	id 					int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_order            INT  NOT NULL REFERENCES "order"(id),
	id_orderedProduct   INT  NOT NULL REFERENCES orderedProduct(id)	
);


------------------------------------------------------------
-- Table: order_has_addressCustumer
------------------------------------------------------------
CREATE TABLE order_has_addressCustumer(
	id 					 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_order             INT  NOT NULL REFERENCES "order"(id),
	id_addressCustumer   INT  NOT NULL REFERENCES addressCustumer(id)	
);

------------------------------------------------------------
-- Table de liaison entre les tables city et zipcode 
------------------------------------------------------------
CREATE TABLE zipCode_has_city(
	id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_city      INT  NOT NULL REFERENCES city (id),
	id_zipCode   INT  NOT NULL REFERENCES zipCode (id)
);
-----------------------------------------------------------------------------
-- Pour que les references au clé primaire se fasse bien dans le bon ordre...
-----------------------------------------------------------------------------

ALTER TABLE orderPayement ADD COLUMN id_order INT NOT NULL REFERENCES "order"(id);

ALTER TABLE invoice ADD COLUMN id_order INT NOT NULL REFERENCES "order"(id);


--------------------------------
-- Création des principales vues 
--------------------------------

-- Une vue pour les principales infos concernant les clients : 

CREATE VIEW all_custumer AS
SELECT 
	customerGender,
	customerFirstName,
	customerLastName,
	custumerEmail,
	custumerPassword,
	custumerCreatedDate,
	custumerUpdatedDate,
	custumerInteret.custumerInteretOrderedAmount,
	custumerInteret.custumerInteretNumberOrder,
	privilege.privilegeName,
	addressCustumer.addressCustumerTitle,
	addressCustumer.addressCustumerFirstName, --! a completer et aggréger...
	addressCustumer.addressCustumerLastName,
	addressCustumer.addressCustumerPhone,
	addressCustumer.addressCustumerLine1,
	addressCustumer.addressCustumerLine2,
	addressCustumer.addressCustumerCreatedDate,
	addressCustumer.addressCustumerUpdatedDate,
	zipCode.zipCodeCity,
	country.countryName,
	city.cityName
FROM custumer
JOIN custumerInteret ON custumerInteret.id_custumer  = custumer.id
JOIN privilege ON custumer.id_privilege = custumer.id
JOIN addressCustumer ON custumer.id = addressCustumer.id_custumer
JOIN country ON country.id = addressCustumer.id_country
JOIN zipCode ON zipCode.id = addressCustumer.id_zipCode
JOIN zipCode_has_city ON zipCode_has_city.id_zipCode = zipCode.id
JOIN city ON zipCode_has_city.id_city = city.id
ORDER BY custumer.customerFirstName ASC;


-- Une vue pour les principales infos concernant les produits : 


CREATE VIEW all_product AS
SELECT 	
	productName,     
	productDescription,
	productPrice,
	productColor,        
	productSize,        
	productCreatedDate,
	productUpdatedDate,
	productStockQuantity,
	ProductQuantitySold,
	category.categoryName,          
	category.categoryDescription,
	category.categoryOrder,
	category.categoryImageURL,     
	taxRate.taxRateValue,  
	taxRate.taxeRateName,         
	taxRate.taxeRateDescription,  
	manufacturer.manufacturerName, 
	manufacturer.manufacturerLogo,
	imageProduct.imageProductDescription,
	imageProduct.imageProductOrder,  
	imageProduct.imageProductURL,        
	specialPriceProduct.specialPriceProductNewProductPrice,
	specialPriceProduct.specialPriceProductStartDate,
	specialPriceProduct.specialPriceProductExpiryDate
FROM product
JOIN category ON product.id_category = category.id
JOIN taxRate ON product.id_taxRate = taxRate.id
JOIN manufacturer ON product.id_manufacturer = manufacturer.id
JOIN imageProduct ON imageProduct.id_product = product.id
JOIN specialPriceProduct ON specialPriceProduct.id_product = product.id
ORDER BY product.productName ASC;


-- Une vue pour les principales infos concernant une commande (order) : 

CREATE VIEW all_order AS
SELECT
	orderReference,
	orderPurchaseDate,
	orderStatus,
	orderComments,
	orderShipping.orderShippingCost,
	orderShipping.orderShippingNameTransporter,
	orderShipping.orderShippingTrackingNumber,
	orderShipping.orderShippingShippedDate,
	orderShipping.orderShippingLinkForTracking,
	orderShipping.orderShippingWeight,
	orderPayement.orderPayementReference,
	orderPayement.orderPayementAmount,
	orderPayement.orderPayementWay,
	orderPayement.orderPayementDate,
	invoice.invoiceReference,
	invoice.invoiceDate,
	orderedProduct.orderedProductName,
	orderedProduct.orderedProductQuantity,
	orderedProduct.orderedProductPrice,
	orderedProduct.orderedProductTax,
	addressCustumer.addressCustumerFirstName,
	addressCustumer.addressCustumerLastName,
	addressCustumer.addressCustumerLine1,
	addressCustumer.addressCustumerLine2,
	zipCode.zipCodeCity,
	city.cityName,
	country.countryName
FROM "order"
JOIN orderShipping ON orderShipping.id_order = "order".id
JOIN orderPayement ON orderPayement.id_order = "order".id
JOIN invoice ON invoice.id_order = "order".id
JOIN order_has_orderedProduct ON order_has_orderedProduct.id_order = "order".id
JOIN orderedProduct ON order_has_orderedProduct.id_orderedProduct = orderedProduct.id
JOIN order_has_addressCustumer ON order_has_addressCustumer.id_order = "order".id
JOIN addressCustumer ON order_has_addressCustumer.id_addressCustumer = addressCustumer.id
JOIN country ON country.id = addressCustumer.id_country
JOIN zipCode ON zipCode.id = addressCustumer.id_zipCode
JOIN zipCode_has_city ON zipCode_has_city.id_zipCode = zipCode.id
JOIN city ON zipCode_has_city.id_city = city.id
ORDER BY orderedProduct.orderedProductName ASC;

COMMIT;