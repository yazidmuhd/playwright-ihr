/** The catalogue as saucedemo shows it; used as the expected values in assertions */
export const PRODUCTS = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99, id: 'sauce-labs-backpack' },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99, id: 'sauce-labs-bike-light' },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99, id: 'sauce-labs-bolt-t-shirt' },
  fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99, id: 'sauce-labs-fleece-jacket' },
  onesie: { name: 'Sauce Labs Onesie', price: 7.99, id: 'sauce-labs-onesie' },
  redTShirt: {
    name: 'Test.allTheThings() T-Shirt (Red)',
    price: 15.99,
    id: 'test.allthethings()-t-shirt-(red)',
  },
} as const;

export type Product = (typeof PRODUCTS)[keyof typeof PRODUCTS];

export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS);

/** saucedemo charges 8% tax on the item total */
export const TAX_RATE = 0.08;

export const CUSTOMER = { firstName: 'Aina', lastName: 'Rahman', postalCode: '25200' };
