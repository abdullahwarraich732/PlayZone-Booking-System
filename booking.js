// Booking page functionality
let selectedGame = null;
let selectedTimeSlot = null;

function initBookingPage() {
    loadGameDetails();
    setupEventListeners();
}

function loadGameDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (!gameId) {
        showGameNotFound();
        return;
    }
    
    selectedGame = PlayzoneUtils.games.find(game => game.id === gameId);
    
    if (!selectedGame) {
        showGameNotFound();
        return;
    }
    
    // Update game details in the header
    document.getElementById('gameName').textContent = selectedGame.name;
    document.getElementById('gameDescription').textContent = selectedGame.description;
    document.getElementById('gameDuration').textContent = selectedGame.duration;
    document.getElementById('gamePrice').textContent = `₹${selectedGame.price.toLocaleString()}`;
    
    // Update page title
    document.title = `Book ${selectedGame.name} - Playzone`;
}

function showGameNotFound() {
    document.getElementById('gameName').textContent = 'Game Not Found';
    document.getElementById('gameDescription').textContent = 'The requested game could not be found.';
    document.querySelector('.booking-form').innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
            <h4>Game Not Found</h4>
            <p class="text-muted mb-4">The game you're looking for doesn't exist or has been removed.</p>
            <a href="index.html" class="btn btn-primary">
                <i class="fas fa-arrow-left me-2"></i>Back to Home
            </a>
        </div>
    `;
}

function setupEventListeners() {
    const dateInput = document.getElementById('bookingDate');
    const form = document.getElementById('bookingForm');
    
    if (dateInput) {
        dateInput.addEventListener('change', handleDateChange);
    }
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function handleDateChange(event) {
    const selectedDate = event.target.value;
    
    if (!selectedDate) {
        hideTimeSlots();
        return;
    }
    
    // Validate date
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
        PlayzoneUtils.showAlert('Please select a future date', 'error');
        event.target.value = '';
        hideTimeSlots();
        return;
    }
    
    loadTimeSlots(selectedDate);
}

function loadTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    const timeSlotsSection = document.getElementById('timeSlotsSection');
    
    if (!timeSlotsContainer || !timeSlotsSection) return;
    
    const timeSlots = PlayzoneUtils.generateTimeSlots(date);
    
    timeSlotsContainer.innerHTML = timeSlots.map(slot => `
        <div class="time-slot ${slot.available ? '' : 'unavailable'}" 
             data-time="${slot.time}" 
             ${slot.available ? 'onclick="selectTimeSlot(this)"' : ''}>
            ${slot.time}
        </div>
    `).join('');
    
    timeSlotsSection.style.display = 'block';
    selectedTimeSlot = null;
}

function hideTimeSlots() {
    const timeSlotsSection = document.getElementById('timeSlotsSection');
    if (timeSlotsSection) {
        timeSlotsSection.style.display = 'none';
    }
    selectedTimeSlot = null;
}

function selectTimeSlot(element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot
    element.classList.add('selected');
    selectedTimeSlot = element.dataset.time;
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        date: document.getElementById('bookingDate').value,
        customerName: document.getElementById('customerName').value.trim(),
        customerEmail: document.getElementById('customerEmail').value.trim()
    };
    
    // Validate form
    if (!validateBookingForm(formData)) {
        return;
    }
    
    // Create booking
    const booking = {
        id: PlayzoneUtils.generateId(),
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        date: formData.date,
        timeSlot: selectedTimeSlot,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        price: selectedGame.price
    };
    
    // Save booking
    const bookings = PlayzoneUtils.getStoredBookings();
    bookings.push(booking);
    PlayzoneUtils.saveBookings(bookings);
    
    // Show confirmation
    showBookingConfirmation(booking);
}

function validateBookingForm(formData) {
    // Check if all fields are filled
    if (!formData.date || !formData.customerName || !formData.customerEmail) {
        PlayzoneUtils.showAlert('Please fill in all required fields', 'error');
        return false;
    }
    
    // Check if time slot is selected
    if (!selectedTimeSlot) {
        PlayzoneUtils.showAlert('Please select a time slot', 'error');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
        PlayzoneUtils.showAlert('Please enter a valid email address', 'error');
        return false;
    }
    
    // Check if date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today) {
        PlayzoneUtils.showAlert('Please select a future date', 'error');
        return false;
    }
    
    // Check if time slot is still available
    const bookedSlots = PlayzoneUtils.getBookedSlots(formData.date);
    if (bookedSlots.includes(selectedTimeSlot)) {
        PlayzoneUtils.showAlert('Selected time slot is no longer available. Please choose another slot.', 'error');
        loadTimeSlots(formData.date); // Refresh time slots
        return false;
    }
    
    return true;
}

function showBookingConfirmation(booking) {
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const detailsElement = document.getElementById('confirmationDetails');
    
    detailsElement.innerHTML = `
        <div class="booking-summary">
            <p><strong>Game:</strong> ${booking.gameName}</p>
            <p><strong>Date:</strong> ${PlayzoneUtils.formatDate(booking.date)}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
            <p><strong>Customer:</strong> ${booking.customerName}</p>
            <p><strong>Email:</strong> ${booking.customerEmail}</p>
            <p><strong>Total Amount:</strong> ${PlayzoneUtils.formatCurrency(booking.price)}</p>
        </div>
    `;
    
    modal.show();
    
    // Reset form
    resetBookingForm();
}

function resetBookingForm() {
    document.getElementById('bookingForm').reset();
    hideTimeSlots();
    selectedTimeSlot = null;
    
    // Clear any alerts
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
}

// Make functions available globally
window.selectTimeSlot = selectTimeSlot;
window.initBookingPage = initBookingPage;