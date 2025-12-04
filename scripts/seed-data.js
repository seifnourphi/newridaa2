import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.model.js';
import Product from '../models/Product.model.js';
import Advertisement from '../models/Advertisement.model.js';
import connectDB from '../config/database.js';

dotenv.config();

// Categories data
const categories = [
  {
    name: 'Djellabas',
    nameAr: 'جلابيات',
    slug: 'djellabas',
    description: 'Traditional Moroccan djellabas',
    descriptionAr: 'جلابيات مغربية تقليدية',
    image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop&crop=center',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Abayas',
    nameAr: 'عبايات',
    slug: 'abayas',
    description: 'Elegant abayas for modern women',
    descriptionAr: 'عبايات أنيقة للنساء العصريات',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Hijabs',
    nameAr: 'حجاب',
    slug: 'hijabs',
    description: 'Beautiful hijabs and headscarves',
    descriptionAr: 'حجاب وأوشحة جميلة',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Kaftans',
    nameAr: 'قفاطن',
    slug: 'kaftans',
    description: 'Luxurious kaftans for special occasions',
    descriptionAr: 'قفاطن فاخرة للمناسبات الخاصة',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Accessories',
    nameAr: 'إكسسوارات',
    slug: 'accessories',
    description: 'Islamic fashion accessories',
    descriptionAr: 'إكسسوارات الموضة الإسلامية',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
    isActive: true,
    sortOrder: 5
  }
];

