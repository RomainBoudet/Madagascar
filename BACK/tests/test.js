const {expect, assertChai} = require('chai');  


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
console.log ('apres Chai');
