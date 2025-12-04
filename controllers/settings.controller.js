import Settings from '../models/Settings.model.js';
import Admin from '../models/Admin.model.js';
import { sendEmail } from '../utils/email.util.js';
import { handleDbError, isDbConnected } from '../utils/db.util.js';

// @desc    Get all admin settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getAdminSettings = async (req, res) => {
  try {
    // Get admin profile
    const admin = await Admin.findById(req.admin.adminId).select('username email');
    
    // Get store settings
    const storeSettings = await Settings.findOne({ key: 'store' });
    
    // Get security settings
    const securitySettings = await Settings.findOne({ key: 'security' });
    
    // Get notification settings
    const notificationSettings = await Settings.findOne({ key: 'notifications' });
    
    // Get SEO settings
    const seoSettings = await Settings.findOne({ key: 'seo' });
    
    // Get Pages Content settings
    const pagesContentSettings = await Settings.findOne({ key: 'pagesContent' });

    // Default values
    const defaultStoreSettings = {
      name: 'RIDAA Fashion',
      nameAr: 'رِداء للأزياء',
      description: 'Premium store',
      descriptionAr: 'متجر الأزياء الإسلامية المميز',
      phone: '+20 100 000 0000',
      email: 'ridaa.store.team@gmail.com',
      whatsapp: '+20 100 000 0000',
      address: 'Cairo, Egypt',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      shippingPrice: 50,
      instaPayNumber: '',
      instaPayAccountName: '',
      vodafoneNumber: '',
      showAdvertisements: true, // Control show/hide of hero advertisements
      socialMedia: {
        facebook: { enabled: false, url: '' },
        instagram: { enabled: false, url: '' },
        twitter: { enabled: false, url: '' },
        youtube: { enabled: false, url: '' }
      },
      announcement: {
        enabled: false,
        variant: 'vertical',
        speed: 160,
        messagesEn: [],
        messagesAr: []
      }
    };

    const defaultSecuritySettings = {
      twoFactorEnabled: false,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordExpiry: 90,
      ipWhitelist: [],
      rateLimitEnabled: true,
      rateLimitMaxRequests: 100,
      rateLimitWindowMs: 900000
    };

    const defaultNotificationSettings = {
      emailNotifications: true,
      orderNotifications: true,
      lowStockAlerts: true,
      dailyReports: false
    };

    const defaultSeoSettings = {
      metaDescriptionAr: 'تسوّق أونلاين أحدث الجلابيات المغربية والثياب العصرية الرجالية من رِداء. خامات فاخرة، تفصيل دقيق، وخيارات مقاسات وألوان تناسب كل المناسبات مع شحن سريع داخل مصر.',
      metaDescriptionEn: 'Shop premium Moroccan djellabas and modern modest wear for men at Ridaa. High‑quality fabrics, elegant tailoring and fast delivery across Egypt.',
      keywords: 'رِداء, رداء, جلابية مغربية, جلابيات رجالي, ملابس إسلامية, ثياب رجالية, djellaba, moroccan djellaba, islamic clothing, thobes, modest wear'
    };

    const defaultPagesContentSettings = {
      contact: {
        heroTitleAr: 'اتصل بنا',
        heroTitleEn: 'Contact Us',
        heroDescriptionAr: 'نحن هنا لمساعدتك في أي وقت. تواصل معنا وسنكون سعداء لخدمتك',
        heroDescriptionEn: 'We are here to help you anytime. Contact us and we will be happy to serve you',
        addressAr: 'مصر',
        addressEn: 'Egypt',
        addressDescriptionAr: 'نحن موجودون في مصر',
        addressDescriptionEn: 'We are located in Egypt',
        workingHoursAr: '9:00 ص - 10:00 م',
        workingHoursEn: '9:00 AM - 10:00 PM',
        workingHoursDescriptionAr: 'من السبت إلى الخميس',
        workingHoursDescriptionEn: 'Saturday to Thursday',
        emailDescriptionAr: 'أرسل لنا رسالة',
        emailDescriptionEn: 'Send us a message',
        whatsappDescriptionAr: 'تواصل معنا مباشرة',
        whatsappDescriptionEn: 'Contact us directly',
        whatsappButtonTextAr: 'ابدأ المحادثة',
        whatsappButtonTextEn: 'Start Chat',
        whatsappMessageAr: 'مرحباً، أريد الاستفسار عن المنتجات',
        whatsappMessageEn: 'Hello, I want to inquire about products'
      },
      about: {
        heroTitleAr: 'من نحن',
        heroTitleEn: 'About Us',
        heroSubtitleAr: 'اكتشف قصة رِداء ورؤيتنا للأزياء العربية الأصيلة',
        heroSubtitleEn: 'Discover RIDAA\'s story and our vision for authentic Arabic fashion',
        heroDescriptionAr: '',
        heroDescriptionEn: '',
        storyTitleAr: 'قصتنا',
        storyTitleEn: 'Our Story',
        storyContentAr: 'رِداء هو وجهتك للأناقة الأصيلة والذوق الرفيع. نقدّم تصاميم تجمع بين الأصالة والحداثة ممزوجة بحب التفاصيل، مستوحاة من الهوية العربية وروح الفخامة الهادئة والتقاليد العريقة.\n\nفي رِداء، نؤمن أن اللباس تعبير عن الهوية والثقة، وأن كل قطعة تحمل رسالة، وأصالة، وبصمة فريدة لصاحبها.\n\nنحن ملتزمون بتقديم أعلى مستويات الجودة، مع خدمة شخصيّة وتجربة تليق بك كجزء من عائلة رداء.',
        storyContentEn: 'RIDAA is your destination for authentic elegance and refined taste. We offer designs that blend authenticity and modernism with a passion for details, inspired by rich Arabic identity and the spirit of timeless luxury.\n\nAt RIDAA, we believe clothing is an expression of identity and confidence, with every piece carrying a message, heritage, and a unique fingerprint for its owner.\n\nWe are committed to delivering top-notch quality, personal service, and an experience worthy of you as part of the RIDAA family.',
        storyImageTextAr: 'الهوية والثقة',
        storyImageTextEn: 'Identity & Confidence',
        storyImageSubtextAr: 'نصنع كل تصميم ليعكس شخصيتك ويلهم من حولك',
        storyImageSubtextEn: 'We craft each design to reflect your character and inspire those around you.',
        featuresTitleAr: 'لماذا تختار رِداء؟',
        featuresTitleEn: 'Why Choose RIDAA?',
        featuresDescriptionAr: 'نحن نقدم تجربة تسوق فريدة مع أعلى مستويات الجودة والخدمة والابتكار.',
        featuresDescriptionEn: 'We offer a unique shopping experience with the highest levels of quality, service, and innovation.',
        features: [
          {
            titleAr: 'عملاء سعداء',
            titleEn: 'Happy Customers',
            descriptionAr: 'أكثر من 10,000 عميل راضي',
            descriptionEn: 'Over 10,000 satisfied customers'
          },
          {
            titleAr: 'جودة عالية',
            titleEn: 'High Quality',
            descriptionAr: 'منتجات عالية الجودة فقط',
            descriptionEn: 'Only high quality products'
          },
          {
            titleAr: 'شغف بالتفاصيل',
            titleEn: 'Passion for Details',
            descriptionAr: 'نحن نهتم بكل التفاصيل',
            descriptionEn: 'We care about every detail'
          },
          {
            titleAr: 'توصيل لكل المحافظات',
            titleEn: 'Nationwide Delivery',
            descriptionAr: 'توصيل سريع وآمن لجميع محافظات مصر',
            descriptionEn: 'Fast, reliable delivery to all governorates in Egypt'
          }
        ],
        missionTitleAr: 'مهمتنا',
        missionTitleEn: 'Our Mission',
        missionContentAr: 'نهدف إلى إحياء أناقة وتقاليد التراث العربي العصري وتقديمها للعالم في قالب من الجودة والرقي.',
        missionContentEn: 'We aim to revive the elegance and traditions of modern Arab heritage, and present them to the world with quality and sophistication.',
        visionTitleAr: 'رؤيتنا',
        visionTitleEn: 'Our Vision',
        visionContentAr: 'أن نكون الوجهة الأولى للأزياء الراقية العربية والأصيلة عالمياً، وأن نوّصل فخامة ثقافتنا لكل عميل باحث عن التفرد.',
        visionContentEn: 'To be the foremost destination for elegant and authentic Arabic fashion globally, bringing the luxury of our culture to every client seeking uniqueness.',
        ctaTitleAr: 'انضم إلى رحلة الأناقة',
        ctaTitleEn: 'Join the Elegance Journey',
        ctaDescriptionAr: 'اكتشف مجموعتنا المميزة من الأزياء العربية الأصيلة واختر ما يناسبك واقتنِ الجودة التي تستحقها.',
        ctaDescriptionEn: 'Discover our exclusive collection of authentic Arabic fashion and choose what suits you and experience the quality you deserve.',
        ctaButton1TextAr: 'تصفح المنتجات',
        ctaButton1TextEn: 'Browse Products',
        ctaButton2TextAr: 'تواصل معنا',
        ctaButton2TextEn: 'Contact Us'
      },
      terms: {
        heroTitleAr: 'الشروط وسياسة الخصوصية',
        heroTitleEn: 'Terms & Privacy Policy',
        heroDescriptionAr: 'اقرأ شروط الاستخدام وسياسة الخصوصية الخاصة بنا',
        heroDescriptionEn: 'Read our terms of use and privacy policy',
        termsTitleAr: 'شروط وأحكام الاستخدام',
        termsTitleEn: 'Terms and Conditions',
        termsLastUpdatedAr: 'آخر تحديث: 2025',
        termsLastUpdatedEn: 'Last Updated: 2025',
        termsSections: [
          {
            subtitleAr: '1. القبول',
            subtitleEn: '1. Acceptance',
            textAr: 'باستخدام موقع رِداء، أنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام موقعنا.',
            textEn: 'By using the RIDAA website, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use our website.'
          },
          {
            subtitleAr: '2. استخدام الموقع',
            subtitleEn: '2. Use of the Website',
            textAr: 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور.',
            textEn: 'You are responsible for maintaining the confidentiality of your account information and password.'
          },
          {
            subtitleAr: '3. المنتجات والأسعار',
            subtitleEn: '3. Products and Pricing',
            textAr: 'نحتفظ بالحق في تغيير الأسعار والمعلومات المتعلقة بالمنتجات في أي وقت دون إشعار مسبق. جميع الصور والنصوص هي لأغراض توضيحية وقد تختلف عن المنتج الفعلي.',
            textEn: 'We reserve the right to change prices and product information at any time without prior notice. All images and descriptions are for illustrative purposes and may differ from the actual product.'
          },
          {
            subtitleAr: '4. الطلبات والدفع',
            subtitleEn: '4. Orders and Payment',
            textAr: 'عند تقديم طلب، فإنك توافق على شراء المنتجات بالأسعار المذكورة. جميع المدفوعات تتم بشكل آمن من خلال أنظمة الدفع المعتمدة.',
            textEn: 'By placing an order, you agree to purchase products at the stated prices. All payments are processed securely through approved payment systems.'
          },
          {
            subtitleAr: '5. الشحن والتسليم',
            subtitleEn: '5. Shipping and Delivery',
            textAr: 'نوفر خدمة الشحن لجميع محافظات مصر. وقت التسليم التقريبي يتراوح بين 3-7 أيام عمل حسب الموقع. قد تتغير التواريخ بسبب ظروف خارجة عن إرادتنا.',
            textEn: 'We provide shipping services to all governorates in Egypt. Estimated delivery time ranges from 3-7 business days depending on location. Delivery dates may change due to circumstances beyond our control.'
          },
          {
            subtitleAr: '6. الإرجاع والاستبدال',
            subtitleEn: '6. Returns and Exchanges',
            textAr: 'يمكنك إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام بشرط أن تكون في حالتها الأصلية وبلا ضرر. بعض المنتجات قد لا تكون قابلة للإرجاع.',
            textEn: 'You may return products within 14 days of receipt, provided they are in their original condition and undamaged. Some products may not be returnable.'
          },
          {
            subtitleAr: '7. الملكية الفكرية',
            subtitleEn: '7. Intellectual Property',
            textAr: 'جميع محتويات الموقع بما في ذلك النصوص والصور والشعارات محمية بحقوق الطبع والنشر. يحظر استخدام أو نسخ أي محتوى دون إذن كتابي.',
            textEn: 'All website content including text, images, and logos are protected by copyright. Use or reproduction of any content without written permission is prohibited.'
          },
          {
            subtitleAr: '8. التعديلات',
            subtitleEn: '8. Modifications',
            textAr: 'نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. يُنصح بمراجعة هذه الصفحة بانتظام.',
            textEn: 'We reserve the right to modify these terms and conditions at any time. It is recommended to review this page regularly.'
          }
        ],
        privacyTitleAr: 'سياسة الخصوصية',
        privacyTitleEn: 'Privacy Policy',
        privacyLastUpdatedAr: 'آخر تحديث: 2025',
        privacyLastUpdatedEn: 'Last Updated: 2025',
        privacySections: [
          {
            subtitleAr: '1. المعلومات التي نجمعها',
            subtitleEn: '1. Information We Collect',
            textAr: 'نجمع المعلومات التي تقدمها لنا مباشرة مثل الاسم، البريد الإلكتروني، رقم الهاتف، والعنوان عند إتمام عملية الشراء.',
            textEn: 'We collect information you provide directly to us such as name, email, phone number, and address when completing a purchase.'
          },
          {
            subtitleAr: '2. استخدام المعلومات',
            subtitleEn: '2. How We Use Information',
            textAr: 'نستخدم المعلومات التي نجمعها لمعالجة الطلبات، التواصل معك، تحسين خدماتنا، وإرسال التحديثات والعروض الخاصة (إذا وافقت على ذلك).',
            textEn: 'We use the information we collect to process orders, communicate with you, improve our services, and send updates and special offers (if you have agreed to this).'
          },
          {
            subtitleAr: '3. حماية المعلومات',
            subtitleEn: '3. Information Protection',
            textAr: 'نتخذ تدابير أمنية قوية لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التغيير أو الكشف. جميع المعاملات تتم عبر قنوات آمنة.',
            textEn: 'We implement strong security measures to protect your personal information from unauthorized access, alteration, or disclosure. All transactions are conducted through secure channels.'
          },
          {
            subtitleAr: '4. مشاركة المعلومات',
            subtitleEn: '4. Information Sharing',
            textAr: 'لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع شركاء الشحن وخدمات الدفع فقط لتنفيذ طلباتك.',
            textEn: 'We do not sell or rent your personal information to third parties. We may share information with shipping partners and payment services only to fulfill your orders.'
          },
          {
            subtitleAr: '5. ملفات تعريف الارتباط (Cookies)',
            subtitleEn: '5. Cookies',
            textAr: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا، تتبع سلوك الشراء، وتخصيص المحتوى. يمكنك إدارة ملفات تعريف الارتباط من إعدادات المتصفح.',
            textEn: 'We use cookies to enhance your experience on our website, track purchasing behavior, and personalize content. You can manage cookies through your browser settings.'
          },
          {
            subtitleAr: '6. حقوقك',
            subtitleEn: '6. Your Rights',
            textAr: 'لديك الحق في الوصول إلى معلوماتك الشخصية، تحديثها، أو حذفها في أي وقت. يمكنك أيضاً إلغاء الاشتراك في رسائل البريد الإلكتروني التسويقية.',
            textEn: 'You have the right to access, update, or delete your personal information at any time. You can also unsubscribe from marketing emails.'
          },
          {
            subtitleAr: '7. روابط خارجية',
            subtitleEn: '7. External Links',
            textAr: 'قد يحتوي موقعنا على روابط لمواقع خارجية. نحن لسنا مسؤولين عن ممارسات الخصوصية لتلك المواقع.',
            textEn: 'Our website may contain links to external sites. We are not responsible for the privacy practices of those websites.'
          },
          {
            subtitleAr: '8. التغييرات على السياسة',
            subtitleEn: '8. Policy Changes',
            textAr: 'قد نحدث سياسة الخصوصية هذه من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.',
            textEn: 'We may update this privacy policy from time to time. You will be notified of any significant changes via email or a notice on the website.'
          }
        ],
        contactTitleAr: 'هل لديك أسئلة؟',
        contactTitleEn: 'Have Questions?',
        contactDescriptionAr: 'إذا كان لديك أي استفسارات حول شروط الاستخدام أو سياسة الخصوصية، يرجى التواصل معنا',
        contactDescriptionEn: 'If you have any questions about our terms or privacy policy, please contact us',
        importantNoticeTitleAr: 'مهم',
        importantNoticeTitleEn: 'Important Notice',
        importantNoticeTextAr: 'باستخدام موقع رِداء وخدماته، فإنك تقر بأنك قد قرأت وفهمت ووافقت على هذه الشروط والأحكام وسياسة الخصوصية. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام موقعنا.',
        importantNoticeTextEn: 'By using the RIDAA website and its services, you acknowledge that you have read, understood, and agree to these terms and conditions and privacy policy. If you do not agree to these terms, please do not use our website.',
        backToRegistrationTextAr: 'العودة إلى صفحة التسجيل',
        backToRegistrationTextEn: 'Back to Registration'
      }
    };

    // Parse store settings if it's a string
    let parsedStoreSettings = defaultStoreSettings;
    if (storeSettings?.value) {
      if (typeof storeSettings.value === 'string') {
        try {
          parsedStoreSettings = { ...defaultStoreSettings, ...JSON.parse(storeSettings.value) };
        } catch (e) {
          console.warn('Failed to parse store settings:', e);
          parsedStoreSettings = defaultStoreSettings;
        }
      } else {
        parsedStoreSettings = { ...defaultStoreSettings, ...storeSettings.value };
      }
    }

    // Parse SEO settings if it's a string
    let parsedSeoSettings = defaultSeoSettings;
    if (seoSettings?.value) {
      if (typeof seoSettings.value === 'string') {
        try {
          parsedSeoSettings = { ...defaultSeoSettings, ...JSON.parse(seoSettings.value) };
        } catch (e) {
          console.warn('Failed to parse SEO settings:', e);
          parsedSeoSettings = defaultSeoSettings;
        }
      } else {
        parsedSeoSettings = { ...defaultSeoSettings, ...seoSettings.value };
      }
    }

    // Parse Pages Content settings if it's a string
    let parsedPagesContentSettings = defaultPagesContentSettings;
    if (pagesContentSettings?.value) {
      if (typeof pagesContentSettings.value === 'string') {
        try {
          parsedPagesContentSettings = { ...defaultPagesContentSettings, ...JSON.parse(pagesContentSettings.value) };
        } catch (e) {
          console.warn('Failed to parse Pages Content settings:', e);
          parsedPagesContentSettings = defaultPagesContentSettings;
        }
      } else {
        parsedPagesContentSettings = { ...defaultPagesContentSettings, ...pagesContentSettings.value };
      }
    }

    const settings = {
      profile: {
        username: admin?.username || 'admin',
        email: admin?.email || 'admin@example.com',
        phone: '',
        fullName: admin?.username || 'Store Administrator'
      },
      store: parsedStoreSettings,
      security: securitySettings?.value || defaultSecuritySettings,
      notifications: notificationSettings?.value || defaultNotificationSettings,
      seo: parsedSeoSettings,
      pagesContent: parsedPagesContentSettings
    };

    res.json({
      success: true,
      data: {
        settings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch settings'
    });
  }
};

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateAdminSettings = async (req, res) => {
  try {
    // Support both direct object and section-based updates
    let { profile, store, security, notifications, seo, pagesContent, section, data } = req.body;
    
    // If section-based update (from PATCH), extract the section data
    if (section && data) {
      if (section === 'profile') profile = data;
      else if (section === 'store') store = data;
      else if (section === 'security') security = data;
      else if (section === 'notifications') notifications = data;
      else if (section === 'seo') seo = data;
      else if (section === 'pagesContent') pagesContent = data;
    }

    // Update profile if provided
    if (profile) {
      const admin = await Admin.findById(req.admin.adminId);
      if (admin) {
        if (profile.email) admin.email = profile.email;
        if (profile.fullName) admin.username = profile.fullName;
        await admin.save();
      }
    }

    // Update store settings
    if (store) {
      await Settings.findOneAndUpdate(
        { key: 'store' },
        { key: 'store', value: store, type: 'object' },
        { upsert: true, new: true }
      );
    }

    // Update security settings
    if (security) {
      await Settings.findOneAndUpdate(
        { key: 'security' },
        { key: 'security', value: security, type: 'object' },
        { upsert: true, new: true }
      );
    }

    // Update notification settings
    if (notifications) {
      await Settings.findOneAndUpdate(
        { key: 'notifications' },
        { key: 'notifications', value: notifications, type: 'object' },
        { upsert: true, new: true }
      );
    }

    // Update SEO settings
    if (seo) {
      await Settings.findOneAndUpdate(
        { key: 'seo' },
        { key: 'seo', value: seo, type: 'object' },
        { upsert: true, new: true }
      );
    }

    // Update Pages Content settings
    if (pagesContent) {
      await Settings.findOneAndUpdate(
        { key: 'pagesContent' },
        { key: 'pagesContent', value: pagesContent, type: 'object' },
        { upsert: true, new: true }
      );
    }

    // Fetch updated settings
    const storeSettings = await Settings.findOne({ key: 'store' });
    const securitySettings = await Settings.findOne({ key: 'security' });
    const notificationSettings = await Settings.findOne({ key: 'notifications' });
    const seoSettings = await Settings.findOne({ key: 'seo' });
    const pagesContentSettings = await Settings.findOne({ key: 'pagesContent' });
    const admin = await Admin.findById(req.admin.adminId).select('username email');

    // Parse store settings if it's a string
    let parsedStoreSettings = {};
    if (storeSettings?.value) {
      if (typeof storeSettings.value === 'string') {
        try {
          parsedStoreSettings = JSON.parse(storeSettings.value);
        } catch (e) {
          console.warn('Failed to parse store settings:', e);
          parsedStoreSettings = {};
        }
      } else {
        parsedStoreSettings = storeSettings.value;
      }
    }

    // Parse SEO settings if it's a string
    let parsedSeoSettings = {};
    if (seoSettings?.value) {
      if (typeof seoSettings.value === 'string') {
        try {
          parsedSeoSettings = JSON.parse(seoSettings.value);
        } catch (e) {
          console.warn('Failed to parse SEO settings:', e);
          parsedSeoSettings = {};
        }
      } else {
        parsedSeoSettings = seoSettings.value;
      }
    }

    // Parse Pages Content settings if it's a string
    let parsedPagesContentSettings = {};
    if (pagesContentSettings?.value) {
      if (typeof pagesContentSettings.value === 'string') {
        try {
          parsedPagesContentSettings = JSON.parse(pagesContentSettings.value);
        } catch (e) {
          console.warn('Failed to parse Pages Content settings:', e);
          parsedPagesContentSettings = {};
        }
      } else {
        parsedPagesContentSettings = pagesContentSettings.value;
      }
    }

    const updatedSettings = {
      profile: {
        username: admin?.username || 'admin',
        email: admin?.email || 'admin@example.com',
        phone: profile?.phone || '',
        fullName: admin?.username || 'Store Administrator'
      },
      store: parsedStoreSettings,
      security: securitySettings?.value || {},
      notifications: notificationSettings?.value || {},
      seo: parsedSeoSettings,
      pagesContent: parsedPagesContentSettings
    };

    res.json({
      success: true,
      data: {
        settings: updatedSettings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update settings'
    });
  }
};

// @desc    Get store settings
// @route   GET /api/settings/store
// @access  Public
export const getStoreSettings = async (req, res) => {
  try {
    // Default settings to return if database query fails
    const defaultSettings = {
      name: 'RIDAA Fashion',
      nameAr: 'رِداء للأزياء',
      phone: '+20 100 000 0000',
      email: 'ridaa.store.team@gmail.com',
      address: '',
      showAdvertisements: true, // Control show/hide of hero advertisements
      socialMedia: {
        facebook: { enabled: false, url: '' },
        instagram: { enabled: false, url: '' },
        twitter: { enabled: false, url: '' },
        youtube: { enabled: false, url: '' }
      }
    };

    // Try to fetch from database, but don't fail if it doesn't work
    let storeSettings = defaultSettings;
    try {
      const settings = await Settings.findOne({ key: 'store' });
      
      if (settings?.value) {
        if (typeof settings.value === 'string') {
          try {
            const parsed = JSON.parse(settings.value);
            storeSettings = { ...defaultSettings, ...parsed };
          } catch (parseError) {
            console.warn('Failed to parse store settings, using defaults:', parseError);
            storeSettings = defaultSettings;
          }
        } else if (typeof settings.value === 'object' && settings.value !== null) {
          storeSettings = { ...defaultSettings, ...settings.value };
        }
      }
    } catch (dbError) {
      // If database query fails, return defaults
      console.warn('Database query failed, using default settings:', dbError.message);
      storeSettings = defaultSettings;
    }

    res.json({
      success: true,
      storeSettings: storeSettings
    });
  } catch (error) {
    console.error('Error in getStoreSettings:', error);
    // Even on error, return default settings so frontend doesn't break
    res.json({
      success: true,
      storeSettings: {
        name: 'RIDAA Fashion',
        nameAr: 'رِداء للأزياء',
        phone: '+20 100 000 0000',
        email: 'ridaa.store.team@gmail.com',
        address: '',
        showAdvertisements: true,
        socialMedia: {
          facebook: { enabled: false, url: '' },
          instagram: { enabled: false, url: '' },
          twitter: { enabled: false, url: '' },
          youtube: { enabled: false, url: '' }
        }
      }
    });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings/store
// @access  Private/Admin
export const updateStoreSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'store' },
      { key: 'store', value: req.body, type: 'object' },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      storeSettings: settings.value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update store settings'
    });
  }
};

