// Admin dashboard functionality
let currentFilter = "all";
let bookings = [];

function initAdminPage() {
  loadBookings();
  setupEventListeners();
  updateStats();
}

function loadBookings() {
  bookings = PlayzoneUtils.getStoredBookings();
  renderBookings();
  updateFilterCounts();
}

function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", handleFilterChange);
  });

  // Delete confirmation
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", confirmDelete);
  }
}

function handleFilterChange(event) {
  const filter = event.target.dataset.filter;

  // Update active button
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.classList.remove("active");
    btn.classList.add(
      "btn-outline-primary",
      "btn-outline-warning",
      "btn-outline-success",
      "btn-outline-danger"
    );
  });

  event.target.classList.add("active");
  event.target.classList.remove(
    "btn-outline-primary",
    "btn-outline-warning",
    "btn-outline-success",
    "btn-outline-danger"
  );

  if (filter === "all") {
    event.target.classList.add("btn-primary");
  }

  currentFilter = filter;
  renderBookings();
}

function renderBookings() {
  const tbody = document.getElementById("bookingsTableBody");
  const emptyState = document.getElementById("emptyState");

  if (!tbody || !emptyState) return;

  const filteredBookings = bookings.filter((booking) => {
    return currentFilter === "all" || booking.status === currentFilter;
  });

  if (filteredBookings.length === 0) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  tbody.innerHTML = filteredBookings
    .map(
      (booking) => `
        <tr>
            <td>
                <div>
                    <div class="fw-semibold">${booking.customerName}</div>
                    <div class="text-muted small">${booking.customerEmail}</div>
                </div>
            </td>
            <td>
                <div class="fw-semibold">${booking.gameName}</div>
                <div class="text-muted small">${PlayzoneUtils.formatCurrency(
                  booking.price || 0
                )}</div>
            </td>
            <td>
                <div>${PlayzoneUtils.formatDate(booking.date)}</div>
                <div class="text-muted small">${booking.timeSlot}</div>
            </td>
            <td>
                <span class="status-badge status-${booking.status}">
                    ${
                      booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)
                    }
                </span>
            </td>
            <td>
                <div class="d-flex gap-1">
                    ${
                      booking.status === "pending"
                        ? `
                        <button class="action-btn btn-success" 
                                onclick="updateBookingStatus('${booking.id}', 'confirmed')"
                                title="Confirm booking">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn btn-warning" 
                                onclick="updateBookingStatus('${booking.id}', 'cancelled')"
                                title="Cancel booking">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : ""
                    }
                    <button class="action-btn btn-danger" 
                            onclick="deleteBooking('${booking.id}')"
                            title="Delete booking">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

function updateFilterCounts() {
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  Object.keys(counts).forEach((status) => {
    const element = document.getElementById(`${status}Count`);
    if (element) {
      element.textContent = counts[status];
    }
  });
}

function updateStats() {
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    revenue: bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + (b.price || 1000), 0),
  };

  // Update stat cards
  const elements = {
    totalBookings: stats.total,
    confirmedBookings: stats.confirmed,
    pendingBookings: stats.pending,
    totalRevenue: PlayzoneUtils.formatCurrency(stats.revenue),
  };

  Object.keys(elements).forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = elements[id];
    }
  });
}

function updateBookingStatus(bookingId, newStatus) {
  const bookingIndex = bookings.findIndex((b) => b.id === bookingId);

  if (bookingIndex === -1) return;

  bookings[bookingIndex].status = newStatus;
  bookings[bookingIndex].updatedAt = new Date().toISOString();

  PlayzoneUtils.saveBookings(bookings);

  // Refresh display
  renderBookings();
  updateFilterCounts();
  updateStats();

  // Show success message
  const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
  showToast(`Booking ${statusText}`, "success");
}

let bookingToDelete = null;

function deleteBooking(bookingId) {
  bookingToDelete = bookingId;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function confirmDelete() {
  if (!bookingToDelete) return;

  bookings = bookings.filter((b) => b.id !== bookingToDelete);
  PlayzoneUtils.saveBookings(bookings);

  // Refresh display
  renderBookings();
  updateFilterCounts();
  updateStats();

  // Hide modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("deleteModal")
  );
  modal.hide();

  // Show success message
  showToast("Booking deleted successfully", "success");

  bookingToDelete = null;
}

function showToast(message, type = "success") {
  // Create toast element
  const toastContainer =
    document.getElementById("toastContainer") || createToastContainer();

  const toastId = "toast-" + Date.now();
  const bgClass = type === "success" ? "bg-success" : "bg-danger";

  const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${
                      type === "success" ? "check" : "exclamation-triangle"
                    } me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();

  // Remove toast element after it's hidden
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "toast-container position-fixed top-0 end-0 p-3";
  container.style.zIndex = "1055";
  document.body.appendChild(container);
  return container;
}

// Make functions available globally
window.updateBookingStatus = updateBookingStatus;
window.deleteBooking = deleteBooking;
window.confirmDelete = confirmDelete;
window.initAdminPage = initAdminPage;
