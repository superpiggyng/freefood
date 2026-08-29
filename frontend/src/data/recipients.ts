/* Anonymous demand pool. Used to show a business how many nearby people a
   listing would actually suit, without exposing anyone's personal details. */
export interface DemandProfile { id: number; suburb: string; distance: number; avoid: string[]; preferences: string[]; needScore: number }

const suburbs = ['Marrickville', 'Newtown', 'Parramatta', 'Auburn', 'Blacktown', 'Liverpool'];
const avoidSets = [[], ['Peanut'], ['Milk'], ['Wheat'], ['Soy'], ['Tree nuts'], ['Peanut', 'Sesame'], []];
const preferenceSets = [['Vegetarian'], ['Vegan'], ['Halal'], ['Gluten-free'], ['Dairy-free'], ['Vegetarian', 'Halal'], [], ['Vegan', 'Gluten-free']];

export const demandPool: DemandProfile[] = Array.from({ length: 48 }, (_, index) => ({
  id: index + 1,
  suburb: suburbs[index % suburbs.length],
  distance: Number((0.4 + ((index * 7) % 45) / 10).toFixed(1)),
  avoid: avoidSets[index % avoidSets.length],
  preferences: preferenceSets[(index * 3) % preferenceSets.length],
  needScore: 45 + ((index * 13) % 50),
}));