// @desc    Get WhatsApp number
// @route   GET /api/settings/whatsapp
// @access  Public
export const getWhatsAppNumber = async (req, res) => {
  try {
    // Check database connection before querying
    if (!isDbConnected()) {
      // Return default WhatsApp number if DB is not connected
      return res.json({
        success: true,
        whatsappNumber: '+201000000000'
      });
    }

    // First try to get from store settings (new way)
    const storeSettings = await Settings.findOne({ key: 'store' });
    let whatsappNumber = '+201000000000';
    
    if (storeSettings?.value) {
      let parsedStoreSettings = {};
      if (typeof storeSettings.value === 'string') {
        try {
          parsedStoreSettings = JSON.parse(storeSettings.value);
        } catch (e) {
          // If parsing fails, try old way
        }
      } else {
        parsedStoreSettings = storeSettings.value;
      }
      
      if (parsedStoreSettings.whatsapp) {
        whatsappNumber = parsedStoreSettings.whatsapp;
      }
    }
    
    // Fallback to old way (separate whatsapp key)
    if (whatsappNumber === '+201000000000') {
      const settings = await Settings.findOne({ key: 'whatsapp' });
      if (settings?.value) {
        whatsappNumber = settings.value;
      }
    }
    
    res.json({
      success: true,
      whatsappNumber: whatsappNumber
    });
  } catch (error) {
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch WhatsApp number');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch WhatsApp number'
    });
  }
};

