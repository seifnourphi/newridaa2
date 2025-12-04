import Settings from '../models/Settings.model.js';
import Admin from '../models/Admin.model.js';
import { sendEmail } from './email.util.js';

/**
 * Get notification settings from database
 */
export const getNotificationSettings = async () => {
  try {
    const notificationSettings = await Settings.findOne({ key: 'notifications' });
    const defaultSettings = {
      emailNotifications: true,
      orderNotifications: true,
      lowStockAlerts: true,
      dailyReports: false
    };
    
    if (notificationSettings?.value) {
      if (typeof notificationSettings.value === 'string') {
        try {
          return { ...defaultSettings, ...JSON.parse(notificationSettings.value) };
        } catch (e) {
          return defaultSettings;
        }
      } else {
        return { ...defaultSettings, ...notificationSettings.value };
      }
    }
    
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return {
      emailNotifications: true,
      orderNotifications: true,
      lowStockAlerts: true,
      dailyReports: false
    };
  }
};

/**
 * Get admin email from database
 */
export const getAdminEmail = async () => {
  try {
    const admin = await Admin.findOne().select('email').lean();
    return admin?.email || 'ridaa.store.team@gmail.com';
  } catch (error) {
    console.error('Error fetching admin email:', error);
    return 'ridaa.store.team@gmail.com';
  }
};

/**
 * Send order notification email to admin
 */
