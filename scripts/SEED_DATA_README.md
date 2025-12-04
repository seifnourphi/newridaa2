# Seed Data Script

هذا السكريبت يقوم بإضافة البيانات من المشروع القديم إلى قاعدة البيانات الجديدة.

## البيانات المضافة

- **5 فئات**: Djellabas, Abayas, Hijabs, Kaftans, Accessories
- **30 منتج**: منتجات متنوعة من جميع الفئات
- **4 إعلانات**: إعلانات للعروض والمجموعات

## كيفية الاستخدام

### 1. تأكد من أن قاعدة البيانات متصلة

تأكد من أن ملف `.env` يحتوي على `MONGODB_URI`:

```env
MONGODB_URI=mongodb://localhost:27017/ridaa
```

أو إذا كنت تستخدم MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ridaa?retryWrites=true&w=majority
```

### 2. تشغيل السكريبت

من مجلد `backend`:

```bash
npm run seed
```

أو مباشرة:

```bash
node scripts/seed-data.js
```

### 3. النتيجة المتوقعة

سترى رسائل مثل:

```
🌱 Starting data seeding...
✅ MongoDB Connected: localhost:27017

📁 Creating categories...
✅ Created/Updated category: Djellabas
✅ Created/Updated category: Abayas
...

📦 Creating products...
✅ Created/Updated product: Traditional Moroccan Djellaba (Category: Djellabas)
✅ Created/Updated product: Embroidered Djellaba (Category: Djellabas)
...

📢 Creating advertisements...
✅ Created/Updated advertisement: Discover Our Latest Collection
✅ Created/Updated advertisement: Elevate Your Everyday Style
...

🎉 Data seeding completed successfully!
   - Categories: 5
   - Products: 30
   - Advertisements: 4
```

## ملاحظات

- السكريبت يستخدم `findOneAndUpdate` مع `upsert: true`، مما يعني أنه:
  - إذا كان المنتج/الفئة/الإعلان موجوداً بالفعل (حسب `slug` أو `title`)، سيتم تحديثه
  - إذا لم يكن موجوداً، سيتم إنشاؤه
- يمكنك تشغيل السكريبت عدة مرات بأمان - لن يتم إنشاء بيانات مكررة
- إذا أردت إعادة تعيين البيانات، احذف المجموعات من قاعدة البيانات أولاً

## البيانات المضافة

### الفئات (Categories)
1. Djellabas (جلابيات)
2. Abayas (عبايات)
3. Hijabs (حجاب)
4. Kaftans (قفاطن)
5. Accessories (إكسسوارات)

### المنتجات (Products)
- **Djellabas**: 6 منتجات
- **Abayas**: 6 منتجات
- **Hijabs**: 6 منتجات
- **Kaftans**: 6 منتجات
- **Accessories**: 6 منتجات

### الإعلانات (Advertisements)
1. Discover Our Latest Collection
2. Elevate Your Everyday Style
3. Season Sale
4. Premium Quality Products

## استكشاف الأخطاء

إذا واجهت مشاكل:

1. **خطأ في الاتصال بقاعدة البيانات**:
   - تأكد من أن MongoDB يعمل
   - تحقق من `MONGODB_URI` في `.env`

2. **خطأ في البيانات**:
   - تأكد من أن الـ models متوافقة مع البيانات
   - تحقق من أن جميع الحقول المطلوبة موجودة

3. **خطأ في الصور**:
   - الصور تستخدم روابط Unsplash
   - إذا لم تكن متصلاً بالإنترنت، قد تفشل بعض الصور في التحميل

