// Explicit presentation order; never derive this from filesystem sorting.
const displayOrder = [8, 6, 1, 4, 5, 7, 2, 3];
const dimensions = {
  1: [2464, 1792], 2: [2528, 1856], 3: [1664, 2304], 4: [2432, 1792],
  5: [2432, 1760], 6: [1792, 2560], 7: [2272, 1632], 8: [1504, 2176],
};

export const sketchbookItems = displayOrder.map((number, index) => ({
  id: `sketch-${number}`,
  image: `/images/sketchbook/${number}.PNG`,
  order: index + 1,
  width: dimensions[number][0],
  height: dimensions[number][1],
}));
