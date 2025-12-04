import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';
import connectDB from '../config/database.js';

dotenv.config();

// Sample Arabic names
const arabicNames = [
  'أحمد محمد', 'فاطمة علي', 'محمد حسن', 'سارة أحمد', 'علي محمود',
  'مريم خالد', 'خالد إبراهيم', 'نورا سعيد', 'يوسف عمر', 'ليلى عبدالله',
  'عمر محمد', 'سلمى أحمد', 'حسن علي', 'ريم خالد', 'طارق محمود',
  'هدى سعيد', 'مصطفى إبراهيم', 'زينب عمر', 'عبدالله محمد', 'لينا أحمد',
  'كريم علي', 'نور خالد', 'محمود حسن', 'دينا سعيد', 'باسم إبراهيم',
  'رانيا عمر', 'وليد محمد', 'شيماء أحمد', 'جمال علي', 'هند خالد'
];

// Sample English comments
const englishComments = [
  'Excellent quality and fast shipping! Very satisfied with my purchase.',
  'Amazing product! The quality exceeded my expectations. Highly recommended!',
  'Great service and beautiful design. Will definitely order again.',
  'Perfect fit and comfortable material. Love it!',
  'Outstanding quality! The product arrived exactly as described.',
  'Very happy with my purchase. The quality is top-notch!',
  'Beautiful design and excellent craftsmanship. Highly satisfied!',
  'Great value for money. The product is exactly what I needed.',
  'Fast delivery and excellent quality. Will shop here again!',
  'Amazing experience! The product quality is outstanding.',
  'Perfect product! Exceeded all my expectations. Highly recommended!',
  'Great service and beautiful design. Very satisfied!',
  'Excellent quality and fast shipping. Will order again!',
  'Amazing product! The quality is exceptional. Love it!',
  'Perfect fit and comfortable. Highly satisfied with my purchase!',
  'Outstanding quality! The product is exactly as described.',
  'Very happy with my purchase. Excellent service and quality!',
  'Beautiful design and great craftsmanship. Highly recommended!',
  'Great value for money. The product exceeded my expectations!',
  'Fast delivery and excellent quality. Will definitely shop here again!',
  'Amazing experience! The product quality is top-notch.',
  'Perfect product! Very satisfied with my purchase. Highly recommended!',
  'Great service and beautiful design. Will order again for sure!',
  'Excellent quality and fast shipping. Love it!',
  'Amazing product! The quality is exceptional. Highly satisfied!',
  'Perfect fit and comfortable material. Exceeded my expectations!',
  'Outstanding quality! The product arrived exactly as described.',
  'Very happy with my purchase. The quality is outstanding!',
  'Beautiful design and excellent craftsmanship. Will shop here again!',
  'Great value for money. The product is exactly what I needed!'
];

// Sample Arabic comments
const arabicComments = [
  'جودة ممتازة وشحن سريع! راضٍ جداً عن الشراء.',
  'منتج رائع! الجودة تجاوزت توقعاتي. أنصح به بشدة!',
  'خدمة رائعة وتصميم جميل. سأطلب مرة أخرى بالتأكيد.',
  'مقاس مثالي وقماش مريح. أحبه!',
  'جودة استثنائية! المنتج وصل تماماً كما هو موضح.',
  'سعيد جداً بشرائي. الجودة ممتازة!',
  'تصميم جميل وحرفية ممتازة. راضٍ جداً!',
  'قيمة ممتازة مقابل المال. المنتج هو بالضبط ما أحتاجه.',
  'توصيل سريع وجودة ممتازة. سأتسوق هنا مرة أخرى!',
  'تجربة رائعة! جودة المنتج استثنائية.',
  'منتج مثالي! تجاوز جميع توقعاتي. أنصح به بشدة!',
  'خدمة رائعة وتصميم جميل. راضٍ جداً!',
  'جودة ممتازة وشحن سريع. سأطلب مرة أخرى!',
  'منتج رائع! الجودة استثنائية. أحبه!',
  'مقاس مثالي ومريح. راضٍ جداً بشرائي!',
  'جودة استثنائية! المنتج هو بالضبط كما هو موضح.',
  'سعيد جداً بشرائي. خدمة وجودة ممتازة!',
  'تصميم جميل وحرفية رائعة. أنصح به بشدة!',
  'قيمة ممتازة مقابل المال. المنتج تجاوز توقعاتي!',
  'توصيل سريع وجودة ممتازة. سأتسوق هنا مرة أخرى بالتأكيد!',
  'تجربة رائعة! جودة المنتج ممتازة.',
  'منتج مثالي! راضٍ جداً بشرائي. أنصح به بشدة!',
  'خدمة رائعة وتصميم جميل. سأطلب مرة أخرى بالتأكيد!',
  'جودة ممتازة وشحن سريع. أحبه!',
  'منتج رائع! الجودة استثنائية. راضٍ جداً!',
  'مقاس مثالي وقماش مريح. تجاوز توقعاتي!',
  'جودة استثنائية! المنتج وصل تماماً كما هو موضح.',
  'سعيد جداً بشرائي. الجودة استثنائية!',
  'تصميم جميل وحرفية ممتازة. سأتسوق هنا مرة أخرى!',
  'قيمة ممتازة مقابل المال. المنتج هو بالضبط ما أحتاجه!'
];

