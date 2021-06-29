------------------------------------------------------------
--        Script Postgres BDD MADA
------------------------------------------------------------
BEGIN;

-- Créattion de domaines =

CREATE DOMAIN posint AS int CHECK (VALUE > 0); -- un domaine permettant de créer un type de donnée strictement positif
CREATE DOMAIN posreal AS REAL CHECK (VALUE > 0);
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

CREATE DOMAIN password as text  -- un domaine (type de donnée) permettant de vérifier la validité d'un mot de passe en hash via une regex (fonctionne avec bcrypt)
CHECK (

		VALUE ~* '^\$2[ayb]\$.{60}$'
	);

	-- https://stackoverflow.com/questions/31417387/regular-expression-to-find-bcrypt-hash
	-- https://stackoverflow.com/questions/5393803/can-someone-explain-how-bcrypt-verifies-a-hash

CREATE DOMAIN text_length AS text
    CHECK (
        char_length(trim(both from VALUE)) >= 15
    );

CREATE DOMAIN text_valid AS text
    CHECK (
        char_length(trim(both from VALUE)) >= 3
    );
------------------------------------------------------------
-- Table: Manufacturer
------------------------------------------------------------
CREATE TABLE manufacturer(
	id               int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	manufacturerName text_valid NOT NULL,
	manufacturerLogo text_valid NOT NULL
);


------------------------------------------------------------
-- Table: Category
------------------------------------------------------------
CREATE TABLE category(
	id                    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	categoryName          text_valid NOT NULL,
	categoryDescription   text_length NOT NULL,
	categoryOrder         int  NOT NULL ,
	categoryImageURL      text_valid NOT NULL
);


