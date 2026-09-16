Vercel : https://re-market-bano-qabil-5-0-spring-pro.vercel.app/

1. Executive Summary & Vision
ReMarket is a full-stack, enterprise-grade Customer-to-Customer (C2C) Classifieds and Marketplace Web Platform, developed as the flagship capstone project for the Bano Qabil 5.0 (Spring) initiative.

Inspired by industry leaders like OLX and eBay, ReMarket bridges the gap between buyers and sellers within local communities. It provides a secure, modern, and transparent marketplace where users can list pre-owned or new items, discover verified local deals, negotiate directly through built-in messaging, and close transactions safely.

The platform is designed with a monorepo architecture utilizing modern technologies: a high-performance React 19 frontend powered by Vite and Tailwind CSS v4, connected to a resilient Express 5 RESTful API on Node.js, backed by MongoDB Atlas and Cloudinary CDN.


2. Real-World Problems Solved
Traditional classifieds platforms frequently suffer from spam listings, unverified accounts, slow image loading, complex moderation pipelines, and disconnected buyer-seller communication. ReMarket tackles these challenges with targeted engineering solutions:

Combating Spam & Fake Accounts:
Every user registration and login is secured through Multi-Factor Authentication (MFA) using Email OTPs, Phone/SMS OTP verification, or verified Google OAuth 2.0 sessions.
Eliminating Listing Delays with 1-Click Admin Email Actions:
Admins do not need to log into a dashboard just to approve an ad. When an ad is submitted, the platform emails the admin an immediate notification containing cryptographically signed, 1-click action links to approve or reject the ad straight from their inbox.
High-Speed Media Delivery:
Users can upload up to 5 high-resolution photos per ad. Images are streamed directly to Cloudinary’s CDN, ensuring instant loading, automatic compression, and responsive resizing.
Context-Aware Communication:
Instead of forcing users to share personal phone numbers immediately, ReMarket provides an integrated real-time chat system where conversations are explicitly tethered to specific listings.
Cold-Start Resilient Serverless Architecture:
The backend database connection utilizes a connection-caching pattern specifically engineered for serverless cloud environments (like Vercel), ensuring zero connection pool exhaustion.
3. End-to-End System Architecture
ReMarket is organized into three distinct decoupled layers:

