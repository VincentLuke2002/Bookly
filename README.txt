BOOKLY — LOCAL FULL-STACK SYSTEM

Bookly is a responsive service-booking marketplace with a local Node.js API,
SQLite database, and three protected account modes: customer, provider, and
administrator. No live payment gateway is required.



START THE WEBSITE
1. Open https://bookly-service-platform.onrender.com
 

You can also open a terminal in this folder and run:
  npm start



DEMO ACCOUNTS
- Customer: user@bookly.local / User123!
- Provider: provider@bookly.local / Provider123!
- Admin: admin@bookly.local / Admin123!

DATA
- The SQLite database is created automatically at data/bookly.db.
- Demo users, providers, and services are inserted only when the database is new.
- Passwords are salted and hashed with scrypt.
- Sessions use HTTP-only cookies and expire after seven days.
- Card numbers and e-wallet credentials are not stored.
- The booking cart stays in the browser until checkout. Confirmed bookings,
  accounts, profiles, services, and wishlists are saved in SQLite.

ACCOUNT MODES
- Customer: register, log in, edit profile/password, browse providers, use the
  wishlist, book services, choose fulfilment/payment method, view or cancel orders.
- Provider: apply for an account, manage public profile and services, review
  booking requests, and change booking status. New applications require admin approval.
- Admin: view system totals, approve/disable providers, create providers, manage
  users, and update all booking statuses.

MAIN FILES
- server.js: local server, database schema, seeded data, API, authentication
- website/: all responsive pages, CSS, and browser JavaScript
- data/bookly.db: generated SQLite database (ignored by Git)
- documentation/: submitted progress-report PDF files
- start-bookly.bat: Windows launcher

TESTS
Run from a terminal in this folder:
  npm test

The automated smoke test uses a separate ignored test database.

DESIGN SYSTEM
- Store: Bookly
- Primary ocean: #123B4A
- Secondary teal: #207F73
- Accent coral: #F26B4F
- Background mist: #F7F8F6
- Text: #132B30
- Border: #DCE5E2
- Heading font: Fraunces
- Body/UI font: DM Sans
