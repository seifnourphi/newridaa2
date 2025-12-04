import User from '../models/User.model.js';
import { sendEmail } from '../utils/email.util.js';

// @desc    Get newsletter subscribers count
// @route   GET /api/admin/newsletter/subscribers/count
// @access  Private/Admin
export const getSubscribersCount = async (req, res) => {
  try {
    // Count users with subscribedToNewsletter = true
    // If field doesn't exist, count all active users as potential subscribers
    const count = await User.countDocuments({
      $or: [
        { subscribedToNewsletter: true },
        { subscribedToNewsletter: { $exists: false }, isActive: true } // Fallback: count active users if field doesn't exist
      ]
    });

    res.json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch subscribers count'
    });
  }
};

// @desc    Get newsletter subscribers list
// @route   GET /api/admin/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50
    } = req.query;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find subscribers
    const subscribers = await User.find({
      $or: [
        { subscribedToNewsletter: true },
        { subscribedToNewsletter: { $exists: false }, isActive: true }
      ]
    })
      .select('name email phone isActive subscribedToNewsletter createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments({
      $or: [
        { subscribedToNewsletter: true },
        { subscribedToNewsletter: { $exists: false }, isActive: true }
      ]
    });

    // Normalize subscribers
    const normalized = subscribers.map(user => ({
      id: user._id.toString(),
      name: user.name || '',
      email: user.email,
      phone: user.phone || null,
      isActive: user.isActive !== false,
      subscribedToNewsletter: user.subscribedToNewsletter !== undefined ? user.subscribedToNewsletter : true,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null
    }));

    res.json({
      success: true,
      data: {
        subscribers: normalized
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch subscribers'
    });
  }
};

// Helper function to prepare image attachment for CID embedding
// This prevents Gmail clipping by using attachments instead of base64 or external URLs
const prepareImageAttachment = async (imagePath) => {
  if (!imagePath) return null;
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '..', cleanPath),
      path.join(process.cwd(), cleanPath),
      path.join(process.cwd(), 'backend', cleanPath),
    ];
    
    let fullPath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        fullPath = possiblePath;
        break;
      }
    }
    
    if (fullPath && fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const contentType = contentTypeMap[ext] || 'image/jpeg';
      
      return {
        filename: path.basename(fullPath),
        content: imageBuffer,
        cid: 'newsletter-image',
        contentType: contentType,
        contentDisposition: 'inline'
      };
    }
  } catch (error) {
    console.error('Error preparing image attachment:', error);
  }
  
  return null;
};

