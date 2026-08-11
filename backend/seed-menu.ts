import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuItems = [
  { name: 'Chapathi', price: 20, category: 'Veg', description: 'Soft and healthy whole wheat flatbread, perfect with any curry.', prepTime: 10, calories: 120 },
  { name: 'Roti', price: 30, category: 'Veg', description: 'Traditional tandoor-baked flatbread with a slight crisp on the outside.', prepTime: 10, calories: 150 },
  { name: 'Parota', price: 30, category: 'Veg', description: 'Flaky, layered, and buttery flatbread from South India.', prepTime: 15, calories: 220 },
  { name: 'Roomali Roti', price: 40, category: 'Veg', description: 'Extremely thin and soft flatbread, folded like a handkerchief.', prepTime: 12, calories: 180 },
  { name: 'Chicken Biryani', price: 190, halfPrice: 300, familyPrice: 450, isMultiSize: true, category: 'Non-Veg', description: 'Aromatic basmati rice cooked with succulent chicken and local spices.', prepTime: 25, calories: 680, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1615560940/sample.jpg' },
  { name: 'Chicken Mutton Biryani', price: 190, halfPrice: 300, familyPrice: 450, isMultiSize: true, category: 'Non-Veg', description: 'A royal mix of tender chicken and mutton pieces with fragrant rice.', prepTime: 30, calories: 720 },
  { name: 'Fish Biryani', price: 220, halfPrice: 350, familyPrice: 550, isMultiSize: true, category: 'Non-Veg', description: 'Fresh fish fillets marinated in coastal spices layered with biryani rice.', prepTime: 25, calories: 610 },
  { name: 'Prawns Biryani', price: 260, halfPrice: 400, familyPrice: 600, isMultiSize: true, category: 'Non-Veg', description: 'Juicy prawns slow-cooked with basmati rice and signature masala.', prepTime: 25, calories: 590 },
  { name: 'Mutton Biryani', price: 230, halfPrice: 350, familyPrice: 600, isMultiSize: true, category: 'Non-Veg', description: 'Premium tender mutton pieces cooked with rich spices and saffron rice.', prepTime: 35, calories: 750 },
];

async function main() {
  console.log('Seeding menu items...');

  let vegCategory = await prisma.category.findUnique({ where: { name: 'Veg' } });
  if (!vegCategory) {
    vegCategory = await prisma.category.create({ data: { name: 'Veg', description: 'Vegetarian dishes' } });
  }

  let nonVegCategory = await prisma.category.findUnique({ where: { name: 'Non-Veg' } });
  if (!nonVegCategory) {
    nonVegCategory = await prisma.category.create({ data: { name: 'Non-Veg', description: 'Non-Vegetarian dishes' } });
  }

  await prisma.menuItem.deleteMany({}); // Clear existing to prevent duplicates
  
  for (const item of menuItems) {
    const categoryId = item.category === 'Veg' ? vegCategory.id : nonVegCategory.id;
    
    await prisma.menuItem.create({
      data: {
        name: item.name,
        price: item.price,
        description: item.description,
        categoryId: categoryId,
        prepTime: item.prepTime,
        calories: item.calories,
        imageUrl: item.imageUrl || null,
        availability: true,
        isMultiSize: (item as any).isMultiSize || false,
        halfPrice: (item as any).halfPrice || null,
        familyPrice: (item as any).familyPrice || null,
      },
    });
  }

  console.log('Successfully seeded menu items!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