// @desc    Update WhatsApp number
// @route   PUT /api/settings/whatsapp
// @access  Private/Admin
export const updateWhatsAppNumber = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;

    // Update in store settings (new way - preferred)
    const storeSettings = await Settings.findOne({ key: 'store' });
    let parsedStoreSettings = {};
    
    if (storeSettings?.value) {
      if (typeof storeSettings.value === 'string') {
        try {
          parsedStoreSettings = JSON.parse(storeSettings.value);
        } catch (e) {
          parsedStoreSettings = {};
        }
      } else {
        parsedStoreSettings = storeSettings.value;
      }
    }
    
    // Update whatsapp in store settings
    parsedStoreSettings.whatsapp = whatsappNumber;
    
    await Settings.findOneAndUpdate(
      { key: 'store' },
      { key: 'store', value: parsedStoreSettings, type: 'object' },
      { upsert: true, new: true }
    );

    // Also update in old location for backward compatibility
    await Settings.findOneAndUpdate(
      { key: 'whatsapp' },
      { key: 'whatsapp', value: whatsappNumber, type: 'string' },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      whatsappNumber: whatsappNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update WhatsApp number'
    });
  }
};

// @desc    Send email
// @route   POST /api/settings/send-email
// @access  Private/Admin
export const sendEmailNotification = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Email address and subject are required'
      });
    }

    // Send email
    await sendEmail(to, subject, text, html);

    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
};

