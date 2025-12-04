# Ridaa Backend API

Backend API for Ridaa E-commerce platform built with Node.js, Express, and MongoDB.

## Features

- 🔐 Authentication & Authorization (JWT)
- 📦 Product Management
- 🛒 Order Management
- 👤 User Management
- 📊 Analytics Dashboard
- 🎫 Coupon System
- ⚙️ Settings Management
- 📁 File Upload Support

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

## Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── uploads/         # Uploaded files
├── server.js        # Entry point
└── package.json     # Dependencies
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ridaa
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

3. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/password` - Update password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:slug` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `GET /api/orders/track/:orderNumber` - Track order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Settings
- `GET /api/settings/store` - Get store settings
- `PUT /api/settings/store` - Update store settings (Admin)
- `GET /api/settings/whatsapp` - Get WhatsApp number
- `PUT /api/settings/whatsapp` - Update WhatsApp number (Admin)

### Analytics
- `GET /api/analytics` - Get analytics data (Admin)

### Coupons
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons` - Get all coupons (Admin)
- `POST /api/coupons` - Create coupon (Admin)
- `PUT /api/coupons/:id` - Update coupon (Admin)
- `DELETE /api/coupons/:id` - Delete coupon (Admin)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ridaa` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `UPLOAD_DIR` | Upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max file size in bytes | `5242880` (5MB) |

## Security Features

- Password hashing with bcrypt
- JWT authentication
- HTTP-only cookies
- CORS configuration
- Helmet.js for security headers
- Rate limiting (configurable)
- Input validation

## File Uploads

Uploaded files are stored in the `uploads/` directory:
- `uploads/avatars/` - User avatars
- `uploads/payment-proofs/` - Payment proof images
- `uploads/logos/` - Store logos
- `uploads/` - Product images and other files

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Run in production mode
npm start
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB Atlas or production MongoDB
4. Set up proper CORS origins
5. Use HTTPS
6. Configure file storage (consider cloud storage for production)

## License

ISC