// Ratings distribution (more positive reviews)
const ratings = [5, 5, 5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5, 4, 5, 5];

async function seedReviews() {
  try {
    console.log('🌱 Starting review seeding...');
    
    // Connect to database
    await connectDB();
    
    // Get or create test users
    console.log('\n👥 Creating test users...');
    const testUsers = [];
    
    for (let i = 0; i < 30; i++) {
      const name = arabicNames[i];
      const email = `testuser${i + 1}@example.com`;
      
      let user = await User.findOne({ email });
      
      if (!user) {
        // Create new user with a simple password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('password123', 12);
        
        user = new User({
          name: name,
          email: email,
          password: hashedPassword,
          role: 'user',
          isActive: true
        });
        
        await user.save();
        console.log(`✅ Created test user: ${name}`);
      } else {
        console.log(`ℹ️  User already exists: ${name}`);
      }
      
      testUsers.push(user);
    }
    
    // Get first product for product reviews
    console.log('\n📦 Finding a product for reviews...');
    const product = await Product.findOne({ isActive: true });
    
    if (!product) {
      console.log('❌ No active products found. Please seed products first.');
      process.exit(1);
    }
    
    console.log(`✅ Found product: ${product.name} (ID: ${product._id})`);
    
    // Create 30 product reviews
    console.log('\n⭐ Creating 30 product reviews...');
    let productReviewsCreated = 0;
    
    for (let i = 0; i < 30; i++) {
      const user = testUsers[i];
      const rating = ratings[i];
      const comment = englishComments[i];
      const commentAr = arabicComments[i];
      
      // Check if review already exists
      const existingReview = await Review.findOne({
        productId: product._id,
        userId: user._id
      });
      
      if (existingReview) {
        // Update existing review
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.commentAr = commentAr;
        existingReview.isApproved = true;
        existingReview.isActive = true;
        await existingReview.save();
        console.log(`✅ Updated product review ${i + 1}/30 by ${user.name}`);
      } else {
        // Create new review
        const review = new Review({
          productId: product._id,
          userId: user._id,
          rating: rating,
          comment: comment,
          commentAr: commentAr,
          isApproved: true,
          isActive: true
        });
        
        await review.save();
        console.log(`✅ Created product review ${i + 1}/30 by ${user.name}`);
        productReviewsCreated++;
      }
    }
    
    // Create 30 general testimonials (for homepage)
    console.log('\n💬 Creating 30 general testimonials (homepage)...');
    let testimonialsCreated = 0;
    
    for (let i = 0; i < 30; i++) {
      const user = testUsers[i];
      const rating = ratings[i];
      const comment = englishComments[i];
      const commentAr = arabicComments[i];
      
      // Check if testimonial already exists for this user (general testimonials can have multiple per user)
      // But we'll create unique ones by using different comments
      const review = new Review({
        productId: null, // General testimonial
        userId: user._id,
        rating: rating,
        comment: comment,
        commentAr: commentAr,
        isApproved: true,
        isActive: true
      });
      
      try {
        await review.save();
        console.log(`✅ Created testimonial ${i + 1}/30 by ${user.name}`);
        testimonialsCreated++;
      } catch (error) {
        // If duplicate, skip
        if (error.code === 11000) {
          console.log(`ℹ️  Testimonial already exists for user ${user.name}, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n🎉 Review seeding completed successfully!');
    console.log(`   - Product reviews: ${productReviewsCreated} new, ${30 - productReviewsCreated} updated`);
    console.log(`   - General testimonials: ${testimonialsCreated} created`);
    console.log(`   - Product: ${product.name}`);
    
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run seed if called directly
seedReviews()
  .then(() => {
    console.log('✅ Seed reviews script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed reviews script failed:', error);
    process.exit(1);
  });

export default seedReviews;