// @desc    Get SEO settings
// @route   GET /api/settings/seo
// @access  Public
export const getSeoSettings = async (req, res) => {
  try {
    const defaultSeoSettings = {
      metaDescriptionAr: 'تسوّق أونلاين أحدث الجلابيات المغربية والثياب العصرية الرجالية من رِداء. خامات فاخرة، تفصيل دقيق، وخيارات مقاسات وألوان تناسب كل المناسبات مع شحن سريع داخل مصر.',
      metaDescriptionEn: 'Shop premium Moroccan djellabas and modern modest wear for men at Ridaa. High‑quality fabrics, elegant tailoring and fast delivery across Egypt.',
      keywords: 'رِداء, رداء, جلابية مغربية, جلابيات رجالي, ملابس إسلامية, ثياب رجالية, djellaba, moroccan djellaba, islamic clothing, thobes, modest wear'
    };

    let seoSettings = defaultSeoSettings;
    try {
      const settings = await Settings.findOne({ key: 'seo' });
      
      if (settings?.value) {
        if (typeof settings.value === 'string') {
          try {
            const parsed = JSON.parse(settings.value);
            seoSettings = { ...defaultSeoSettings, ...parsed };
          } catch (parseError) {
            console.warn('Failed to parse SEO settings, using defaults:', parseError);
            seoSettings = defaultSeoSettings;
          }
        } else if (typeof settings.value === 'object' && settings.value !== null) {
          seoSettings = { ...defaultSeoSettings, ...settings.value };
        }
      }
    } catch (dbError) {
      console.warn('Database query failed, using default SEO settings:', dbError.message);
      seoSettings = defaultSeoSettings;
    }

    res.json({
      success: true,
      seoSettings: seoSettings
    });
  } catch (error) {
    console.error('Error in getSeoSettings:', error);
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch SEO settings');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch SEO settings'
    });
  }
};

