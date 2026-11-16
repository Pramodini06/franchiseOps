export const CATEGORIES = ['Starters', 'Main Course', 'Pizza', 'Burgers', 'Beverages', 'Desserts'];
export const CATEGORY_STYLE = {
  Starters: 'from-amber-100 to-orange-200', 'Main Course': 'from-red-100 to-orange-200', Pizza: 'from-yellow-100 to-red-200',
  Burgers: 'from-orange-100 to-amber-300', Beverages: 'from-sky-100 to-teal-200', Desserts: 'from-pink-100 to-rose-200'
};
const ALL = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
// `image` is optional: paste any image URL to replace the emoji placeholder.
const m = (id, name, category, price, emoji, description, veg, sold, branches = ALL, available = true) => ({ id, name, category, price, emoji, description, veg, sold, branches, available, image: '' });
export const initialMenu = [
  m('m1', 'Paneer Tikka', 'Starters', 249, '🍢', 'Tandoor-grilled cottage cheese with mint chutney.', true, 940),
  m('m2', 'Chicken 65', 'Starters', 229, '🍗', 'Spicy South Indian fried chicken, curry leaf tempering.', false, 1210),
  m('m3', 'Veg Spring Rolls', 'Starters', 189, '🥟', 'Crispy rolls stuffed with seasoned vegetables.', true, 610, ['b1', 'b2', 'b4', 'b6']),
  m('m4', 'Gobi Manchurian', 'Starters', 199, '🥦', 'Indo-Chinese crispy cauliflower in tangy sauce.', true, 780),
  m('m5', 'Butter Chicken', 'Main Course', 329, '🍛', 'Creamy tomato gravy with tender tandoori chicken.', false, 1380),
  m('m6', 'Dal Makhani', 'Main Course', 249, '🍲', 'Slow-cooked black lentils finished with butter & cream.', true, 720),
  m('m7', 'Veg Dum Biryani', 'Main Course', 259, '🍚', 'Fragrant basmati layered with vegetables & saffron.', true, 860),
  m('m8', 'Chicken Dum Biryani', 'Main Course', 319, '🍛', 'Hyderabadi-style dum biryani with raita.', false, 1960),
  m('m9', 'Margherita Pizza', 'Pizza', 249, '🍕', 'Classic tomato, basil and mozzarella.', true, 1050),
  m('m10', 'Farmhouse Pizza', 'Pizza', 349, '🍕', 'Loaded with capsicum, onion, mushroom & olives.', true, 690, ALL, false),
  m('m11', 'Peri Peri Chicken Pizza', 'Pizza', 379, '🍕', 'Peri-peri chicken, jalapeño and cheese.', false, 540, ['b1', 'b2', 'b4', 'b5', 'b6']),
  m('m12', 'Classic Veg Burger', 'Burgers', 149, '🍔', 'Crispy veg patty, lettuce, tomato and house sauce.', true, 1120),
  m('m13', 'Crispy Chicken Burger', 'Burgers', 199, '🍔', 'Buttermilk fried chicken with spicy mayo.', false, 1490),
  m('m14', 'Paneer Zinger Burger', 'Burgers', 179, '🍔', 'Crunchy paneer fillet with chipotle sauce.', true, 830),
  m('m15', 'Filter Coffee', 'Beverages', 69, '☕', 'Traditional Mysuru-style decoction coffee.', true, 2210),
  m('m16', 'Mango Lassi', 'Beverages', 99, '🥭', 'Thick yoghurt blended with Alphonso mango.', true, 1180),
  m('m17', 'Fresh Lime Soda', 'Beverages', 79, '🍹', 'Sweet, salted or mixed — served chilled.', true, 960),
  m('m18', 'Gulab Jamun', 'Desserts', 89, '🍮', 'Warm khoya dumplings in rose-cardamom syrup.', true, 1330),
  m('m19', 'Brownie with Ice Cream', 'Desserts', 149, '🍫', 'Fudgy walnut brownie with vanilla scoop.', true, 870),
  m('m20', 'Mysore Pak', 'Desserts', 99, '🍬', 'Ghee-rich gram flour sweet, a Mysuru classic.', true, 520, ['b3', 'b4', 'b5', 'b6'])
];
