-- Requires MySQL 8.0.16+ (CHECK constraints are enforced from this version)
USE u674217149_H2oteldb;

CREATE TABLE IF NOT EXISTS room_types (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)   NOT NULL UNIQUE,
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
    total_rooms     INT           NOT NULL CHECK (total_rooms >= 0),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(15)  NOT NULL UNIQUE,   -- UNIQUE so a returning guest is reused
    email      VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guest_email (email)
);

CREATE TABLE IF NOT EXISTS bookings (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    guest_id        INT NOT NULL,
    room_type_id    INT NOT NULL,
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    nights          INT NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,   -- snapshot at booking time
    room_charges    DECIMAL(10,2) NOT NULL,   -- nights * price
    gst_amount      DECIMAL(10,2) NOT NULL,   -- 12% of room_charges
    total_amount    DECIMAL(10,2) NOT NULL,
    status          ENUM('CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_guest     FOREIGN KEY (guest_id)     REFERENCES guests(id),
    CONSTRAINT fk_booking_room_type FOREIGN KEY (room_type_id) REFERENCES room_types(id),
    CONSTRAINT chk_dates CHECK (check_out > check_in),

    INDEX idx_availability (room_type_id, status, check_in, check_out),
    INDEX idx_checkin (check_in)
);