// Products data
const products = [
  // Djellabas
  {
    name: 'Traditional Moroccan Djellaba',
    nameAr: 'جلابية مغربية تقليدية',
    slug: 'traditional-moroccan-djellaba',
    description: 'Beautiful traditional Moroccan djellaba made with premium fabric',
    descriptionAr: 'جلابية مغربية تقليدية جميلة مصنوعة من أقمشة عالية الجودة',
    price: 299.99,
    salePrice: 249.99,
    stockQuantity: 50,
    isFeatured: true,
    isNew: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Traditional Moroccan Djellaba',
        altAr: 'جلابية مغربية تقليدية'
      },
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&crop=center',
        alt: 'Traditional Moroccan Djellaba',
        altAr: 'جلابية مغربية تقليدية'
      }
    ]
  },
  {
    name: 'Embroidered Djellaba',
    nameAr: 'جلابية مطرزة',
    slug: 'embroidered-djellaba',
    description: 'Elegant embroidered djellaba with traditional patterns',
    descriptionAr: 'جلابية مطرزة أنيقة بأنماط تقليدية',
    price: 399.99,
    salePrice: 349.99,
    stockQuantity: 30,
    isFeatured: true,
    isBestseller: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center',
        alt: 'Embroidered Djellaba',
        altAr: 'جلابية مطرزة'
      },
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&crop=center',
        alt: 'Embroidered Djellaba',
        altAr: 'جلابية مطرزة'
      }
    ]
  },
  {
    name: 'Casual Djellaba',
    nameAr: 'جلابية عادية',
    slug: 'casual-djellaba',
    description: 'Comfortable casual djellaba for everyday wear',
    descriptionAr: 'جلابية عادية مريحة للارتداء اليومي',
    price: 199.99,
    stockQuantity: 75,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&crop=center',
        alt: 'Casual Djellaba',
        altAr: 'جلابية عادية'
      }
    ]
  },
  {
    name: 'Luxury Silk Djellaba',
    nameAr: 'جلابية حرير فاخرة',
    slug: 'luxury-silk-djellaba',
    description: 'Premium silk djellaba for special occasions',
    descriptionAr: 'جلابية حرير فاخرة للمناسبات الخاصة',
    price: 599.99,
    salePrice: 499.99,
    stockQuantity: 20,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Luxury Silk Djellaba',
        altAr: 'جلابية حرير فاخرة'
      }
    ]
  },
  {
    name: 'Modern Djellaba',
    nameAr: 'جلابية عصرية',
    slug: 'modern-djellaba',
    description: 'Contemporary djellaba with modern design',
    descriptionAr: 'جلابية عصرية بتصميم حديث',
    price: 279.99,
    stockQuantity: 40,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&crop=center',
        alt: 'Modern Djellaba',
        altAr: 'جلابية عصرية'
      }
    ]
  },
  {
    name: 'Wedding Djellaba',
    nameAr: 'جلابية زفاف',
    slug: 'wedding-djellaba',
    description: 'Elegant wedding djellaba for brides',
    descriptionAr: 'جلابية زفاف أنيقة للعروس',
    price: 799.99,
    salePrice: 699.99,
    stockQuantity: 15,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center',
        alt: 'Wedding Djellaba',
        altAr: 'جلابية زفاف'
      }
    ]
  },

  // Abayas
  {
    name: 'Classic Black Abaya',
    nameAr: 'عباية سوداء كلاسيكية',
    slug: 'classic-black-abaya',
    description: 'Timeless classic black abaya',
    descriptionAr: 'عباية سوداء كلاسيكية خالدة',
    price: 149.99,
    stockQuantity: 100,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Classic Black Abaya',
        altAr: 'عباية سوداء كلاسيكية'
      }
    ]
  },
  {
    name: 'Embroidered Abaya',
    nameAr: 'عباية مطرزة',
    slug: 'embroidered-abaya',
    description: 'Beautiful embroidered abaya with intricate details',
    descriptionAr: 'عباية مطرزة جميلة بتفاصيل معقدة',
    price: 249.99,
    salePrice: 199.99,
    stockQuantity: 60,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&crop=center',
        alt: 'Embroidered Abaya',
        altAr: 'عباية مطرزة'
      }
    ]
  },
  {
    name: 'Modern Abaya',
    nameAr: 'عباية عصرية',
    slug: 'modern-abaya',
    description: 'Contemporary abaya with modern cut',
    descriptionAr: 'عباية عصرية بقصة حديثة',
    price: 179.99,
    stockQuantity: 80,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center',
        alt: 'Modern Abaya',
        altAr: 'عباية عصرية'
      }
    ]
  },
  {
    name: 'Luxury Abaya',
    nameAr: 'عباية فاخرة',
    slug: 'luxury-abaya',
    description: 'Premium luxury abaya with high-quality materials',
    descriptionAr: 'عباية فاخرة عالية الجودة',
    price: 399.99,
    salePrice: 349.99,
    stockQuantity: 25,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&crop=center',
        alt: 'Luxury Abaya',
        altAr: 'عباية فاخرة'
      }
    ]
  },
  {
    name: 'Casual Abaya',
    nameAr: 'عباية عادية',
    slug: 'casual-abaya',
    description: 'Comfortable casual abaya for daily wear',
    descriptionAr: 'عباية عادية مريحة للارتداء اليومي',
    price: 129.99,
    stockQuantity: 120,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&crop=center',
        alt: 'Casual Abaya',
        altAr: 'عباية عادية'
      }
    ]
  },
  {
    name: 'Designer Abaya',
    nameAr: 'عباية مصممة',
    slug: 'designer-abaya',
    description: 'Exclusive designer abaya with unique style',
    descriptionAr: 'عباية مصممة حصرية بأسلوب فريد',
    price: 499.99,
    stockQuantity: 10,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Designer Abaya',
        altAr: 'عباية مصممة'
      }
    ]
  },

  // Hijabs
  {
    name: 'Silk Hijab',
    nameAr: 'حجاب حرير',
    slug: 'silk-hijab',
    description: 'Luxurious silk hijab in various colors',
    descriptionAr: 'حجاب حرير فاخر بألوان متنوعة',
    price: 49.99,
    stockQuantity: 200,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Silk Hijab',
        altAr: 'حجاب حرير'
      }
    ]
  },
  {
    name: 'Cotton Hijab',
    nameAr: 'حجاب قطني',
    slug: 'cotton-hijab',
    description: 'Comfortable cotton hijab for everyday wear',
    descriptionAr: 'حجاب قطني مريح للارتداء اليومي',
    price: 29.99,
    stockQuantity: 300,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&crop=center',
        alt: 'Cotton Hijab',
        altAr: 'حجاب قطني'
      }
    ]
  },
  {
    name: 'Embroidered Hijab',
    nameAr: 'حجاب مطرز',
    slug: 'embroidered-hijab',
    description: 'Beautiful embroidered hijab with delicate patterns',
    descriptionAr: 'حجاب مطرز جميل بأنماط دقيقة',
    price: 39.99,
    salePrice: 34.99,
    stockQuantity: 150,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center',
        alt: 'Embroidered Hijab',
        altAr: 'حجاب مطرز'
      }
    ]
  },
  {
    name: 'Chiffon Hijab',
    nameAr: 'حجاب شيفون',
    slug: 'chiffon-hijab',
    description: 'Elegant chiffon hijab with flowing drape',
    descriptionAr: 'حجاب شيفون أنيق بتدفق جميل',
    price: 34.99,
    stockQuantity: 180,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&crop=center',
        alt: 'Chiffon Hijab',
        altAr: 'حجاب شيفون'
      }
    ]
  },
  {
    name: 'Printed Hijab',
    nameAr: 'حجاب مطبوع',
    slug: 'printed-hijab',
    description: 'Stylish printed hijab with modern patterns',
    descriptionAr: 'حجاب مطبوع أنيق بأنماط عصرية',
    price: 24.99,
    stockQuantity: 250,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&crop=center',
        alt: 'Printed Hijab',
        altAr: 'حجاب مطبوع'
      }
    ]
  },
  {
    name: 'Luxury Hijab Set',
    nameAr: 'طقم حجاب فاخر',
    slug: 'luxury-hijab-set',
    description: 'Premium hijab set with matching accessories',
    descriptionAr: 'طقم حجاب فاخر مع إكسسوارات متناسقة',
    price: 89.99,
    salePrice: 79.99,
    stockQuantity: 50,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Luxury Hijab Set',
        altAr: 'طقم حجاب فاخر'
      }
    ]
  },

  // Kaftans
  {
    name: 'Traditional Kaftan',
    nameAr: 'قفطان تقليدي',
    slug: 'traditional-kaftan',
    description: 'Beautiful traditional kaftan for special occasions',
    descriptionAr: 'قفطان تقليدي جميل للمناسبات الخاصة',
    price: 399.99,
    salePrice: 349.99,
    stockQuantity: 40,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Traditional Kaftan',
        altAr: 'قفطان تقليدي'
      }
    ]
  },
  {
    name: 'Embroidered Kaftan',
    nameAr: 'قفطان مطرز',
    slug: 'embroidered-kaftan',
    description: 'Luxurious embroidered kaftan with gold thread',
    descriptionAr: 'قفطان مطرز فاخر بخيوط ذهبية',
    price: 599.99,
    salePrice: 499.99,
    stockQuantity: 25,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&crop=center',
        alt: 'Embroidered Kaftan',
        altAr: 'قفطان مطرز'
      }
    ]
  },
  {
    name: 'Modern Kaftan',
    nameAr: 'قفطان عصري',
    slug: 'modern-kaftan',
    description: 'Contemporary kaftan with modern design',
    descriptionAr: 'قفطان عصري بتصميم حديث',
    price: 299.99,
    stockQuantity: 60,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center',
        alt: 'Modern Kaftan',
        altAr: 'قفطان عصري'
      }
    ]
  },
  {
    name: 'Wedding Kaftan',
    nameAr: 'قفطان زفاف',
    slug: 'wedding-kaftan',
    description: 'Elegant wedding kaftan for brides',
    descriptionAr: 'قفطان زفاف أنيق للعروس',
    price: 799.99,
    salePrice: 699.99,
    stockQuantity: 15,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&crop=center',
        alt: 'Wedding Kaftan',
        altAr: 'قفطان زفاف'
      }
    ]
  },
  {
    name: 'Casual Kaftan',
    nameAr: 'قفطان عادي',
    slug: 'casual-kaftan',
    description: 'Comfortable casual kaftan for daily wear',
    descriptionAr: 'قفطان عادي مريح للارتداء اليومي',
    price: 199.99,
    stockQuantity: 80,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&crop=center',
        alt: 'Casual Kaftan',
        altAr: 'قفطان عادي'
      }
    ]
  },
  {
    name: 'Luxury Kaftan',
    nameAr: 'قفطان فاخر',
    slug: 'luxury-kaftan',
    description: 'Premium luxury kaftan with finest materials',
    descriptionAr: 'قفطان فاخر عالي الجودة',
    price: 899.99,
    salePrice: 799.99,
    stockQuantity: 10,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Luxury Kaftan',
        altAr: 'قفطان فاخر'
      }
    ]
  },

  // Accessories
  {
    name: 'Prayer Beads',
    nameAr: 'مسبحة',
    slug: 'prayer-beads',
    description: 'Beautiful prayer beads made from natural materials',
    descriptionAr: 'مسبحة جميلة مصنوعة من مواد طبيعية',
    price: 29.99,
    stockQuantity: 100,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Prayer Beads',
        altAr: 'مسبحة'
      }
    ]
  },
  {
    name: 'Islamic Jewelry Set',
    nameAr: 'طقم مجوهرات إسلامية',
    slug: 'islamic-jewelry-set',
    description: 'Elegant Islamic jewelry set with traditional motifs',
    descriptionAr: 'طقم مجوهرات إسلامية أنيق برموز تقليدية',
    price: 149.99,
    salePrice: 129.99,
    stockQuantity: 50,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&crop=center',
        alt: 'Islamic Jewelry Set',
        altAr: 'طقم مجوهرات إسلامية'
      }
    ]
  },
  {
    name: 'Hijab Pins',
    nameAr: 'دبابيس حجاب',
    slug: 'hijab-pins',
    description: 'Decorative hijab pins in various designs',
    descriptionAr: 'دبابيس حجاب زخرفية بتصاميم متنوعة',
    price: 19.99,
    stockQuantity: 200,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop&crop=center',
        alt: 'Hijab Pins',
        altAr: 'دبابيس حجاب'
      }
    ]
  },
  {
    name: 'Islamic Wall Art',
    nameAr: 'فن جدار إسلامي',
    slug: 'islamic-wall-art',
    description: 'Beautiful Islamic wall art with calligraphy',
    descriptionAr: 'فن جدار إسلامي جميل بالخط العربي',
    price: 79.99,
    stockQuantity: 75,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&crop=center',
        alt: 'Islamic Wall Art',
        altAr: 'فن جدار إسلامي'
      }
    ]
  },
  {
    name: 'Prayer Mat',
    nameAr: 'سجادة صلاة',
    slug: 'prayer-mat',
    description: 'Comfortable prayer mat with beautiful design',
    descriptionAr: 'سجادة صلاة مريحة بتصميم جميل',
    price: 39.99,
    stockQuantity: 150,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&crop=center',
        alt: 'Prayer Mat',
        altAr: 'سجادة صلاة'
      }
    ]
  },
  {
    name: 'Islamic Perfume',
    nameAr: 'عطر إسلامي',
    slug: 'islamic-perfume',
    description: 'Premium Islamic perfume with natural scents',
    descriptionAr: 'عطر إسلامي فاخر بروائح طبيعية',
    price: 89.99,
    salePrice: 79.99,
    stockQuantity: 60,
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop&crop=center',
        alt: 'Islamic Perfume',
        altAr: 'عطر إسلامي'
      }
    ]
  }
];

