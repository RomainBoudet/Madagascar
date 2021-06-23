------------------------------------------------------------
--        Script Postgre 
------------------------------------------------------------



------------------------------------------------------------
-- Table: Manufacturer
------------------------------------------------------------
CREATE TABLE public.Manufacturer(
	Id_Manufacturer    SERIAL NOT NULL ,
	ManufacturerName   VARCHAR (50) NOT NULL ,
	ManufacturerLogo   VARCHAR (50) NOT NULL  ,
	CONSTRAINT Manufacturer_PK PRIMARY KEY (Id_Manufacturer)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Category
------------------------------------------------------------
CREATE TABLE public.Category(
	Id_Category           SERIAL NOT NULL ,
	CategoryName          VARCHAR (50) NOT NULL ,
	CategoryDescription   VARCHAR (2000)  NOT NULL ,
	CategoryOrder         INT  NOT NULL ,
	CategoryImageURL      VARCHAR (50) NOT NULL  ,
	CONSTRAINT Category_PK PRIMARY KEY (Id_Category)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: TaxRate
------------------------------------------------------------
CREATE TABLE public.TaxRate(
	Id_TaxRate            SERIAL NOT NULL ,
	TaxRateValue          INT  NOT NULL ,
	TaxeRateName          VARCHAR (50) NOT NULL ,
	TaxeRateDescription   VARCHAR (50) NOT NULL  ,
	CONSTRAINT TaxRate_PK PRIMARY KEY (Id_TaxRate)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ZipCode
------------------------------------------------------------
CREATE TABLE public.ZipCode(
	Id_ZipCode    SERIAL NOT NULL ,
	ZipCodeCity   INT  NOT NULL  ,
	CONSTRAINT ZipCode_PK PRIMARY KEY (Id_ZipCode)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Country
------------------------------------------------------------
CREATE TABLE public.Country(
	Id_Country    SERIAL NOT NULL ,
	CountryName   VARCHAR (50) NOT NULL  ,
	CONSTRAINT Country_PK PRIMARY KEY (Id_Country)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: City
------------------------------------------------------------
CREATE TABLE public.City(
	Id_City    SERIAL NOT NULL ,
	CityName   VARCHAR (50) NOT NULL  ,
	CONSTRAINT City_PK PRIMARY KEY (Id_City)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: OrderedProduct
------------------------------------------------------------
CREATE TABLE public.OrderedProduct(
	iD_OrderedProduct        SERIAL NOT NULL ,
	OrderedProductName       VARCHAR (50) NOT NULL ,
	OrderedProductQuantity   INT  NOT NULL ,
	OrderedProductPrice      FLOAT  NOT NULL ,
	OrderedProductTax        FLOAT  NOT NULL  ,
	CONSTRAINT OrderedProduct_PK PRIMARY KEY (iD_OrderedProduct)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Pivilege
------------------------------------------------------------
CREATE TABLE public.Pivilege(
	Id_Privilege    SERIAL NOT NULL ,
	PrivilegeName   VARCHAR (50) NOT NULL  ,
	CONSTRAINT Pivilege_PK PRIMARY KEY (Id_Privilege)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Custumer
------------------------------------------------------------
CREATE TABLE public.Custumer(
	Id_Cutumer                 SERIAL NOT NULL ,
	CustomerGender             VARCHAR (50) NOT NULL ,
	CustomerFirstName          VARCHAR (50) NOT NULL ,
	CustomerLastName           VARCHAR (50) NOT NULL ,
	CustumerEmail              VARCHAR (50) NOT NULL ,
	CustumerPhone              INT  NOT NULL ,
	CustumerPassword           VARCHAR (50) NOT NULL ,
	CustumerCreatedDate        DATE  NOT NULL ,
	CustumerUpdatedDate        DATE  NOT NULL ,
	CustumerNumberTotalOrder   INT  NOT NULL ,
	Id_Privilege               INT  NOT NULL  ,
	CONSTRAINT Custumer_PK PRIMARY KEY (Id_Cutumer)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: BasquetProduct
------------------------------------------------------------
CREATE TABLE public.BasquetProduct(
	Id_BasquetProduct         SERIAL NOT NULL ,
	BasquetProductQuantity    INT  NOT NULL ,
	BasquetProductDateAdded   DATE  NOT NULL ,
	BasquetProductStatus      VARCHAR (50) NOT NULL ,
	BasquetProductImage       VARCHAR (50) NOT NULL ,
	Id_Cutumer                INT  NOT NULL  ,
	CONSTRAINT BasquetProduct_PK PRIMARY KEY (Id_BasquetProduct)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: AddressCustumer
------------------------------------------------------------
CREATE TABLE public.AddressCustumer(
	Id_AddressCustumer           SERIAL NOT NULL ,
	AddressCustumerName          VARCHAR (50) NOT NULL ,
	AddressCustumerLine1         VARCHAR (50) NOT NULL ,
	AddressCustumerLine2         VARCHAR (50) NOT NULL ,
	AddressCustumerCreatedDate   DATE  NOT NULL ,
	AddressCustumerUpdatedDate   DATE  NOT NULL ,
	Id_Cutumer                   INT  NOT NULL ,
	Id_Country                   INT  NOT NULL ,
	Id_ZipCode                   INT  NOT NULL  ,
	CONSTRAINT AddressCustumer_PK PRIMARY KEY (Id_AddressCustumer)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: CustumerVerification
------------------------------------------------------------
CREATE TABLE public.CustumerVerification(
	Id_CustumerVerification         SERIAL NOT NULL ,
	CustumerVerificationEmail       BOOL  NOT NULL ,
	CustumerVerificationPhone       BOOL  NOT NULL ,
	CustumerVerificationEmailDate   DATE  NOT NULL ,
	CustumerVerificationPhoneDate   DATE  NOT NULL ,
	Id_Cutumer                      INT  NOT NULL  ,
	CONSTRAINT CustumerVerification_PK PRIMARY KEY (Id_CustumerVerification)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: CustumerInteret
------------------------------------------------------------
CREATE TABLE public.CustumerInteret(
	Id_CustumerInteret             SERIAL NOT NULL ,
	CustumerInteretOrderedAmount   FLOAT  NOT NULL ,
	CustumerInteretNumberOrder     INT  NOT NULL ,
	Id_Cutumer                     INT  NOT NULL  ,
	CONSTRAINT CustumerInteret_PK PRIMARY KEY (Id_CustumerInteret)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Representer
------------------------------------------------------------
CREATE TABLE public.Representer(
	Id_City      INT  NOT NULL ,
	Id_ZipCode   INT  NOT NULL  ,
	CONSTRAINT Representer_PK PRIMARY KEY (Id_City,Id_ZipCode)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Product
------------------------------------------------------------
CREATE TABLE public.Product(
	Id_Product           SERIAL NOT NULL ,
	ProductName          VARCHAR (50) NOT NULL ,
	ProductDescription   VARCHAR (50) NOT NULL ,
	ProductPrice         FLOAT  NOT NULL ,
	ProductColor         VARCHAR (50) NOT NULL ,
	ProductSize          VARCHAR (50) NOT NULL ,
	Id_Manufacturer      INT   ,
	Id_Category          INT  NOT NULL ,
	Id_TaxRate           INT  NOT NULL ,
	Id_ProductStock      INT  NOT NULL  ,
	CONSTRAINT Product_PK PRIMARY KEY (Id_Product)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ImageProduct
------------------------------------------------------------
CREATE TABLE public.ImageProduct(
	Id_ImageProduct           SERIAL NOT NULL ,
	ImageProductDescription   VARCHAR (2000)  NOT NULL ,
	ImageProductOrder         VARCHAR (50) NOT NULL ,
	ImageProductURL           VARCHAR (50) NOT NULL ,
	Id_Product                INT  NOT NULL  ,
	CONSTRAINT ImageProduct_PK PRIMARY KEY (Id_ImageProduct)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: SpecialPriceProduct
------------------------------------------------------------
CREATE TABLE public.SpecialPriceProduct(
	Id_SpecialPriceProduct   SERIAL NOT NULL ,
	NewProductPrice          FLOAT  NOT NULL ,
	startDate                DATE  NOT NULL ,
	ExpiryDate               DATE  NOT NULL ,
	Id_Product               INT  NOT NULL  ,
	CONSTRAINT SpecialPriceProduct_PK PRIMARY KEY (Id_SpecialPriceProduct)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Review
------------------------------------------------------------
CREATE TABLE public.Review(
	ID_Review      SERIAL NOT NULL ,
	ReviewRating   INT  NOT NULL ,
	ReviewsText    VARCHAR (50) NOT NULL ,
	ReviewTitle    VARCHAR (50) NOT NULL ,
	Id_Product     INT  NOT NULL ,
	Id_Cutumer     INT  NOT NULL  ,
	CONSTRAINT Review_PK PRIMARY KEY (ID_Review)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Order
------------------------------------------------------------
CREATE TABLE public.Order(
	Id_Order            SERIAL NOT NULL ,
	OrderReference      INT  NOT NULL ,
	OrderBillingName    VARCHAR (50) NOT NULL ,
	OrderDeliveryName   VARCHAR (50) NOT NULL ,
	OrderPurchaseDate   DATE  NOT NULL ,
	OrderStatus         VARCHAR (50) NOT NULL ,
	OrderShippedDate    DATE  NOT NULL ,
	OrderComments       VARCHAR (50) NOT NULL ,
	Id_Cutumer          INT  NOT NULL ,
	Id_OrderPayement    INT  NOT NULL ,
	Id_Invoice          INT  NOT NULL  ,
	CONSTRAINT Order_PK PRIMARY KEY (Id_Order)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: OderPayement
------------------------------------------------------------
CREATE TABLE public.OderPayement(
	Id_OrderPayement      SERIAL NOT NULL ,
	OrderPayementAmount   FLOAT  NOT NULL ,
	OrderPayementWay      VARCHAR (50) NOT NULL ,
	OrderPayementDate     DATE  NOT NULL ,
	Id_Order              INT  NOT NULL  ,
	CONSTRAINT OderPayement_PK PRIMARY KEY (Id_OrderPayement)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: OrderShipping
------------------------------------------------------------
CREATE TABLE public.OrderShipping(
	Id_OrderShipping               SERIAL NOT NULL ,
	OrderShippingCost              FLOAT  NOT NULL ,
	OrderShippingNameTransporter   VARCHAR (50) NOT NULL ,
	Id_Order                       INT  NOT NULL  ,
	CONSTRAINT OrderShipping_PK PRIMARY KEY (Id_OrderShipping)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ProductStock
------------------------------------------------------------
CREATE TABLE public.ProductStock(
	Id_ProductStock        SERIAL NOT NULL ,
	ProductStockQuantity   INT  NOT NULL ,
	ProductStockStatus     VARCHAR (50) NOT NULL ,
	Id_Product             INT  NOT NULL  ,
	CONSTRAINT ProductStock_PK PRIMARY KEY (Id_ProductStock)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Invoice
------------------------------------------------------------
CREATE TABLE public.Invoice(
	Id_Invoice         SERIAL NOT NULL ,
	InvoiceReference   VARCHAR (50) NOT NULL ,
	InvoiceDate        DATE  NOT NULL ,
	Id_Cutumer         INT  NOT NULL ,
	Id_Order           INT  NOT NULL  ,
	CONSTRAINT Invoice_PK PRIMARY KEY (Id_Invoice)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Avoir1
------------------------------------------------------------
CREATE TABLE public.Avoir1(
	Id_BasquetProduct   INT  NOT NULL ,
	Id_Product          INT  NOT NULL  ,
	CONSTRAINT Avoir1_PK PRIMARY KEY (Id_BasquetProduct,Id_Product)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Contenir
------------------------------------------------------------
CREATE TABLE public.Contenir(
	iD_OrderedProduct   INT  NOT NULL ,
	Id_Product          INT  NOT NULL  ,
	CONSTRAINT Contenir_PK PRIMARY KEY (iD_OrderedProduct,Id_Product)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Appartenir1
------------------------------------------------------------
CREATE TABLE public.Appartenir1(
	Id_Order            INT  NOT NULL ,
	iD_OrderedProduct   INT  NOT NULL  ,
	CONSTRAINT Appartenir1_PK PRIMARY KEY (Id_Order,iD_OrderedProduct)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: Passer2
------------------------------------------------------------
CREATE TABLE public.Passer2(
	Id_Order             INT  NOT NULL ,
	Id_AddressCustumer   INT  NOT NULL  ,
	CONSTRAINT Passer2_PK PRIMARY KEY (Id_Order,Id_AddressCustumer)
)WITHOUT OIDS;




ALTER TABLE public.Custumer
	ADD CONSTRAINT Custumer_Pivilege0_FK
	FOREIGN KEY (Id_Privilege)
	REFERENCES public.Pivilege(Id_Privilege);

ALTER TABLE public.BasquetProduct
	ADD CONSTRAINT BasquetProduct_Custumer0_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.BasquetProduct 
	ADD CONSTRAINT BasquetProduct_Custumer0_AK 
	UNIQUE (Id_Cutumer);

ALTER TABLE public.AddressCustumer
	ADD CONSTRAINT AddressCustumer_Custumer0_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.AddressCustumer
	ADD CONSTRAINT AddressCustumer_Country1_FK
	FOREIGN KEY (Id_Country)
	REFERENCES public.Country(Id_Country);

ALTER TABLE public.AddressCustumer
	ADD CONSTRAINT AddressCustumer_ZipCode2_FK
	FOREIGN KEY (Id_ZipCode)
	REFERENCES public.ZipCode(Id_ZipCode);

ALTER TABLE public.CustumerVerification
	ADD CONSTRAINT CustumerVerification_Custumer0_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.CustumerVerification 
	ADD CONSTRAINT CustumerVerification_Custumer0_AK 
	UNIQUE (Id_Cutumer);

ALTER TABLE public.CustumerInteret
	ADD CONSTRAINT CustumerInteret_Custumer0_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.CustumerInteret 
	ADD CONSTRAINT CustumerInteret_Custumer0_AK 
	UNIQUE (Id_Cutumer);

ALTER TABLE public.Representer
	ADD CONSTRAINT Representer_City0_FK
	FOREIGN KEY (Id_City)
	REFERENCES public.City(Id_City);

ALTER TABLE public.Representer
	ADD CONSTRAINT Representer_ZipCode1_FK
	FOREIGN KEY (Id_ZipCode)
	REFERENCES public.ZipCode(Id_ZipCode);

ALTER TABLE public.Product
	ADD CONSTRAINT Product_Manufacturer0_FK
	FOREIGN KEY (Id_Manufacturer)
	REFERENCES public.Manufacturer(Id_Manufacturer);

ALTER TABLE public.Product
	ADD CONSTRAINT Product_Category1_FK
	FOREIGN KEY (Id_Category)
	REFERENCES public.Category(Id_Category);

ALTER TABLE public.Product
	ADD CONSTRAINT Product_TaxRate2_FK
	FOREIGN KEY (Id_TaxRate)
	REFERENCES public.TaxRate(Id_TaxRate);

ALTER TABLE public.Product
	ADD CONSTRAINT Product_ProductStock3_FK
	FOREIGN KEY (Id_ProductStock)
	REFERENCES public.ProductStock(Id_ProductStock);

ALTER TABLE public.Product 
	ADD CONSTRAINT Product_ProductStock0_AK 
	UNIQUE (Id_ProductStock);

ALTER TABLE public.ImageProduct
	ADD CONSTRAINT ImageProduct_Product0_FK
	FOREIGN KEY (Id_Product)
	REFERENCES public.Product(Id_Product);

ALTER TABLE public.SpecialPriceProduct
	ADD CONSTRAINT SpecialPriceProduct_Product0_FK
	FOREIGN KEY (Id_Product)
	REFERENCES public.Product(Id_Product);

ALTER TABLE public.SpecialPriceProduct 
	ADD CONSTRAINT SpecialPriceProduct_Product0_AK 
	UNIQUE (Id_Product);

ALTER TABLE public.Review
	ADD CONSTRAINT Review_Product0_FK
	FOREIGN KEY (Id_Product)
	REFERENCES public.Product(Id_Product);

ALTER TABLE public.Review
	ADD CONSTRAINT Review_Custumer1_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.Order
	ADD CONSTRAINT Order_Custumer0_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.Order
	ADD CONSTRAINT Order_OderPayement1_FK
	FOREIGN KEY (Id_OrderPayement)
	REFERENCES public.OderPayement(Id_OrderPayement);

ALTER TABLE public.Order
	ADD CONSTRAINT Order_Invoice2_FK
	FOREIGN KEY (Id_Invoice)
	REFERENCES public.Invoice(Id_Invoice);

ALTER TABLE public.Order 
	ADD CONSTRAINT Order_OderPayement0_AK 
	UNIQUE (Id_OrderPayement);

ALTER TABLE public.Order 
	ADD CONSTRAINT Order_Invoice1_AK 
	UNIQUE (Id_Invoice);

ALTER TABLE public.OderPayement
	ADD CONSTRAINT OderPayement_Order0_FK
	FOREIGN KEY (Id_Order)
	REFERENCES public.Order(Id_Order);

ALTER TABLE public.OderPayement 
	ADD CONSTRAINT OderPayement_Order0_AK 
	UNIQUE (Id_Order);

ALTER TABLE public.OrderShipping
	ADD CONSTRAINT OrderShipping_Order0_FK
	FOREIGN KEY (Id_Order)
	REFERENCES public.Order(Id_Order);

ALTER TABLE public.ProductStock
	ADD CONSTRAINT ProductStock_Product0_FK
	FOREIGN KEY (Id_Product)
	REFERENCES public.Product(Id_Product);

ALTER TABLE public.ProductStock 
	ADD CONSTRAINT ProductStock_Product0_AK 
	UNIQUE (Id_Product);

ALTER TABLE public.Invoice
	ADD CONSTRAINT Invoice_Custumer0_FK
	FOREIGN KEY (Id_Cutumer)
	REFERENCES public.Custumer(Id_Cutumer);

ALTER TABLE public.Invoice
	ADD CONSTRAINT Invoice_Order1_FK
	FOREIGN KEY (Id_Order)
	REFERENCES public.Order(Id_Order);

ALTER TABLE public.Invoice 
	ADD CONSTRAINT Invoice_Order0_AK 
	UNIQUE (Id_Order);

ALTER TABLE public.Avoir1
	ADD CONSTRAINT Avoir1_BasquetProduct0_FK
	FOREIGN KEY (Id_BasquetProduct)
	REFERENCES public.BasquetProduct(Id_BasquetProduct);

ALTER TABLE public.Avoir1
	ADD CONSTRAINT Avoir1_Product1_FK
	FOREIGN KEY (Id_Product)
	REFERENCES public.Product(Id_Product);

ALTER TABLE public.Contenir
	ADD CONSTRAINT Contenir_OrderedProduct0_FK
	FOREIGN KEY (iD_OrderedProduct)
	REFERENCES public.OrderedProduct(iD_OrderedProduct);

ALTER TABLE public.Contenir
	ADD CONSTRAINT Contenir_Product1_FK
	FOREIGN KEY (Id_Product)
	REFERENCES public.Product(Id_Product);

ALTER TABLE public.Appartenir1
	ADD CONSTRAINT Appartenir1_Order0_FK
	FOREIGN KEY (Id_Order)
	REFERENCES public.Order(Id_Order);

ALTER TABLE public.Appartenir1
	ADD CONSTRAINT Appartenir1_OrderedProduct1_FK
	FOREIGN KEY (iD_OrderedProduct)
	REFERENCES public.OrderedProduct(iD_OrderedProduct);

ALTER TABLE public.Passer2
	ADD CONSTRAINT Passer2_Order0_FK
	FOREIGN KEY (Id_Order)
	REFERENCES public.Order(Id_Order);

ALTER TABLE public.Passer2
	ADD CONSTRAINT Passer2_AddressCustumer1_FK
	FOREIGN KEY (Id_AddressCustumer)
	REFERENCES public.AddressCustumer(Id_AddressCustumer);
