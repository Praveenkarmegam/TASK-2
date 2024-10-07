const express = require('express');
const app = express();

app.use(express.json()); // Middleware to parse JSON requests

// In-memory data structures for rooms and bookings
let rooms = [];
let bookings = [];

// Endpoint 1: Create a Room
app.post('/rooms', (req, res) => {
    const { seats, amenities, pricePerHour, roomName } = req.body;

    // Validate request body
    if (!seats || !amenities || !pricePerHour || !roomName) {
        return res.status(400).send('All room details (seats, amenities, pricePerHour, roomName) are required.');
    }

    // Create room object
    const room = {
        id: rooms.length + 1,  // Generate room ID
        seats,
        amenities,
        pricePerHour,
        roomName,
    };

    // Add the room to the list
    rooms.push(room);

    // Return the newly created room
    res.status(201).send(room);
});

// Endpoint 2: Book a Room
app.post('/bookings', (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;

    // Validate request body
    if (!customerName || !date || !startTime || !endTime || !roomId) {
        return res.status(400).send('All booking details (customerName, date, startTime, endTime, roomId) are required.');
    }

    // Check if the room exists
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        return res.status(404).send('Room not found.');
    }

    // Check if the room is already booked for the given date and time
    const isBooked = bookings.some(
        (booking) => booking.roomId === roomId && booking.date === date && (
            (startTime >= booking.startTime && startTime < booking.endTime) ||
            (endTime > booking.startTime && endTime <= booking.endTime)
        )
    );

    if (isBooked) {
        return res.status(400).send('Room is already booked for the given time.');
    }

    // Create a new booking object
    const booking = {
        id: bookings.length + 1,  // Generate booking ID
        customerName,
        date,
        startTime,
        endTime,
        roomId,
        bookingDate: new Date(),  // Store the current date when the booking is made
        bookingStatus: 'confirmed',  // Status of the booking
    };

    // Add the booking to the list
    bookings.push(booking);

    // Return the newly created booking
    res.status(201).send(booking);
});

// Endpoint 3: List all Rooms with Booked Data
app.get('/rooms', (req, res) => {
    const roomData = rooms.map(room => {
        const roomBookings = bookings.filter(booking => booking.roomId === room.id);
        return {
            roomName: room.roomName,
            bookedStatus: roomBookings.length > 0 ? 'Booked' : 'Available',
            bookings: roomBookings.map(booking => ({
                customerName: booking.customerName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
            }))
        };
    });
    res.send(roomData);
});

// Endpoint 4: List all customers with booked data
app.get('/customers', (req, res) => {
    const customerData = bookings.map(booking => ({
        customerName: booking.customerName,
        roomName: rooms.find(room => room.id === booking.roomId).roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
    }));
    res.send(customerData);
});

// Endpoint 5: List how many times a customer has booked rooms
app.get('/customers/:customerName/bookings', (req, res) => {
    const { customerName } = req.params;

    // Filter the bookings by the customer's name
    const customerBookings = bookings
        .filter(booking => booking.customerName.toLowerCase() === customerName.toLowerCase())
        .map(booking => ({
            roomName: rooms.find(room => room.id === booking.roomId).roomName,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            bookingId: booking.id,
            bookingDate: booking.bookingDate,
            bookingStatus: booking.bookingStatus,
        }));

    if (customerBookings.length === 0) {
        return res.status(404).send('No bookings found for this customer.');
    }

    // Return customer's booking data
    res.send({
        customerName,
        totalBookings: customerBookings.length,
        bookings: customerBookings,
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
