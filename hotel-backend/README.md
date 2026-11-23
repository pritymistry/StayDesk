# Hotel Booking - Backend

Express + MySQL REST API. No authentication (out of scope per the requirements; can be added later with a `users` table + JWT).

## Setup
1. `npm install`
2. `cp .env.example .env` and fill in your MySQL credentials
3. Run `database/schema.sql`, then `database/seed.sql` in MySQL (8.0.16+)
4. `npm run dev`

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/room-types | List room types |
| GET | /api/room-types/:id | Get one room type |
| POST | /api/room-types | Add room type |
| PUT | /api/room-types/:id | Update room type |
| POST | /api/bookings | Create booking (checks availability) |
| GET | /api/bookings?status= | List bookings |
| GET | /api/bookings/:id | Get one booking |
| GET | /api/bookings/:id/bill | Billing breakdown (room charges, 12% GST, total) |
| PATCH | /api/bookings/:id/cancel | Cancel booking (room becomes available again) |
| GET | /api/dashboard | Room types, today's check-ins, active bookings |

Responses: `{ success, message?, data }` on success, `{ success: false, message, errors? }` on failure.