A. Client Layer (Frontend SPA)
Framework: React 19 with Vite 8 for fast Hot Module Replacement (HMR) and optimized build bundles.
Styling: Tailwind CSS v4 for clean, responsive, mobile-first design.
State & Data Caching: TanStack React Query v5 manages asynchronous server state, automated background re-fetching, and cache invalidation.
Navigation & Security Guards: React Router v7 with route guards (PublicOnlyRoute, ProtectedRoute, and AdminRoute).
B. Gateway & API Layer (Backend REST API)
Runtime & Framework: Node.js (LTS) with Express 5, handling RESTful endpoints for authentication, ads, categories, messaging, notifications, and administrative moderation.
Multi-Route Ingestion: Configured with dual mount points (/ and /api/*) to integrate with Vercel serverless edge rewrites.
Security & Middleware: JWT authentication guards, role-based access checks (isAdmin), Multer in-memory streaming, and custom CORS origin matching.
C. Persistence & Third-Party Cloud Services
Database: MongoDB Atlas (hosted cloud replica set) managed via Mongoose 9 schemas.
Media Storage: Cloudinary Cloud Media Pipeline for asset transformation and CDN delivery.
Transactional Messaging: Nodemailer integration via SMTP for HTML-formatted OTP and notification delivery.
Federated Auth: Google Identity Services (OAuth 2.0).
4. Comprehensive Feature Breakdown
🔐 1. Identity, Authentication & User Management
Email OTP Verification: Users sign up or log in by receiving a 6-digit one-time password generated with dynamic expiration and sent through an HTML email template.
Phone / SMS OTP Verification: Alternate phone-number-based onboarding supported with provider fallbacks (SendPK, Twilio, and dev simulation).
Google OAuth 2.0: One-tap sign-in with Google, auto-linking existing profiles or provisioning new verified accounts.
JWT Stateless Session: Secure Bearer tokens passed via HTTP authorization headers, validated against expiration times on protected routes.
Profile Management: Users can update their avatar, name, registered city, contact phone, change their password, or request complete account deletion.
Public Seller Profiles: Buyers can view a seller’s dedicated public page showing member statistics, verification status, and all active listings posted by that seller.
🛍️ 2. Classified Listings Engine
5-State Ad Lifecycle: Listings transition through defined states:
pending: Newly submitted; waiting for moderation.
active: Approved and visible to the public.
sold: Item marked as sold by the owner.
rejected: Denied by an admin with feedback.
disabled: Soft-deleted or temporarily deactivated.
Multi-Image Upload Pipeline: Users upload up to 5 photos per ad. Multer holds files in memory buffers, streams them to Cloudinary, and stores secure CDN URLs and public_ids in MongoDB.
Search, Filtering & Taxonomy:
14 Pre-Seeded Categories: Mobiles, Vehicles, Property for Sale, Property for Rent, Electronics & Appliances, Bikes & Motorcycles, Business & Agriculture, Services, Jobs, Animals & Pets, Furniture & Decor, Fashion & Beauty, Books & Sports, Kids & Baby.
Location Filter: Granular city-based filtering covering all major Pakistani metropolitan areas (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Faisalabad, Multan, etc.).
Condition & Price: Filter by item condition (New, Like New, Used) and min/max price sliders.
Listing Analytics: Atomic view counter increments on each unique visit to an ad's detail page.
Owner Management (My Ads): Dedicated dashboard where sellers can review active, pending, or sold listings, edit descriptions/prices, change images, mark items as sold, or delete listings.
🛡️ 3. Administrative Moderation & 1-Click Email Action
Admin Dashboard: Privileged view (/admin/ads and /admin/users) accessible only by users with role: "admin".
Listing Review Queue: Displays all listings in pending status with complete details, pricing, seller identity, and full-resolution photos.
1-Click Cryptographic Email Moderation:
Whenever an ad is published, the platform signs a short-lived HMAC token encoding the adId and action (approve or reject).
An automated email with buttons is sent to ADMIN_EMAIL.
The admin can click Approve or Reject right inside their email client on their phone or desktop. The ad state updates immediately without requiring a manual dashboard login.
User Governance: Admins can view all registered users, monitor verification statuses, and promote or demote user roles (user ↔ admin).
💬 4. In-App Messaging & Chat
Context-Linked Discussions: Conversations are tied to a specific adId, buyerId, and sellerId.
Threaded Conversation View: Displays active buyer/seller discussions ordered chronologically by latest message timestamp.
Direct Seller Inquiry: From any ad page, clicking "Chat with Seller" immediately starts or resumes the conversation thread for that exact item.
Message Delivery: Real-time persistence of text messages with sender metadata, automatic notification generation for the receiver, and unread badges.
🔔 5. Notification Hub & Favorites
Real-Time Notification Feed: Dynamic alerts generated on key events:
Ad approved by admin
Ad rejected by admin
Ad marked as sold
New message received from a prospective buyer or seller
Badges & Unread Counter: Live unread count badge in the navigation bar with 1-click "Mark All as Read" functionality.
Favorites / Wishlist: Users can click the heart icon on any ad card to bookmark items. Favorited ads are accessible anytime in a dedicated /favorites tab.
5. Technology Stack Summary & Selection Rationale
Technology	Role in Project	Why It Was Chosen
React 19	Frontend Framework	State-of-the-art concurrent rendering, component reusability, and streamlined state handling.
Vite 8	Frontend Tooling	Instant server start, fast Hot Module Replacement, and optimized production chunking.
Tailwind CSS v4	UI Styling	Modern utility-first CSS framework enabling a cohesive, responsive design system with zero CSS bloat.
TanStack Query v5	Data Management	Manages server-side cache, handles background refetching, and provides smooth optimistic UI updates.
Express 5 & Node.js	Backend API	Lightweight, asynchronous I/O with high concurrency, perfect for RESTful API services.
MongoDB Atlas	Primary Database	Flexible NoSQL document model ideally suited for rich, evolving classifieds schemas.
Mongoose 9	ODM & Validation	Strict data validation, schema hooks, and population of relational references (User ↔ Ad ↔ Chat).
Cloudinary SDK v2	Cloud Media CDN	Automated image compression, fast transformations, and global CDN delivery without local disk reliance.
Nodemailer	SMTP Email Service	Reliable delivery of transactional emails, OTP verification codes, and admin 1-click action triggers.
Vercel	Hosting & Serverless	Unified monorepo deployment with edge proxy routing for both frontend static bundles and backend serverless endpoints.
6. Database Architecture & Data Models
ReMarket’s data layer is structured across 8 Mongoose models:

User (Users.js)

Fields: name, email, phone, password, googleId, authProvider, profileImage, role (user / admin), city, isVerified, isBlocked.
Indexes: Unique sparse index on email and phone allowing flexible local, phone, or Google authentication.
Ad (Ads.js)

Fields: user (ref: User), title, description, category (ref: Category), price, condition (New, Like New, Used), images (array of { url, public_id }), city, phone, views, status (pending, active, rejected, disabled, sold).
Category (Category.js)

Fields: name, icon, status (active / inactive).
Seeded automatically with 14 standardized marketplace categories on system start.
Conversation (Conversation.js)

Fields: ad (ref: Ad), buyer (ref: User), seller (ref: User), lastMessage, lastMessageAt.
Compound unique index: { ad: 1, buyer: 1 } guarantees a buyer and seller have at most one conversation thread per ad.
Message (Message.js)

Fields: conversation (ref: Conversation), sender (ref: User), text, read.
Notification (Notification.js)

Fields: recipient (ref: User), sender (ref: User), type (message, ad_approved, ad_rejected, ad_sold, general), title, message, link, isRead.
Favorite (Favorite.js)

Fields: user (ref: User), ad (ref: Ad).
Compound unique index: { user: 1, ad: 1 } prevents duplicate bookmarks.
Otp (Otp.js)

Fields: identifier (email or phone), otp, expiresAt.
Configured with a MongoDB TTL index for automatic expiration and document purging.
7. Security & Enterprise Engineering Highlights
Stateless Token Authentication: JSON Web Tokens (JWT) signed using secret keys with strict signature validation on all protected mutations.
Cryptographic Email Actions: Admin 1-click approvals utilize hashed HMAC action tokens with embedded expiration to prevent tampering, replay attacks, or unauthorized state changes.
Secure Credential Storage: User passwords are encrypted using bcryptjs with multi-round salt hashing before database writes.
NoSQL Query Sanitization: Mongoose strict schema enforcement protects against NoSQL injection vectors.
Serverless Resilient Database Connections: Database connection logic pools and reuses connections across function cold starts on Vercel, preventing connection exhaustion.
CORS Whitelisting: Dynamic origin verification explicitly permits configured local development hosts (http://localhost:5173, http://localhost:3000), production domains, and any ephemeral Vercel preview environments (*.vercel.app).
8. Presentation & Defense Talking Points (Quick Summary)
If you are presenting this project to mentors, examiners, or clients, here is the executive pitch:

"ReMarket is a full-stack classifieds marketplace built with React 19, Express 5, and MongoDB Atlas. It takes the familiar OLX model and modernizes it with multi-factor authentication (Email OTP, Phone OTP, and Google OAuth), an automated moderation system with 1-click cryptographic email approvals, and context-aware buyer-seller chat. The entire platform is deployed as an automated monorepo on Vercel with Cloudinary image streaming, ensuring high performance, zero server maintenance, and an intuitive user experience across mobile and desktop."
