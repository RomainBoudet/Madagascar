
// attend des nombres à virgules séparé avec des points entre entier et décimal 12.36 et NON 12,36
const arrondi = (number) => {
    return  Number((Math.round(number * 100)/100).toFixed(2));
 };

 module.exports = {
   arrondi
};