// @desc    Get Pages Content
// @route   GET /api/settings/pages-content
// @access  Public
export const getPagesContent = async (req, res) => {
  try {
    const defaultPagesContentSettings = {
      contact: {
        heroTitleAr: 'اتصل بنا',
        heroTitleEn: 'Contact Us',
        heroDescriptionAr: 'نحن هنا لمساعدتك في أي وقت. تواصل معنا وسنكون سعداء لخدمتك',
        heroDescriptionEn: 'We are here to help you anytime. Contact us and we will be happy to serve you',
        addressAr: 'مصر',
        addressEn: 'Egypt',
        addressDescriptionAr: 'نحن موجودون في مصر',
        addressDescriptionEn: 'We are located in Egypt',
        workingHoursAr: '9:00 ص - 10:00 م',
        workingHoursEn: '9:00 AM - 10:00 PM',
        workingHoursDescriptionAr: 'من السبت إلى الخميس',
        workingHoursDescriptionEn: 'Saturday to Thursday',
        emailDescriptionAr: 'أرسل لنا رسالة',
        emailDescriptionEn: 'Send us a message',
        whatsappDescriptionAr: 'تواصل معنا مباشرة',
        whatsappDescriptionEn: 'Contact us directly',
        whatsappButtonTextAr: 'ابدأ المحادثة',
        whatsappButtonTextEn: 'Start Chat',
        whatsappMessageAr: 'مرحباً، أريد الاستفسار عن المنتجات',
        whatsappMessageEn: 'Hello, I want to inquire about products'
      },
      about: {
        heroTitleAr: 'من نحن',
        heroTitleEn: 'About Us',
        heroSubtitleAr: 'اكتشف قصة رِداء ورؤيتنا للأزياء العربية الأصيلة',
        heroSubtitleEn: 'Discover RIDAA\'s story and our vision for authentic Arabic fashion',
        heroDescriptionAr: '',
        heroDescriptionEn: '',
        storyTitleAr: 'قصتنا',
        storyTitleEn: 'Our Story',
        storyContentAr: 'رِداء هو وجهتك للأناقة الأصيلة والذوق الرفيع. نقدّم تصاميم تجمع بين الأصالة والحداثة ممزوجة بحب التفاصيل، مستوحاة من الهوية العربية وروح الفخامة الهادئة والتقاليد العريقة.\n\nفي رِداء، نؤمن أن اللباس تعبير عن الهوية والثقة، وأن كل قطعة تحمل رسالة، وأصالة، وبصمة فريدة لصاحبها.\n\nنحن ملتزمون بتقديم أعلى مستويات الجودة، مع خدمة شخصيّة وتجربة تليق بك كجزء من عائلة رداء.',
        storyContentEn: 'RIDAA is your destination for authentic elegance and refined taste. We offer designs that blend authenticity and modernism with a passion for details, inspired by rich Arabic identity and the spirit of timeless luxury.\n\nAt RIDAA, we believe clothing is an expression of identity and confidence, with every piece carrying a message, heritage, and a unique fingerprint for its owner.\n\nWe are committed to delivering top-notch quality, personal service, and an experience worthy of you as part of the RIDAA family.',
        storyImageTextAr: 'الهوية والثقة',
        storyImageTextEn: 'Identity & Confidence',
        storyImageSubtextAr: 'نصنع كل تصميم ليعكس شخصيتك ويلهم من حولك',
        storyImageSubtextEn: 'We craft each design to reflect your character and inspire those around you.',
        featuresTitleAr: 'لماذا تختار رِداء؟',
        featuresTitleEn: 'Why Choose RIDAA?',
        featuresDescriptionAr: 'نحن نقدم تجربة تسوق فريدة مع أعلى مستويات الجودة والخدمة والابتكار.',
        featuresDescriptionEn: 'We offer a unique shopping experience with the highest levels of quality, service, and innovation.',
        features: [
          {
            titleAr: 'عملاء سعداء',
            titleEn: 'Happy Customers',
            descriptionAr: 'أكثر من 10,000 عميل راضي',
            descriptionEn: 'Over 10,000 satisfied customers'
          },
          {
            titleAr: 'جودة عالية',
            titleEn: 'High Quality',
            descriptionAr: 'منتجات عالية الجودة فقط',
            descriptionEn: 'Only high quality products'
          },
          {
            titleAr: 'شغف بالتفاصيل',
            titleEn: 'Passion for Details',
            descriptionAr: 'نحن نهتم بكل التفاصيل',
            descriptionEn: 'We care about every detail'
          },
          {
            titleAr: 'توصيل لكل المحافظات',
            titleEn: 'Nationwide Delivery',
            descriptionAr: 'توصيل سريع وآمن لجميع محافظات مصر',
            descriptionEn: 'Fast, reliable delivery to all governorates in Egypt'
          }
        ],
        missionTitleAr: 'مهمتنا',
        missionTitleEn: 'Our Mission',
        missionContentAr: 'نهدف إلى إحياء أناقة وتقاليد التراث العربي العصري وتقديمها للعالم في قالب من الجودة والرقي.',
        missionContentEn: 'We aim to revive the elegance and traditions of modern Arab heritage, and present them to the world with quality and sophistication.',
        visionTitleAr: 'رؤيتنا',
        visionTitleEn: 'Our Vision',
        visionContentAr: 'أن نكون الوجهة الأولى للأزياء الراقية العربية والأصيلة عالمياً، وأن نوّصل فخامة ثقافتنا لكل عميل باحث عن التفرد.',
        visionContentEn: 'To be the foremost destination for elegant and authentic Arabic fashion globally, bringing the luxury of our culture to every client seeking uniqueness.',
        ctaTitleAr: 'انضم إلى رحلة الأناقة',
        ctaTitleEn: 'Join the Elegance Journey',
        ctaDescriptionAr: 'اكتشف مجموعتنا المميزة من الأزياء العربية الأصيلة واختر ما يناسبك واقتنِ الجودة التي تستحقها.',
        ctaDescriptionEn: 'Discover our exclusive collection of authentic Arabic fashion and choose what suits you and experience the quality you deserve.',
        ctaButton1TextAr: 'تصفح المنتجات',
        ctaButton1TextEn: 'Browse Products',
        ctaButton2TextAr: 'تواصل معنا',
        ctaButton2TextEn: 'Contact Us'
      }
    };

    let pagesContent = defaultPagesContentSettings;
    try {
      const settings = await Settings.findOne({ key: 'pagesContent' });
      
      if (settings?.value) {
        if (typeof settings.value === 'string') {
          try {
            const parsed = JSON.parse(settings.value);
            pagesContent = { ...defaultPagesContentSettings, ...parsed };
          } catch (parseError) {
            console.warn('Failed to parse Pages Content settings, using defaults:', parseError);
            pagesContent = defaultPagesContentSettings;
          }
        } else if (typeof settings.value === 'object' && settings.value !== null) {
          pagesContent = { ...defaultPagesContentSettings, ...settings.value };
        }
      }
    } catch (dbError) {
      console.warn('Database query failed, using default Pages Content settings:', dbError.message);
      pagesContent = defaultPagesContentSettings;
    }

    res.json({
      success: true,
      pagesContent: pagesContent
    });
  } catch (error) {
    console.error('Error in getPagesContent:', error);
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch pages content');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pages content'
    });
  }
};