// Advertisements data
const advertisements = [
  {
    title: 'Discover Our Latest Collection',
    titleAr: 'اكتشف مجموعتنا الأحدث',
    subtitle: 'Latest',
    subtitleAr: 'الأحدث',
    badge: 'New Arrivals',
    badgeAr: 'وصل حديثاً',
    description: 'Discover our latest collection of modern fashion items designed for comfort and style.',
    descriptionAr: 'اكتشف مجموعتنا الأحدث من الأزياء العصرية المصممة للراحة والأناقة.',
    buttonText: 'Shop New Arrivals',
    buttonTextAr: 'تسوق الوافدات الجديدة',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    price: 79.99,
    originalPrice: 99.99,
    displayType: 'GRID',
    sortOrder: 1,
    isActive: true,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
        alt: 'Modern Style',
        altAr: 'أسلوب عصري',
        name: 'Modern Style',
        nameAr: 'أسلوب عصري',
        price: 79.99,
        sortOrder: 1
      },
      {
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
        alt: 'Casual Collection',
        altAr: 'مجموعة كاجوال',
        name: 'Casual Collection',
        nameAr: 'مجموعة كاجوال',
        price: 64.99,
        sortOrder: 2
      },
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
        alt: 'Premium Design',
        altAr: 'تصميم مميز',
        name: 'Premium Design',
        nameAr: 'تصميم مميز',
        price: 89.99,
        sortOrder: 3
      },
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
        alt: 'Elegant Series',
        altAr: 'سلسلة أنيقة',
        name: 'Elegant Series',
        nameAr: 'سلسلة أنيقة',
        price: 74.99,
        sortOrder: 4
      }
    ]
  },
  {
    title: 'Elevate Your Everyday Style',
    titleAr: 'ارتقِ بأسلوبك اليومي',
    subtitle: '',
    subtitleAr: '',
    badge: 'FALL COLLECTION 2025',
    badgeAr: 'مجموعة الخريف 2025',
    description: 'Discover our curated collection of premium essentials designed for comfort and versatility. Timeless pieces that transition seamlessly from day to night.',
    descriptionAr: 'اكتشف مجموعتنا المختارة من الأساسيات المميزة المصممة للراحة والتنوع. قطع خالدة تنتقل بسلاسة من النهار إلى الليل.',
    buttonText: 'Shop Collection',
    buttonTextAr: 'تسوق المجموعة',
    image: '/uploads/good.png',
    price: 89.99,
    originalPrice: 129.99,
    displayType: 'SINGLE',
    sortOrder: 2,
    isActive: true,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right',
    images: []
  },
  {
    title: 'Season Sale',
    titleAr: 'عروض الموسم',
    subtitle: 'Up To 50% Off',
    subtitleAr: 'خصم حتى 50%',
    badge: 'Limited Time',
    badgeAr: 'عرض محدود',
    description: 'Discover our new collection of modern fashion at unbeatable prices. Limited time offers.',
    descriptionAr: 'اكتشف مجموعتنا الجديدة من الأزياء العصرية بأسعار لا تُقاوم. عروض محدودة لفترة قصيرة.',
    buttonText: 'Shop Sale',
    buttonTextAr: 'تسوق العروض',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    price: 64.99,
    originalPrice: 129.99,
    displayType: 'SINGLE',
    sortOrder: 3,
    isActive: true,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right',
    images: []
  },
  {
    title: 'Premium Quality Products',
    titleAr: 'منتجات عالية الجودة',
    subtitle: 'Products',
    subtitleAr: 'المنتجات',
    badge: 'Featured Collection',
    badgeAr: 'مجموعة مميزة',
    description: 'Discover our high-quality products made from the finest materials. Handcrafted quality and lifetime warranty.',
    descriptionAr: 'اكتشف منتجاتنا عالية الجودة المصنوعة من أفضل المواد. جودة يدوية وضمان مدى الحياة.',
    buttonText: 'Explore Collection',
    buttonTextAr: 'استكشف المجموعة',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    price: 89.99,
    originalPrice: 129.99,
    displayType: 'FEATURED',
    sortOrder: 4,
    isActive: true,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right',
    images: []
  }
];

