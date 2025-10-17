// Game data
const games = [
  {
    id: "1",
    name: "Cricket",
    description:
      "Professional cricket pitch with all equipment provided. Perfect for team matches and practice sessions.",
    price: 2500,
    duration: 3,
    image:
      "https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "2",
    name: "Badminton",
    description:
      "Indoor badminton court with high-quality wooden flooring and professional lighting.",
    price: 800,
    duration: 1,
    image:
      "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "3",
    name: "Futsal",
    description:
      "Indoor football court with artificial turf and professional goal posts.",
    price: 1800,
    duration: 2,
    image:
      "https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "4",
    name: "Basketball",
    description:
      "Full-size basketball court with adjustable hoops and professional flooring.",
    price: 1200,
    duration: 2,
    image:
      "https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "5",
    name: "Tennis",
    description:
      "Professional tennis court with clay surface and quality nets.",
    price: 1500,
    duration: 1.5,
    image:
      "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "6",
    name: "Table Tennis",
    description: "Multiple table tennis tables in air-conditioned environment.",
    price: 400,
    duration: 1,
    image:
      "https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

// Utility functions
function getStoredBookings() {
  return JSON.parse(localStorage.getItem("bookings") || "[]");
}

function saveBookings(bookings) {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Generate time slots
function generateTimeSlots(date) {
  const slots = [];
  const bookedSlots = getBookedSlots(date);

  // Generate slots from 6 AM to 11 PM
  for (let hour = 6; hour <= 23; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    const id = `${date}-${time}`;

    slots.push({
      id,
      time,
      available: !bookedSlots.includes(time),
    });
  }

  return slots;
}

// Get booked slots for a specific date
function getBookedSlots(date) {
  const bookings = getStoredBookings();
  return bookings
    .filter(
      (booking) => booking.date === date && booking.status !== "cancelled"
    )
    .map((booking) => booking.timeSlot);
}

// Load games on homepage
function loadGames() {
  const container = document.getElementById("gamesContainer");
  if (!container) return;

  container.innerHTML = games
    .map(
      (game) => `
        <div class="col-lg-4 col-md-6">
            <div class="game-card">
                <div class="game-image">
                    <img src="${game.image}" alt="${game.name}" loading="lazy">
                    <div class="game-price">₹${game.price.toLocaleString()}</div>
                </div>
                <div class="game-content">
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-details">
                        <div class="game-detail">
                            <i class="fas fa-clock"></i>
                            <span>${game.duration}h session</span>
                        </div>
                        <div class="game-detail price">
                            <i class="fas fa-rupee-sign"></i>
                            <span>${game.price.toLocaleString()}/session</span>
                        </div>
                    </div>
                    <a href="book.html?game=${game.id}" class="btn-book">
                        <i class="fas fa-calendar"></i>
                        <span>View & Book</span>
                    </a>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Smooth scroll to games section
function scrollToGames() {
  const gamesSection = document.querySelector(".games-section");
  if (gamesSection) {
    gamesSection.scrollIntoView({ behavior: "smooth" });
  }
}

// Show alert message
function showAlert(message, type = "success") {
  const container = document.getElementById("alertContainer");
  if (!container) return;

  const alertClass = type === "success" ? "alert-success" : "alert-danger";
  const icon =
    type === "success" ? "fa-check-circle" : "fa-exclamation-triangle";

  container.innerHTML = `
        <div class="alert ${alertClass} fade-in">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;

  // Auto-hide success messages
  if (type === "success") {
    setTimeout(() => {
      container.innerHTML = "";
    }, 5000);
  }
}

// Initialize page based on current location
document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  switch (currentPage) {
    case "index.html":
    case "":
      loadGames();
      break;
    case "book.html":
      if (typeof initBookingPage === "function") {
        initBookingPage();
      }
      break;
    case "admin.html":
      if (typeof initAdminPage === "function") {
        initAdminPage();
      }
      break;
  }

  // Set minimum date for date inputs
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  dateInputs.forEach((input) => {
    input.min = today;
    input.max = maxDate;
  });
});

// Export functions for use in other files
window.PlayzoneUtils = {
  games,
  getStoredBookings,
  saveBookings,
  generateId,
  formatDate,
  formatCurrency,
  generateTimeSlots,
  getBookedSlots,
  showAlert,
};
