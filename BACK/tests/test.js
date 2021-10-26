const {expect, assertChai} = require('chai');  
const chalk = require('chalk');
/* 
//https://nodejs.org/dist/latest-v14.x/docs/api/assert.html
const assert = require('assert');

try {
    assert.deepStrictEqual(5,5);
} catch (error) {
    console.log("erreur dans le test !", error);
}

// normalement en JS, {} !== {}, mais ici on passe !
// car assert ne fait pas une égalité strict mais un test d'égalité strict sur chaque propriétés !
// idem pour array vide !
try {
    assert.deepStrictEqual({}, {});
} catch (error) {
    console.log("erreur dans le test !", error);
}

// Vérification du format :
const array = ['test', 12, true];
const expectedArray = ['bar', 13, false];

const checkType = (arr) => arr.map(item => typeof item);

//console.log(checkType(array));

assert.deepStrictEqual(checkType(array), checkType(expectedArray))

// sympa mais doit y avoir mieux...  => Mocha et Chai



// pour tester le type en vanilla :
const myString = 'test';

assert.strictEqual(typeof myString, 'string');

// via chai = 


const anObj = {
    cle:'test'
};

const expectedExample = {cle: 'foo'};

//via node
assert.deepStrictEqual(Object.keys(anObj), Object.keys(expectedExample));


//via chai
console.log ('avant Chai');
expect(myString).to.be.a('string');

// on vérifit que anObj est un objet, avec une clé "cle", qui est de type string ! En une seule ligne :) 
expect(anObj).to.be.a('object').with.property('cle').to.be.a.a('string');
console.log ('apres Chai'); */


//! test sur mon schéma userLogin

const userLoginSchema = require('../app/schemas/userLoginSchema');

// le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)

//Objet a valider
const mockLogin = {
    email:'test@test.fr',
    password:'AZEaze123!'
}
// validate sur un schema Joi retourne un objet avec systématiquement une propriétée value et en cas d'érreur, une propriété error 
expect(userLoginSchema.validate(mockLogin)).not.to.have.property('error');

// Valider qu'un schéma invalide, retourne une érreur
mockLogin.password = 'mot_de_passe_sans_chiffre';

expect(userLoginSchema.validate(mockLogin)).to.have.property('error');


const validation = userLoginSchema.validate(mockLogin).error.details[0].path[0];

console.log(validation);

expect(validation).to.be('test');


console.log(chalk.green(" Test du userLoginSchema passé avec succés ! ✅ "));