// Category mapping (slug to category index)
const categoryMapping = {
  'djellabas': 0,
  'abayas': 1,
  'hijabs': 2,
  'kaftans': 3,
  'accessories': 4
};

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');
    
    // Connect to database
    await connectDB();
    
    // 1. Create Categories
    console.log('\n📁 Creating categories...');
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = await Category.findOneAndUpdate(
        { slug: categoryData.slug },
        categoryData,
        { upsert: true, new: true }
      );
      createdCategories.push(category);
      console.log(`✅ Created/Updated category: ${category.name}`);
    }
    
    // 2. Delete all existing products to avoid SKU conflicts
    console.log('\n🗑️  Deleting existing products to avoid conflicts...');
    const deleteResult = await Product.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing products`);
    
    // 3. Create Products
    console.log('\n📦 Creating products...');
    for (const productData of products) {
      // Determine category based on slug
      let categoryIndex = 0;
      if (productData.slug.includes('djellaba')) {
        categoryIndex = 0;
      } else if (productData.slug.includes('abaya')) {
        categoryIndex = 1;
      } else if (productData.slug.includes('hijab') && !productData.slug.includes('pin')) {
        categoryIndex = 2;
      } else if (productData.slug.includes('kaftan')) {
        categoryIndex = 3;
      } else {
        categoryIndex = 4; // Accessories
      }
      
      const category = createdCategories[categoryIndex];
      
      // Extract images from productData
      const { images, ...restProductData } = productData;
      
      // Generate SKU from slug if not provided
      const sku = productData.slug.toUpperCase().replace(/-/g, '-');
      
      // Calculate discountPercent if salePrice exists
      let discountPercent = undefined;
      if (restProductData.salePrice && restProductData.price) {
        discountPercent = Math.round(((restProductData.price - restProductData.salePrice) / restProductData.price) * 100);
      }
      
      const product = await Product.findOneAndUpdate(
        { slug: productData.slug },
        {
          ...restProductData,
          sku: sku,
          category: category._id,
          isActive: true,
          discountPercent: discountPercent,
          images: images || []
        },
        { upsert: true, new: true }
      );
      
      console.log(`✅ Created/Updated product: ${product.name} (Category: ${category.name})`);
    }
    
    // 4. Create Advertisements
    console.log('\n📢 Creating advertisements...');
    for (const adData of advertisements) {
      const advertisement = await Advertisement.findOneAndUpdate(
        { title: adData.title },
        adData,
        { upsert: true, new: true }
      );
      console.log(`✅ Created/Updated advertisement: ${advertisement.title}`);
    }
    
    console.log('\n🎉 Data seeding completed successfully!');
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Advertisements: ${advertisements.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed');
  }
}

// Run seed if called directly
seedData()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

export default seedData;