export const sendOrderNotification = async (order, language = 'ar') => {
  try {
    // Check if order notifications are enabled
    const notificationSettings = await getNotificationSettings();
    
    if (!notificationSettings.orderNotifications || !notificationSettings.emailNotifications) {
      console.log('📧 Order notifications are disabled, skipping email');
      return { success: false, reason: 'notifications_disabled' };
    }

    // Get admin email
    const adminEmail = await getAdminEmail();
    
    if (!adminEmail) {
      console.error('❌ No admin email found');
      return { success: false, reason: 'no_admin_email' };
    }

    // Format order items for email
    const itemsList = order.items.map((item, index) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'N/A'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity || 0}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${(item.price || 0).toFixed(2)} ${order.currency || 'EGP'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${itemTotal.toFixed(2)} ${order.currency || 'EGP'}</td>
        </tr>
      `;
    }).join('');

    const subject = language === 'ar'
      ? `طلب جديد - ${order.orderNumber} - رِداء`
      : `New Order - ${order.orderNumber} - Ridaa`;

    const htmlContent = language === 'ar'
      ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #DAA520; margin-bottom: 20px; text-align: center;">طلب جديد تم استلامه</h2>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>التاريخ:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}</p>
              <p style="margin: 5px 0;"><strong>الحالة:</strong> ${order.orderStatus === 'pending' ? 'قيد الانتظار' : order.orderStatus}</p>
            </div>

            <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px;">معلومات العميل:</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>الاسم:</strong> ${order.shippingAddress?.name || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong>الهاتف:</strong> ${order.shippingAddress?.phone || 'غير محدد'}</p>
              <p style="margin: 5px 0;"><strong>العنوان:</strong> ${order.shippingAddress?.address || 'غير محدد'}</p>
              ${order.shippingAddress?.city ? `<p style="margin: 5px 0;"><strong>المدينة:</strong> ${order.shippingAddress.city}</p>` : ''}
            </div>

            <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px;">عناصر الطلب:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #DAA520; color: white;">
                  <th style="padding: 10px; text-align: right;">#</th>
                  <th style="padding: 10px; text-align: right;">المنتج</th>
                  <th style="padding: 10px; text-align: right;">الكمية</th>
                  <th style="padding: 10px; text-align: right;">السعر</th>
                  <th style="padding: 10px; text-align: right;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>

            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 5px 0; text-align: left;"><strong>المجموع الفرعي:</strong> ${(order.subtotal || 0).toFixed(2)} ${order.currency || 'EGP'}</p>
              ${order.discount > 0 ? `<p style="margin: 5px 0; text-align: left;"><strong>الخصم:</strong> -${(order.discount || 0).toFixed(2)} ${order.currency || 'EGP'}</p>` : ''}
              <p style="margin: 5px 0; text-align: left;"><strong>الشحن:</strong> ${(order.shippingPrice || 0).toFixed(2)} ${order.currency || 'EGP'}</p>
              <p style="margin: 10px 0; padding-top: 10px; border-top: 2px solid #DAA520; font-size: 18px; font-weight: bold; text-align: left;">
                <strong>الإجمالي:</strong> ${(order.total || 0).toFixed(2)} ${order.currency || 'EGP'}
              </p>
            </div>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                رِداء للأزياء الإسلامية<br>
                Ridaa Store Team
              </p>
            </div>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #DAA520; margin-bottom: 20px; text-align: center;">New Order Received</h2>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${order.orderStatus || 'pending'}</p>
            </div>

            <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px;">Customer Information:</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${order.shippingAddress?.name || 'Not specified'}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingAddress?.phone || 'Not specified'}</p>
              <p style="margin: 5px 0;"><strong>Address:</strong> ${order.shippingAddress?.address || 'Not specified'}</p>
              ${order.shippingAddress?.city ? `<p style="margin: 5px 0;"><strong>City:</strong> ${order.shippingAddress.city}</p>` : ''}
            </div>

            <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px;">Order Items:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #DAA520; color: white;">
                  <th style="padding: 10px; text-align: left;">#</th>
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: left;">Quantity</th>
                  <th style="padding: 10px; text-align: left;">Price</th>
                  <th style="padding: 10px; text-align: left;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>

            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 5px 0; text-align: right;"><strong>Subtotal:</strong> ${(order.subtotal || 0).toFixed(2)} ${order.currency || 'EGP'}</p>
              ${order.discount > 0 ? `<p style="margin: 5px 0; text-align: right;"><strong>Discount:</strong> -${(order.discount || 0).toFixed(2)} ${order.currency || 'EGP'}</p>` : ''}
              <p style="margin: 5px 0; text-align: right;"><strong>Shipping:</strong> ${(order.shippingPrice || 0).toFixed(2)} ${order.currency || 'EGP'}</p>
              <p style="margin: 10px 0; padding-top: 10px; border-top: 2px solid #DAA520; font-size: 18px; font-weight: bold; text-align: right;">
                <strong>Total:</strong> ${(order.total || 0).toFixed(2)} ${order.currency || 'EGP'}
              </p>
            </div>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Ridaa Islamic Fashion Store<br>
                Ridaa Store Team
              </p>
            </div>
          </div>
        </div>
      `;

    const textContent = language === 'ar'
      ? `طلب جديد تم استلامه\n\nرقم الطلب: ${order.orderNumber}\nالتاريخ: ${new Date(order.createdAt || Date.now()).toLocaleString('ar-EG')}\n\nمعلومات العميل:\nالاسم: ${order.shippingAddress?.name || 'غير محدد'}\nالهاتف: ${order.shippingAddress?.phone || 'غير محدد'}\nالعنوان: ${order.shippingAddress?.address || 'غير محدد'}\n\nالإجمالي: ${(order.total || 0).toFixed(2)} ${order.currency || 'EGP'}`
      : `New Order Received\n\nOrder Number: ${order.orderNumber}\nDate: ${new Date(order.createdAt || Date.now()).toLocaleString('en-US')}\n\nCustomer Information:\nName: ${order.shippingAddress?.name || 'Not specified'}\nPhone: ${order.shippingAddress?.phone || 'Not specified'}\nAddress: ${order.shippingAddress?.address || 'Not specified'}\n\nTotal: ${(order.total || 0).toFixed(2)} ${order.currency || 'EGP'}`;

    // Send email
    await sendEmail(adminEmail, subject, textContent, htmlContent);

    console.log(`✅ Order notification email sent to ${adminEmail} for order ${order.orderNumber}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending order notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send low stock alert email to admin
 */
export const sendLowStockAlert = async (product, language = 'ar') => {
  try {
    // Check if low stock alerts are enabled
    const notificationSettings = await getNotificationSettings();
    
    if (!notificationSettings.lowStockAlerts || !notificationSettings.emailNotifications) {
      console.log('📧 Low stock alerts are disabled, skipping email');
      return { success: false, reason: 'notifications_disabled' };
    }

    // Get admin email
    const adminEmail = await getAdminEmail();
    
    if (!adminEmail) {
      console.error('❌ No admin email found');
      return { success: false, reason: 'no_admin_email' };
    }

    const subject = language === 'ar'
      ? `تنبيه: نفاد المخزون - ${product.name || product.nameAr || 'منتج'} - رِداء`
      : `Alert: Low Stock - ${product.name || 'Product'} - Ridaa`;

    const htmlContent = language === 'ar'
      ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ تنبيه نفاد المخزون</h2>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; border-right: 4px solid #dc2626; margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #991b1b;"><strong>المنتج:</strong> ${product.name || product.nameAr || 'غير محدد'}</p>
              <p style="margin: 5px 0; color: #991b1b;"><strong>المخزون المتبقي:</strong> ${product.stockQuantity || 0} وحدة</p>
              ${product.sku ? `<p style="margin: 5px 0; color: #991b1b;"><strong>رمز المنتج (SKU):</strong> ${product.sku}</p>` : ''}
            </div>

            <p style="color: #374151; line-height: 1.6;">
              يرجى مراجعة المخزون وإضافة المزيد من الوحدات إذا لزم الأمر.
            </p>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                رِداء للأزياء الإسلامية<br>
                Ridaa Store Team
              </p>
            </div>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ Low Stock Alert</h2>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #991b1b;"><strong>Product:</strong> ${product.name || 'Not specified'}</p>
              <p style="margin: 5px 0; color: #991b1b;"><strong>Remaining Stock:</strong> ${product.stockQuantity || 0} units</p>
              ${product.sku ? `<p style="margin: 5px 0; color: #991b1b;"><strong>SKU:</strong> ${product.sku}</p>` : ''}
            </div>

            <p style="color: #374151; line-height: 1.6;">
              Please review the stock and add more units if necessary.
            </p>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Ridaa Islamic Fashion Store<br>
                Ridaa Store Team
              </p>
            </div>
          </div>
        </div>
      `;

    const textContent = language === 'ar'
      ? `تنبيه نفاد المخزون\n\nالمنتج: ${product.name || product.nameAr || 'غير محدد'}\nالمخزون المتبقي: ${product.stockQuantity || 0} وحدة\n\nيرجى مراجعة المخزون وإضافة المزيد من الوحدات إذا لزم الأمر.`
      : `Low Stock Alert\n\nProduct: ${product.name || 'Not specified'}\nRemaining Stock: ${product.stockQuantity || 0} units\n\nPlease review the stock and add more units if necessary.`;

    // Send email
    await sendEmail(adminEmail, subject, textContent, htmlContent);

    console.log(`✅ Low stock alert sent to ${adminEmail} for product ${product.name || product.nameAr}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status update notification email to admin
 */
export const sendOrderStatusUpdateNotification = async (order, oldStatus, newStatus, language = 'ar') => {
  try {
    // Check if order notifications are enabled
    const notificationSettings = await getNotificationSettings();
    
    if (!notificationSettings.orderNotifications || !notificationSettings.emailNotifications) {
      console.log('📧 Order notifications are disabled, skipping status update email');
      return { success: false, reason: 'notifications_disabled' };
    }

    // Get admin email
    const adminEmail = await getAdminEmail();
    
    if (!adminEmail) {
      console.error('❌ No admin email found');
      return { success: false, reason: 'no_admin_email' };
    }

    const statusNames = {
      ar: {
        pending: 'قيد الانتظار',
        confirmed: 'مؤكد',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        out_for_delivery: 'خرج للتوصيل',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي'
      },
      en: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        processing: 'Processing',
        shipped: 'Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      }
    };

    const oldStatusName = statusNames[language][oldStatus] || oldStatus;
    const newStatusName = statusNames[language][newStatus] || newStatus;

    const subject = language === 'ar'
      ? `تحديث حالة الطلب - ${order.orderNumber} - رِداء`
      : `Order Status Update - ${order.orderNumber} - Ridaa`;

    const htmlContent = language === 'ar'
      ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #DAA520; margin-bottom: 20px;">تحديث حالة الطلب</h2>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>الحالة السابقة:</strong> ${oldStatusName}</p>
              <p style="margin: 5px 0;"><strong>الحالة الجديدة:</strong> <span style="color: #059669; font-weight: bold;">${newStatusName}</span></p>
              ${order.trackingNumber ? `<p style="margin: 5px 0;"><strong>رقم التتبع:</strong> ${order.trackingNumber}</p>` : ''}
            </div>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                رِداء للأزياء الإسلامية<br>
                Ridaa Store Team
              </p>
            </div>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #DAA520; margin-bottom: 20px;">Order Status Update</h2>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${oldStatusName}</p>
              <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatusName}</span></p>
              ${order.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
            </div>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Ridaa Islamic Fashion Store<br>
                Ridaa Store Team
              </p>
            </div>
          </div>
        </div>
      `;

    const textContent = language === 'ar'
      ? `تحديث حالة الطلب\n\nرقم الطلب: ${order.orderNumber}\nالحالة السابقة: ${oldStatusName}\nالحالة الجديدة: ${newStatusName}`
      : `Order Status Update\n\nOrder Number: ${order.orderNumber}\nPrevious Status: ${oldStatusName}\nNew Status: ${newStatusName}`;

    // Send email
    await sendEmail(adminEmail, subject, textContent, htmlContent);

    console.log(`✅ Order status update notification sent to ${adminEmail} for order ${order.orderNumber}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending order status update notification:', error);
    return { success: false, error: error.message };
  }
};