------------------------------------------------------------
-- Table: TaxRate
------------------------------------------------------------
CREATE TABLE taxRate(
	id                    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	taxRateValue          posreal  NOT NULL,
	taxeRateName          text_valid NOT NULL,
	taxeRateDescription   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: ZipCode
------------------------------------------------------------
CREATE TABLE zipCode(
	id            int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	zipCodeCity   postale_code_fr NOT NULL 
);


------------------------------------------------------------
-- Table: Country
------------------------------------------------------------
CREATE TABLE country(
	id  		 int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	countryName  text_valid NOT NULL
);


------------------------------------------------------------
-- Table: City
------------------------------------------------------------
CREATE TABLE city(
	id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	cityName   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: OrderedProduct
------------------------------------------------------------
CREATE TABLE orderedProduct(
	id                       int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderedProductName       text_valid NOT NULL,
	orderedProductQuantity   posint  NOT NULL,
	orderedProductPrice      posreal  NOT NULL,
	orderedProductTax        posreal  NOT NULL 

);


------------------------------------------------------------
-- Table: Pivilege
------------------------------------------------------------
CREATE TABLE privilege(
	id              int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	privilegeName   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: Custumer
------------------------------------------------------------
CREATE TABLE custumer(
	id                         int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	customerGender             text_valid NOT NULL,
	customerFirstName          text_valid NOT NULL,
	customerLastName           text_valid NOT NULL,
	custumerEmail              email NOT NULL UNIQUE,
	custumerPhone              phonenumber  NOT NULL,
	custumerPassword           password NOT NULL,
	custumerCreatedDate        timestamptz NOT NULL DEFAULT now(),
	custumerUpdatedDate        timestamptz  NOT NULL,
	custumerNumberTotalOrder   posint  NOT NULL,
	id_privilege               INT NOT NULL REFERENCES privilege(id),
	CHECK (custumerCreatedDate < custumerUpdatedDate)	
);


------------------------------------------------------------
-- Table: BasquetProduct
------------------------------------------------------------
CREATE TABLE basquetProduct(
	id                        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	basquetProductQuantity    posint  NOT NULL,
	basquetProductDateAdded   DATE  DEFAULT now(),
	basquetProductStatus      text_valid NOT NULL,
	basquetProductImage       text_valid NOT NULL,
	id_custumer               INT  NOT NULL  REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: AddressCustumer
------------------------------------------------------------
CREATE TABLE addressCustumer(
	id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	addressCustumerName          text_valid NOT NULL,
	addressCustumerLine1         text_valid NOT NULL,
	addressCustumerLine2         text_valid NOT NULL,
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
CREATE TABLE custumerVerification(
	id                              int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	custumerVerificationEmail       BOOL  NOT NULL,
	custumerVerificationPhone       BOOL  NOT NULL,
	custumerVerificationEmailDate   timestamptz NOT NULL DEFAULT now(),
	custumerVerificationPhoneDate   timestamptz NOT NULL DEFAULT now(),
	id_custumer                     INT  NOT NULL REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: CustumerInteret
------------------------------------------------------------
CREATE TABLE custumerInteret(
	id                             int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	custumerInteretOrderedAmount   posreal  NOT NULL,
	custumerInteretNumberOrder     INT  NOT NULL,
	id_custumer                    INT  NOT NULL REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table de liaison entre les tables city et zipcode 
------------------------------------------------------------
CREATE TABLE zipCode_has_city(
	id           int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_city      INT  NOT NULL REFERENCES city (id),
	id_zipCode   INT  NOT NULL REFERENCES zipCode (id)
);

------------------------------------------------------------
-- Table: ProductStock
------------------------------------------------------------
CREATE TABLE productStock(
	id                     int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	productStockQuantity   INT  NOT NULL,
	iroductStockStatus     text_valid NOT NULL
);

-- clé étrangére ajoutée a la fin..

------------------------------------------------------------
-- Table: Product
------------------------------------------------------------
CREATE TABLE product(
	id                   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	productName          text_valid NOT NULL,
	productDescription   text_valid NOT NULL,
	productPrice         posreal  NOT NULL,
	productColor         text_valid NOT NULL,
	productSize          text_valid NOT NULL,
	productCreatedDate	 timestamptz NOT NULL DEFAULT now(),
	productUpdatedDate	 timestamptz NOT NULL,
	id_manufacturer      INT  NOT NULL REFERENCES manufacturer(id),
	id_category          INT  NOT NULL REFERENCES category(id),
	id_taxRate           INT  NOT NULL REFERENCES taxRate(id),
	id_productStock      INT  NOT NULL REFERENCES productStock(id),
	CHECK (productCreatedDate < productUpdatedDate)
);


------------------------------------------------------------
-- Table: ImageProduct
------------------------------------------------------------
CREATE TABLE imageProduct(
	id                        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	imageProductDescription   text_length  NOT NULL,
	imageProductOrder         text_valid NOT NULL,
	imageProductURL           text_valid NOT NULL,
	id_product                INT  NOT NULL REFERENCES product(id)
	
);


------------------------------------------------------------
-- Table: SpecialPriceProduct
------------------------------------------------------------
CREATE TABLE specialPriceProduct(
	id                                    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	specialPriceProductNewProductPrice    posreal  NOT NULL,
	specialPriceProductStartDate          DATE  NOT NULL,
	specialPriceProductExpiryDate         DATE  NOT NULL,
	id_product                            INT  NOT NULL REFERENCES product(id),
	CHECK (specialPriceProductStartDate < specialPriceProductExpiryDate)
);


------------------------------------------------------------
-- Table: Review
------------------------------------------------------------
CREATE TABLE review(
	id             int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
	id                    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderPayementAmount   posreal  NOT NULL,
	orderPayementWay      text_valid NOT NULL,
	orderPayementDate     timestamptz NOT NULL

);

-- clé étrangére rajoutée a la fin...

------------------------------------------------------------
-- Table: Invoice
------------------------------------------------------------
CREATE TABLE invoice(
	id                 int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	invoiceReference   text_valid NOT NULL,
	invoiceDate        DATE  NOT NULL DEFAULT now(),
	id_custumer        INT  NOT NULL REFERENCES custumer(id)
);

-- clé étrangére rajoutée a la fin...

------------------------------------------------------------
-- Table: Order
------------------------------------------------------------
CREATE TABLE "order"(
	id                  int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderReference      posint  NOT NULL,
	orderBillingName    text_valid NOT NULL,
	orderDeliveryName   text_valid NOT NULL,
	orderPurchaseDate   timestamptz NOT NULL DEFAULT now(),
	orderStatus         text_valid NOT NULL,
	orderShippedDate    DATE NOT NULL,
	orderComments       text_valid NOT NULL,
	id_custumer         INT  NOT NULL REFERENCES custumer(id),
	id_orderPayement    INT  NOT NULL REFERENCES orderPayement(id),
	id_invoice          INT  NOT NULL REFERENCES invoice(id)
);





------------------------------------------------------------
-- Table: OrderShipping
------------------------------------------------------------
CREATE TABLE orderShipping(
	id                             int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderShippingCost              posreal  NOT NULL,
	orderShippingNameTransporter   text_valid NOT NULL,
	id_order                       INT  NOT NULL REFERENCES "order"(id)
);



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
CREATE TABLE orderedProduct_has_order(
	id 					int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_order            INT  NOT NULL REFERENCES "order"(id),
	id_orderedProduct   INT  NOT NULL REFERENCES orderedProduct(id)	
);


------------------------------------------------------------
-- Table: order_has_addressCustumer
------------------------------------------------------------
CREATE TABLE order_has_addressCustumer(
	id 					 int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_order             INT  NOT NULL REFERENCES "order"(id),
	id_addressCustumer   INT  NOT NULL REFERENCES addressCustumer(id)	
);


-- Pour que les references au clé primaire se fasse bien...

ALTER TABLE productStock ADD COLUMN id_product INT NOT NULL REFERENCES product(id);

ALTER TABLE orderPayement ADD COLUMN id_order INT NOT NULL REFERENCES "order"(id);

ALTER TABLE invoice ADD COLUMN id_order INT NOT NULL REFERENCES "order"(id);



COMMIT;