// Helper function to escape HTML (for security)
const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Helper function to generate HTML email content
const generateEmailHTML = (subject, message, image) => {
  let imageTag = '';
  
  // Escape subject for HTML
  const safeSubject = escapeHtml(subject);
  
  // Always use CID for images to prevent Gmail clipping
  // CID attachments keep HTML small and ensure images display
  if (image) {
    imageTag = `<img src="cid:newsletter-image" alt="${safeSubject}" style="max-width:100%;height:auto;border-radius:8px;margin:0;display:block;" />`;
  }
  
  // Process message - allow HTML but escape dangerous content
  // If message contains HTML tags, use it as-is (admin-controlled)
  // Otherwise, convert newlines to <br> and escape HTML
  let processedMessage = message;
  const hasHtmlTags = /<[^>]+>/.test(message);
  if (!hasHtmlTags) {
    // No HTML tags, so escape and convert newlines
    processedMessage = escapeHtml(message).replace(/\n/g, '<br>');
  } else {
    // Has HTML tags, trust admin but still escape script tags
    processedMessage = message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // Limit message length to prevent Gmail clipping (keep HTML under 50KB)
  const maxMessageLength = 20000; // ~20KB of text should be safe
  if (processedMessage.length > maxMessageLength) {
    console.warn(`⚠️ Message is very long (${(processedMessage.length/1024).toFixed(2)} KB), may cause Gmail clipping`);
    processedMessage = processedMessage.substring(0, maxMessageLength) + '...';
  }
  
  // Use inline styles only to prevent Gmail clipping
  // Gmail clips emails with complex HTML or large style tags
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeSubject}</title>
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f9fafb;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
        <tr>
          <td style="padding:30px;text-align:center;border-bottom:2px solid #DAA520;">
            <h1 style="margin:0 0 10px 0;color:#DAA520;font-size:24px;font-weight:bold;">رِداء - Ridaa</h1>
            <div style="color:#333;font-size:18px;font-weight:bold;margin-top:10px;">${safeSubject}</div>
          </td>
        </tr>
        ${imageTag ? `<tr><td style="padding:20px;text-align:center;">${imageTag}</td></tr>` : ''}
        <tr>
          <td style="padding:20px;font-size:16px;line-height:1.8;color:#333;">
            <div style="margin-top:20px;padding:15px;background-color:#f9fafb;border-radius:8px;">${processedMessage}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;text-align:center;border-top:1px solid #ddd;color:#666;font-size:12px;">
            <p style="margin:5px 0;">شكراً لاشتراكك في نشرتنا الإخبارية</p>
            <p style="margin:5px 0;">Thank you for subscribing to our newsletter</p>
            <p style="margin:10px 0;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe" style="color:#DAA520;text-decoration:none;">إلغاء الاشتراك / Unsubscribe</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// @desc    Send test newsletter email
// @route   POST /api/admin/newsletter/test
// @access  Private/Admin
export const sendTestNewsletter = async (req, res) => {
  try {
    const { subject, message, image, testEmail } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }
    
    // Get admin email from request
    const adminEmail = req.admin?.email || testEmail || 'ridaa.store.team@gmail.com';
    
    // Generate HTML content (using CID for image)
    const htmlContent = generateEmailHTML(subject, message, image);
    
    // Prepare image attachment if image exists
    const attachments = [];
    if (image) {
      const imageAttachment = await prepareImageAttachment(image);
      if (imageAttachment) {
        attachments.push(imageAttachment);
      }
    }
    
    // Send test email
    try {
      await sendEmail(
        adminEmail,
        `[TEST] ${subject}`,
        message,
        htmlContent,
        attachments
      );
      
      res.json({
        success: true,
        message: `Test email sent successfully to ${adminEmail}`,
        data: {
          email: adminEmail
        }
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Error in sendTestNewsletter:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test newsletter'
    });
  }
};

// @desc    Send newsletter to all subscribers
// @route   POST /api/admin/newsletter/send
// @access  Private/Admin
export const sendNewsletter = async (req, res) => {
  try {
    const { subject, message, image } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }
    
    // Get all subscribers
    const subscribers = await User.find({
      $or: [
        { subscribedToNewsletter: true },
        { subscribedToNewsletter: { $exists: false }, isActive: true }
      ],
      isActive: true
    })
      .select('email name')
      .lean();
    
    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No subscribers found'
      });
    }
    
    // Generate HTML content (using CID for image)
    // Generate once for all emails to save processing time
    const htmlContent = generateEmailHTML(subject, message, image);
    
    // Prepare image attachment once if image exists (reuse for all emails)
    const attachments = [];
    if (image) {
      const imageAttachment = await prepareImageAttachment(image);
      if (imageAttachment) {
        attachments.push(imageAttachment);
      }
    }
    
    // Send email to all subscribers
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (subscriber) => {
        try {
          await sendEmail(
            subscriber.email,
            subject,
            message, // Plain text version
            htmlContent,
            attachments // Use CID attachments for images
          );
          successCount++;
          return { success: true, email: subscriber.email };
        } catch (error) {
          failCount++;
          errors.push({
            email: subscriber.email,
            error: error.message || 'Failed to send email'
          });
          return { success: false, email: subscriber.email, error: error.message };
        }
      });
      
      await Promise.all(emailPromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }
    
    res.json({
      success: true,
      message: `Newsletter sent to ${successCount} subscribers${failCount > 0 ? `, ${failCount} failed` : ''}`,
      data: {
        total: subscribers.length,
        success: successCount,
        failed: failCount,
        errors: failCount > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send newsletter'
    });
  }
};

