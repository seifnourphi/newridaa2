// Invoice HTML Template (same as old project)
export function generateInvoiceHTML(order, lang = 'ar', user = null, storeSettings = null, baseUrl = 'http://localhost:5000', logoDataUrl = null) {
  const isArabic = lang === 'ar';

  // Use base64 logo if available, otherwise don't provide a URL to avoid hangs
  let logoUrl = logoDataUrl || '';

  const orderDate = new Date(order.createdAt).toLocaleString(
    isArabic ? 'ar-EG' : 'en-US',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    }
  ).replace(/\//g, '.');

  // Calculate totals from all order items
  const orderItems = order.items || [];
  const subtotal = orderItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  // Get shipping price
  let shipping = order.shippingPrice || 0;
  const total = subtotal + shipping - (order.discount || 0);

  // Normalize payment method values (support both old and new formats)
  const rawPaymentMethod = (order.paymentMethod || '').toLowerCase();
  const shippingPaymentMethod = (order.shippingPaymentMethod || '').toLowerCase();

  const isCod =
    rawPaymentMethod === 'cod' ||
    rawPaymentMethod === 'cash_on_delivery' ||
    rawPaymentMethod === 'cash-on-delivery';

  let paymentMethodText;

  if (isArabic) {
    if (isCod) {
      // الدفع عند الاستلام مع توضيح طريقة دفع الشحن إن وُجدت
      if (shippingPaymentMethod === 'instapay') {
        paymentMethodText = 'الدفع عند الاستلام (إنستا باي)';
      } else if (shippingPaymentMethod === 'vodafone') {
        paymentMethodText = 'الدفع عند الاستلام (فودافون كاش)';
      } else {
        paymentMethodText = 'الدفع عند الاستلام';
      }
    } else if (rawPaymentMethod === 'instapay') {
      paymentMethodText = 'إنستا باي';
    } else if (rawPaymentMethod === 'vodafone') {
      paymentMethodText = 'فودافون كاش';
    } else if (rawPaymentMethod === 'bank_transfer') {
      // For old orders with bank_transfer, default to Cash on Delivery
      paymentMethodText = 'الدفع عند الاستلام';
    } else {
      // Default to Cash on Delivery for unknown methods
      paymentMethodText = 'الدفع عند الاستلام';
    }
  } else {
    if (isCod) {
      if (shippingPaymentMethod === 'instapay') {
        paymentMethodText = 'Cash on Delivery (InstaPay)';
      } else if (shippingPaymentMethod === 'vodafone') {
        paymentMethodText = 'Cash on Delivery (Vodafone Cash)';
      } else {
        paymentMethodText = 'Cash on Delivery';
      }
    } else if (rawPaymentMethod === 'instapay') {
      paymentMethodText = 'InstaPay';
    } else if (rawPaymentMethod === 'vodafone') {
      paymentMethodText = 'Vodafone Cash';
    } else if (rawPaymentMethod === 'bank_transfer') {
      // For old orders with bank_transfer, default to Cash on Delivery
      paymentMethodText = 'Cash on Delivery';
    } else {
      // Default to Cash on Delivery for unknown methods
      paymentMethodText = 'Cash on Delivery';
    }
  }

  // Translations
  const translations = isArabic ? {
    title: 'فاتورة',
    issuedTo: 'صادرة إلى:',
    invoiceNo: 'رقم الفاتورة:',
    description: 'الوصف',
    unitPrice: 'سعر الوحدة',
    qty: 'الكمية',
    total: 'الإجمالي',
    subtotal: 'المجموع',
    tax: 'الضريبة',
    amountDue: 'المبلغ المستحق',
    shipping: 'الشحن',
    customerDetails: 'تفاصيل العميل',
    name: 'الاسم',
    phone: 'الرقم',
    email: 'الإيميل',
    address: 'العنوان',
    city: 'المدينة',
    paymentMethod: 'طريقة الدفع',
    thanks: 'شكراً لك',
    thanksEn: 'Thank You',
  } : {
    title: 'Receipt',
    issuedTo: 'ISSUED TO:',
    invoiceNo: 'INVOICE NO:',
    description: 'DESCRIPTION',
    unitPrice: 'UNIT PRICE',
    qty: 'QTY',
    total: 'TOTAL',
    subtotal: 'TOTAL',
    tax: 'Tax',
    amountDue: 'Amount due',
    shipping: 'Shipping',
    customerDetails: 'CUSTOMER DETAILS',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    city: 'City',
    paymentMethod: 'Payment Method',
    thanks: 'Thank You',
    thanksEn: 'Thank You',
  };

  const htmlDir = isArabic ? 'rtl' : 'ltr';
  const htmlLang = isArabic ? 'ar' : 'en';

  const customerName = order.customerName || order.shippingAddress?.name || '';
  const customerPhone = order.customerPhone || order.shippingAddress?.phone || '';
  const customerAddress = order.customerAddress || order.shippingAddress?.address || '';
  const customerCity = order.shippingAddress?.city || '';
  const customerEmail = order.customerEmail || order.user?.email || user?.email || '';

  return `
<!DOCTYPE html>
<html dir="${htmlDir}" lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${translations.title} ${order.orderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Allura&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: white;
      padding: 60px 40px;
      color: #000;
      font-size: 11px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    /* Logo Section */
    .logo-section {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
    }
    .logo-title {
      font-family: 'Times New Roman', serif;
      font-size: 26px;
      letter-spacing: 4px;
      color: #d4af37;
      font-weight: bold;
      text-transform: uppercase;
    }
    .logo-line {
      margin: 10px auto;
      width: 80%;
      height: 1px;
      background: linear-gradient(to right, transparent, #d4af37, transparent);
    }
    .logo-tagline {
      font-size: 9px;
      letter-spacing: 3px;
      color: #999;
      text-transform: uppercase;
    }
    
    /* Header Section */
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #000;
    }
    .issued-to, .invoice-no {
      flex: 1;
    }
    .issued-to {
      ${isArabic ? 'padding-right: 30px;' : 'padding-left: 0;'}
    }
    .issued-to .section-content {
      max-width: 260px;
    }
    .customer-info-item {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
      line-height: 1.8;
    }
    .customer-info-label {
      font-weight: 600;
      min-width: ${isArabic ? '60px' : '70px'};
      flex-shrink: 0;
    }
    .customer-info-value {
      flex: 1;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .invoice-no {
      text-align: ${isArabic ? 'left' : 'right'};
    }
    .section-label {
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      text-transform: uppercase;
      color: #000;
    }
    .section-content {
      font-size: 11px;
      color: #333;
      line-height: 1.8;
    }
    
    /* Table Section */
    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 20px;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      ${isArabic ? 'direction: rtl;' : ''}
    }
    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
      font-size: 11px;
      ${isArabic ? 'direction: rtl;' : ''}
    }
    .table-row:last-of-type {
      border-bottom: 1px solid #000;
    }
    .total-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid #000;
      font-weight: 700;
      ${isArabic ? 'direction: rtl;' : ''}
    }
    .total-label {
      grid-column: 1;
    }
    .total-value {
      grid-column: 4;
      text-align: ${isArabic ? 'left' : 'right'};
    }
    
    /* Summary Section */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 30px;
      margin-bottom: 40px;
    }
    .summary-content {
      text-align: ${isArabic ? 'left' : 'right'};
      min-width: 200px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11px;
    }
    .summary-row.final {
      font-weight: 700;
      font-size: 13px;
      margin-top: 10px;
      padding-top: 10px;
    }
    
    /* Footer Section */
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #eee;
    }
    .customer-details {
      flex: 1;
    }
    .customer-label {
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
      color: #000;
    }
    .customer-content {
      font-size: 11px;
      line-height: 1.8;
      color: #333;
    }
    .footer-right {
      display: flex;
      flex-direction: column;
      align-items: ${isArabic ? 'flex-start' : 'flex-end'};
      gap: 15px;
    }
    .footer-logo {
      width: 120px;
      height: auto;
      max-width: 100%;
      object-fit: contain;
    }
    .thank-you {
      font-family: 'Great Vibes', 'Dancing Script', 'Allura', 'Brush Script MT', cursive;
      font-size: 48px;
      color: #2c2c2c;
      font-weight: 400;
      text-align: ${isArabic ? 'left' : 'right'};
      margin: 0;
      padding: 0;
      line-height: 1.1;
      letter-spacing: 2px;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      font-style: normal;
      transform: rotate(-1deg);
      display: inline-block;
    }
    .thank-you-dual {
      display: flex;
      flex-direction: column;
      align-items: ${isArabic ? 'flex-start' : 'flex-end'};
      gap: 5px;
    }
    .thank-you-dual span {
      display: block;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo-title">RiDAA</div>
      <div class="logo-line"></div>
      <div class="logo-tagline">WEAR YOUR IDENTITY</div>
    </div>
    
    <!-- Header Section -->
    <div class="header-section">
      <div class="issued-to">
        <div class="section-label">${translations.issuedTo}</div>
        <div class="section-content">
          <div class="customer-info-item">
            <span class="customer-info-label">${translations.name}:</span>
            <span class="customer-info-value">${customerName}</span>
          </div>
          <div class="customer-info-item">
            <span class="customer-info-label">${translations.phone}:</span>
            <span class="customer-info-value">${customerPhone}</span>
          </div>
          <div class="customer-info-item">
            <span class="customer-info-label">${translations.address}:</span>
            <span class="customer-info-value">${customerAddress}</span>
          </div>
          ${customerCity ? `
          <div class="customer-info-item">
            <span class="customer-info-label">${translations.city}:</span>
            <span class="customer-info-value">${customerCity}</span>
          </div>
          ` : ''}
        </div>
      </div>
      <div class="invoice-no">
        <div class="section-label">${translations.invoiceNo}</div>
        <div class="section-content">
          #${order.orderNumber}<br>
          ${orderDate}
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <div class="table-header">
      <div>${translations.description}</div>
      <div style="text-align: ${isArabic ? 'left' : 'right'}">${translations.unitPrice}</div>
      <div style="text-align: center">${translations.qty}</div>
      <div style="text-align: ${isArabic ? 'left' : 'right'}">${translations.total}</div>
    </div>

    ${orderItems.map((item) => {
    const productName = isArabic ? (item.product?.nameAr || item.product?.name || item.name) : (item.product?.name || item.product?.nameAr || item.name);
    const itemUnitPrice = item.price || 0;
    const itemQuantity = item.quantity || 1;
    const itemTotal = itemUnitPrice * itemQuantity;
    return `
    <div class="table-row">
      <div>${productName || 'Product'}${item.size ? ` - ${isArabic ? 'الحجم' : 'Size'}: ${item.size}` : ''}${item.color ? ` - ${isArabic ? 'اللون' : 'Color'}: ${item.color}` : ''}</div>
      <div style="text-align: ${isArabic ? 'left' : 'right'}">${itemUnitPrice.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</div>
      <div style="text-align: center">${itemQuantity}</div>
      <div style="text-align: ${isArabic ? 'left' : 'right'}">${itemTotal.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</div>
    </div>
      `;
  }).join('')}

    <div class="total-row">
      <div class="total-label">${translations.subtotal}</div>
      <div></div>
      <div></div>
      <div class="total-value">${subtotal.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</div>
    </div>

    <!-- Summary Section -->
    <div class="summary-section">
      <div class="summary-content">
        <div class="summary-row">
          <span>${translations.subtotal}</span>
          <span>${subtotal.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
        </div>
        ${shipping > 0 ? `
        <div class="summary-row">
          <span>${translations.shipping}</span>
          <span>${shipping.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
        </div>
        ` : ''}
        ${(order.discount || 0) > 0 ? `
        <div class="summary-row">
          <span>${isArabic ? 'الخصم' : 'Discount'}</span>
          <span>-${(order.discount || 0).toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
        </div>
        ` : ''}
        <div class="summary-row final">
          <span>${translations.amountDue}</span>
          <span>${total.toFixed(2)} ${isArabic ? 'ج.م' : 'EGP'}</span>
        </div>
      </div>
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      <div class="customer-details">
        <div class="customer-label">${translations.customerDetails}</div>
        <div class="customer-content">
          ${translations.name}: ${customerName}<br>
          ${translations.phone}: ${customerPhone}<br>
          ${translations.paymentMethod}: ${paymentMethodText}
          ${(order.paymentMethod === 'instapay' || order.paymentMethod === 'vodafone') && storeSettings ? `
          <br><br>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <strong>${isArabic ? 'تفاصيل حساب الشحن:' : 'Shipping Account Details:'}</strong><br>
            ${isArabic ? 'الدفع إلى:' : 'Pay to:'} ${order.paymentMethod === 'instapay' ? (storeSettings.instaPayNumber || 'غير محدد') : (storeSettings.vodafoneNumber || 'غير محدد')}
            ${order.paymentMethod === 'instapay' && storeSettings.instaPayAccountName ? `<br>${isArabic ? 'اسم الحساب:' : 'Account Name:'} ${storeSettings.instaPayAccountName}` : ''}
          </div>
          ` : ''}
        </div>
      </div>
      <div class="footer-right">
        <img src="${logoUrl}" alt="Logo" class="footer-logo" onerror="this.style.display='none';" />
        <div class="thank-you">
          ${translations.thanksEn}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

