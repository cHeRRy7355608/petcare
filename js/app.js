// ---------- Global initMap (unchanged) ----------
window.initMap = function() {
  const fallback = { lat: 24.9715, lng: 67.0647 };
  const map = new google.maps.Map(document.getElementById('map'), {
    center: fallback,
    zoom: 15,
    gestureHandling: 'auto'
  });
  const address = "A 563, Main Shahrah-e-Usman, Sector 11-A North Karachi, Karachi, 75850, Pakistan";
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: address }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const loc = results[0].geometry.location;
      map.setCenter(loc);
      map.setZoom(17);
      const marker = new google.maps.Marker({
        position: loc,
        map: map,
        title: "FurEver Care - " + address
      });
      const info = new google.maps.InfoWindow({
        content: `<div style="font-size:14px;"><strong>FurEver Care</strong><br>${address}</div>`
      });
      info.open(map, marker);
      marker.addListener('click', () => info.open(map, marker));
    } else {
      console.error('Geocode was not successful for the following reason: ' + status);
      new google.maps.Marker({
        position: fallback,
        map: map,
        title: "FurEver Care (approx)"
      });
    }
  });
};

// ---------- Main App Logic ----------
let appData = null;
let jsonProducts = [];
let visitorCount = parseInt(localStorage.getItem('visitorCount')) || 0;
visitorCount++;
localStorage.setItem('visitorCount', visitorCount);

// Sample data for fallback (if data.json is unavailable)
const sampleVetSlots = [
  { id: 1, time: "2025-09-15 10:00 AM", status: "available", petName: "" },
  { id: 2, time: "2025-09-15 11:00 AM", status: "booked", petName: "Max" },
  { id: 3, time: "2025-09-16 02:00 PM", status: "available", petName: "" }
];

const sampleCaseStudies = [
  { id: 1, title: "Max", text: "Ear Infection - Antibiotics prescribed, follow-up in 2 weeks.", date: "2025-08-10" },
  { id: 2, title: "Luna", text: "Flea Allergy - Topical treatment applied.", date: "2025-07-20" }
];

document.addEventListener('DOMContentLoaded', () => {
  fetch('data/data.json')
    .then(r => r.json())
    .then(data => {
      appData = data;
      jsonProducts = data.products || [];
      init();
    })
    .catch(err => {
      console.error('Failed to load data.json', err);
      appData = {
        petProfiles: [], products: [], adoptables: [], vetSlots: sampleVetSlots,
        events: [], successStories: [], caseStudies: sampleCaseStudies,
        feeding: [], grooming: [], healthChecklist: [], helplines: [], trainingTips: []
      };
      init();
    });
});

function init() {
  setTimeout(() => {
    document.getElementById('preloader').style.opacity = '0';
    setTimeout(() => document.getElementById('preloader').style.display = 'none', 300);
  }, 700);
  updateStats();
  const clock = () => {
    const now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleString();
    document.getElementById('tickerTime').textContent = now.toLocaleTimeString();
  };
  clock();
  setInterval(clock, 1000);
  document.getElementById('visitorCount').textContent = visitorCount;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude.toFixed(2), lon = pos.coords.longitude.toFixed(2);
      document.getElementById('geoDisplay').textContent = `Lat: ${lat}, Lon: ${lon}`;
      document.getElementById('tickerLocation').textContent = `Lat: ${lat}, Lon: ${lon}`;
    }, () => {
      document.getElementById('geoDisplay').textContent = 'Not available';
    });
  } else {
    document.getElementById('geoDisplay').textContent = 'Unsupported';
  }
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
  document.getElementById('landingForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('userNameInput').value.trim();
    localStorage.setItem("UserNaamee", name);
    const cat = document.querySelector('input[name="userCategory"]:checked')?.value;
    if (!name || !cat) {
      Swal.fire({
        title: "Please enter name and select category",
        icon: "warning",
        draggable: true
      });
      return;
    }
    document.getElementById('userName').textContent = `Welcome, ${name}`;
    document.getElementById('userName').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('categorySwitcher').style.display = 'inline-block';
    document.getElementById('categorySwitcher').value = cat;
    document.querySelector('.hero').style.opacity = '0';
    setTimeout(() => {
      document.querySelector('.hero').style.display = 'none';
      document.getElementById('overview').style.display = 'block';
      document.getElementById('overview').style.opacity = '0';
      document.getElementById('commonSections').style.display = 'block';
      document.getElementById('commonSections').style.opacity = '0';
      switchDashboard(cat);
      setMenuFor(cat);
      setTimeout(() => {
        document.getElementById('overview').style.transition = 'opacity 0.5s';
        document.getElementById('overview').style.opacity = '1';
        document.getElementById('commonSections').style.transition = 'opacity 0.5s';
        document.getElementById('commonSections').style.opacity = '1';
        document.getElementById(`${cat}Section`).style.transition = 'opacity 0.5s';
        document.getElementById(`${cat}Section`).style.opacity = '1';
      }, 50);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  });
  document.getElementById('categorySwitcher').addEventListener('change', e => {
    const cat = e.target.value;
    document.querySelectorAll('#petOwnerSection, #veterinarianSection, #shelterSection').forEach(section => {
      section.style.transition = 'opacity 0.3s';
      section.style.opacity = '0';
    });
    setTimeout(() => {
      document.querySelectorAll('#petOwnerSection, #veterinarianSection, #shelterSection').forEach(section => {
        section.style.display = 'none';
      });
      switchDashboard(cat);
      setMenuFor(cat);
      document.getElementById(`${cat}Section`).style.transition = 'opacity 0.5s';
      document.getElementById(`${cat}Section`).style.opacity = '1';
      if (cat === 'veterinarian') {
        initVeterinarianDashboard();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem("UserNaamee");
    localStorage.clear();
    document.getElementById('userName').style.display = 'none';
    document.getElementById('petProfileDisplay').style.display = 'none';
    document.getElementById('vetProfileDisplay').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('categorySwitcher').style.display = 'none';
    document.getElementById('petOwnerSection').style.display = 'none';
    document.getElementById('veterinarianSection').style.display = 'none';
    document.getElementById('shelterSection').style.display = 'none';
    document.getElementById('overview').style.display = 'none';
    document.getElementById('commonSections').style.display = 'none';
    document.querySelector('.hero').style.display = '';
    document.querySelector('.hero').style.opacity = '0';
    window.location.href = "index.html";
    setTimeout(() => {
      document.querySelector('.hero').style.transition = 'opacity 0.5s';
      document.querySelector('.hero').style.opacity = '1';
    }, 50);
    setMenuFor('default');
    document.getElementById('landingForm').reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('newsletterForm').addEventListener('submit', e => {
    e.preventDefault();
    Swal.fire({
      title: "Thank you for subscribing! (UI-only)",
      icon: "success",
      draggable: true
    });
    e.target.reset();
  });
  document.getElementById('productSearch')?.addEventListener('input', filterAndSortProducts);
  document.getElementById('productSort')?.addEventListener('change', filterAndSortProducts);
  document.querySelectorAll('#productFilters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#productFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAndSortProducts();
    });
  });
  document.querySelectorAll('#shelterSection .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#shelterSection .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filterAdoptables(f);
    });
  });
  document.getElementById('petProfileForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const p = {
      name: document.getElementById('petName').value,
      species: document.getElementById('petSpecies').value.toLowerCase(),
      breed: document.getElementById('petBreed').value,
      age: document.getElementById('petAge').value + ' years',
      vaccination: document.getElementById('vaccinationInfo').value || 'Up to date'
    };
    let pets = JSON.parse(localStorage.getItem('petProfiles')) || [];
    pets.push(p);
    localStorage.setItem('petProfiles', JSON.stringify(pets));
    renderPetProfile(p);
    document.getElementById('petProfileDisplay').style.display = '';
    Swal.fire({
      title: "Pet Profile Added.",
      icon: "success",
      draggable: true
    });
    e.target.reset();
    updateStats();
  });
  document.getElementById('vetProfileForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const v = {
      name: document.getElementById('vetName').value,
      specialization: document.getElementById('vetSpecialization').value,
      contact: document.getElementById('vetContact').value,
      image: document.getElementById('vetImage').value || 'https://via.placeholder.com/150?text=Vet'
    };
    localStorage.setItem('vetProfile', JSON.stringify(v));
    renderVetProfile();
    document.getElementById('vetProfileDisplay').style.display = '';
    Swal.fire({
      title: "Vet Profile Added.",
      icon: "success",
      draggable: true
    });
    e.target.reset();
  });
  document.getElementById('feedbackForm')?.addEventListener('submit', e => {
    e.preventDefault();
    Swal.fire({
      title: "Thanks, feedback received.",
      icon: "success",
      draggable: true
    });
    e.target.reset();
  });
  renderFromJson();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
  window.addEventListener('scroll', () => {
    const b = document.querySelector('.back-to-top');
    if (window.scrollY > 250) b.classList.add('visible');
    else b.classList.remove('visible');
  });
  document.querySelector('.back-to-top')?.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Initialize Veterinarian Dashboard
function initVeterinarianDashboard() {
  if ($("#veterinarianSection").is(":visible")) {
    renderVetSlots();
    renderCaseStudies();
    initAppointmentForm();
    initMedicalHistoryForm();
  }
}

// Appointment Slots: Load and Save
function loadVetData() {
  const savedSlots = localStorage.getItem('vetSlots');
  const savedHistories = localStorage.getItem('caseStudies');
  return {
    vetSlots: savedSlots ? JSON.parse(savedSlots) : appData.vetSlots,
    caseStudies: savedHistories ? JSON.parse(savedHistories) : appData.caseStudies
  };
}

function saveVetData(slots, histories) {
  localStorage.setItem('vetSlots', JSON.stringify(slots));
  localStorage.setItem('caseStudies', JSON.stringify(histories));
}

// Appointment Slots: Render
function renderVetSlots() {
  const { vetSlots } = loadVetData();
  const box = document.getElementById('timeSlots');
  box.innerHTML = '';
  vetSlots.forEach(s => {
    const el = document.createElement('div');
    el.className = 'time-slot glass-card animate-in';
    el.innerHTML = `
      <div>
        <strong>${s.time}</strong>
        <div class="small text-muted">${s.petName ? `Pet: ${s.petName}` : 'No pet assigned'}</div>
      </div>
      <span class="badge ${s.status === 'available' ? 'bg-success' : 'bg-warning'}">${s.status}</span>
      <button class="btn btn-sm btn-cta ms-2 toggle-slot" data-id="${s.id}">${s.status === 'available' ? 'Book' : 'Cancel'}</button>
    `;
    box.appendChild(el);
  });
  setTimeout(() => box.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible')), 100);

  // Handle slot toggle
  document.querySelectorAll('.toggle-slot').forEach(btn => {
    btn.addEventListener('click', () => {
      const slotId = btn.dataset.id;
      const { vetSlots, caseStudies } = loadVetData();
      const slot = vetSlots.find(s => s.id == slotId);
      if (slot.status === 'available') {
        Swal.fire({
          title: 'Book Appointment',
          html: '<input id="petNameInput" class="form-control" placeholder="Enter Pet Name" required>',
          showCancelButton: true,
          confirmButtonText: 'Book',
          preConfirm: () => {
            const petName = document.getElementById('petNameInput').value.trim();
            if (!petName) {
              Swal.showValidationMessage('Pet name is required');
            }
            return petName;
          }
        }).then(result => {
          if (result.isConfirmed) {
            slot.status = 'booked';
            slot.petName = result.value;
            saveVetData(vetSlots, caseStudies);
            renderVetSlots();
            Swal.fire('Success', 'Appointment booked!', 'success');
          }
        });
      } else {
        Swal.fire({
          title: 'Cancel Appointment?',
          text: `Cancel appointment for ${slot.petName}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, cancel'
        }).then(result => {
          if (result.isConfirmed) {
            slot.status = 'available';
            slot.petName = '';
            saveVetData(vetSlots, caseStudies);
            renderVetSlots();
            Swal.fire('Success', 'Appointment canceled!', 'success');
          }
        });
      }
    });
  });
}

// Appointment Slots: Add New Form
function initAppointmentForm() {
  const vetSection = document.querySelector('#veterinarianSection .col-lg-5');
  const existingForm = document.getElementById('appointmentForm');
  if (existingForm) return; // Prevent duplicate forms
  const formHtml = `
    <div class="glass-card p-4 mt-3 card-hover animate-in">
      <h6>Add Appointment Slot</h6>
      <form id="appointmentForm">
        <input id="slotTime" type="datetime-local" class="form-control mb-2" placeholder="Date & Time" required>
        <button class="btn btn-cta w-100" type="submit">Add Slot</button>
      </form>
    </div>
  `;
  vetSection.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('appointmentForm').addEventListener('submit', e => {
    e.preventDefault();
    const { vetSlots, caseStudies } = loadVetData();
    const newSlot = {
      id: vetSlots.length ? Math.max(...vetSlots.map(s => s.id)) + 1 : 1,
      time: new Date(document.getElementById('slotTime').value).toLocaleString(),
      status: 'available',
      petName: ''
    };
    vetSlots.push(newSlot);
    saveVetData(vetSlots, caseStudies);
    renderVetSlots();
    Swal.fire('Success', 'Appointment slot added!', 'success');
    e.target.reset();
  });
  setTimeout(() => vetSection.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible')), 100);
}

// Pet Medical Histories: Render
function renderCaseStudies() {
  const { caseStudies } = loadVetData();
  const box = document.getElementById('caseStudies');
  box.innerHTML = '';
  caseStudies.forEach(c => {
    const el = document.createElement('div');
    el.className = 'case-study glass-card animate-in';
    el.innerHTML = `
      <strong>${c.title}</strong>
      <div class="small text-muted">${c.text}</div>
      <div class="small text-muted">Date: ${c.date}</div>
      <button class="btn btn-sm btn-cta mt-2 view-history" data-id="${c.id}">View Details</button>
    `;
    box.appendChild(el);
  });
  setTimeout(() => box.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible')), 100);

  // Handle view details
  document.querySelectorAll('.view-history').forEach(btn => {
    btn.addEventListener('click', () => {
      const historyId = btn.dataset.id;
      const { caseStudies } = loadVetData();
      const history = caseStudies.find(h => h.id == historyId);
      Swal.fire({
        title: `${history.title}'s Medical History`,
        html: `
          <p><strong>Diagnosis:</strong> ${history.text.split(' - ')[0]}</p>
          <p><strong>Treatment:</strong> ${history.text.split(' - ')[1] || 'N/A'}</p>
          <p><strong>Date:</strong> ${history.date}</p>
          <textarea id="historyNotes" class="form-control" placeholder="Add notes..." rows="4"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Notes',
        preConfirm: () => {
          const notes = document.getElementById('historyNotes').value.trim();
          return notes;
        }
      }).then(result => {
        if (result.isConfirmed) {
          // Optionally save notes to history.text or a new field
          Swal.fire('Success', 'Notes saved!', 'success');
        }
      });
    });
  });
}

// Pet Medical Histories: Add New Form
function initMedicalHistoryForm() {
  const vetSection = document.querySelector('#veterinarianSection .col-lg-5');
  const existingForm = document.getElementById('medicalHistoryForm');
  if (existingForm) return; // Prevent duplicate forms
  const formHtml = `
    <div class="glass-card p-4 mt-3 card-hover animate-in">
      <h6>Add Medical History</h6>
      <form id="medicalHistoryForm">
        <input id="historyPetName" class="form-control mb-2" placeholder="Pet Name" required>
        <input id="historyDiagnosis" class="form-control mb-2" placeholder="Diagnosis" required>
        <textarea id="historyTreatment" class="form-control mb-2" placeholder="Treatment" required></textarea>
        <input id="historyDate" type="date" class="form-control mb-2" required>
        <button class="btn btn-cta w-100" type="submit">Add History</button>
      </form>
    </div>
  `;
  vetSection.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('medicalHistoryForm').addEventListener('submit', e => {
    e.preventDefault();
    const { vetSlots, caseStudies } = loadVetData();
    const newHistory = {
      id: caseStudies.length ? Math.max(...caseStudies.map(h => h.id)) + 1 : 1,
      title: document.getElementById('historyPetName').value.trim(),
      text: `${document.getElementById('historyDiagnosis').value.trim()} - ${document.getElementById('historyTreatment').value.trim()}`,
      date: document.getElementById('historyDate').value
    };
    caseStudies.push(newHistory);
    saveVetData(vetSlots, caseStudies);
    renderCaseStudies();
    Swal.fire('Success', 'Medical history added!', 'success');
    e.target.reset();
  });
  setTimeout(() => vetSection.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible')), 100);
}

function switchDashboard(cat) {
  document.getElementById('petOwnerSection').style.display = cat === 'petOwner' ? 'block' : 'none';
  document.getElementById('veterinarianSection').style.display = cat === 'veterinarian' ? 'block' : 'none';
  document.getElementById('shelterSection').style.display = cat === 'shelter' ? 'block' : 'none';
  document.getElementById('petOwnerSection').style.opacity = '0';
  document.getElementById('veterinarianSection').style.opacity = '0';
  document.getElementById('shelterSection').style.opacity = '0';
  if (cat === 'veterinarian') {
    initVeterinarianDashboard();
  }
}

function renderFromJson() {
  renderProducts();
  renderAdoptables();
  renderEvents();
  renderSuccessStories();
  renderCaseStudies();
  renderVetSlots();
  renderFeedingGuide();
  renderGroomingVideos();
  renderHealthTips();
  renderTrainingTips();
  renderHelplines();
  const localPets = JSON.parse(localStorage.getItem('petProfiles')) || [];
  if (localPets.length > 0) {
    localPets.forEach(renderPetProfile);
    document.getElementById('petProfileDisplay').style.display = '';
  }
  renderVetProfile();
}

function setMenuFor(cat) {
  const menu = document.getElementById('dynamicMenu');
  menu.innerHTML = '';
  if (cat === 'petOwner') {
    menu.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="#petOwnerSection">Pet Care</a></li>
      <li class="nav-item"><a class="nav-link" href="#petOwnerSection .glass-card:nth-of-type(3)">Products</a></li>
      <li class="nav-item"><a class="nav-link" href="#petOwnerSection .glass-card:nth-of-type(6)">Emergency</a></li>
      <li class="nav-item"><a class="nav-link" href="#commonSections">Feedback</a></li>
      <li class="nav-item"><a class="nav-link" href="#aboutUs">About</a></li>
    `;
  } else if (cat === 'veterinarian') {
    menu.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="#veterinarianSection #vetProfileDisplay">Profile</a></li>
      <li class="nav-item"><a class="nav-link" href="#veterinarianSection #timeSlots">Appointments</a></li>
      <li class="nav-item"><a class="nav-link" href="#veterinarianSection #caseStudies">Medical Histories</a></li>
      <li class="nav-item"><a class="nav-link" href="#commonSections">Contact</a></li>
    `;
  } else if (cat === 'shelter') {
    menu.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="#shelterSection #adoptionGallery">Adoptables</a></li>
      <li class="nav-item"><a class="nav-link" href="#shelterSection #successStories">Success Stories</a></li>
      <li class="nav-item"><a class="nav-link" href="#shelterSection #eventAnnouncements">Events</a></li>
      <li class="nav-item"><a class="nav-link" href="#shelterSection #map">Contact</a></li>
    `;
  } else {
    menu.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="#overview">Home</a></li>
      <li class="nav-item"><a class="nav-link" href="#commonSections">Contact</a></li>
      <li class="nav-item"><a class="nav-link" href="#aboutUs">About</a></li>
    `;
  }
}

function renderPetProfile(p) {
  const box = document.getElementById('profileDetails');
  const el = document.createElement('div');
  el.className = 'd-flex gap-3 align-items-center mb-3';
  el.innerHTML = `
    <img src="../images/dogs/dog1.jpg" style="width:70px;height:70px;border-radius:10px;object-fit:cover">
    <div>
      <strong>${p.name}</strong>
      <div class="small text-muted">${p.species} • ${p.breed} • ${p.age}</div>
      <div class="small text-muted">Vaccination: ${p.vaccination}</div>
    </div>
  `;
  box.appendChild(el);
  document.getElementById('petProfileDisplay').style.display = '';
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  jsonProducts.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-4 product-item';
    col.dataset.category = p.category;
    col.dataset.name = p.name.toLowerCase();
    col.dataset.price = p.price;
    col.innerHTML = `
      <div class="product-card glass-card">
        <img src="${p.image}" alt="${p.name}">
        <div class="card-body">
          <h6>${p.name}</h6>
          <p class="small text-muted">${p.desc}</p>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <strong>$${p.price}</strong>
            <button class="btn buy-btn">Buy Now</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
  updateStats();
}

function filterAndSortProducts() {
  const search = document.getElementById('productSearch').value.toLowerCase();
  const sort = document.getElementById('productSort').value;
  const filter = document.querySelector('#productFilters .filter-btn.active')?.dataset.filter || 'all';
  let items = Array.from(document.querySelectorAll('.product-item'));
  items = items.filter(item => {
    const catMatch = filter === 'all' || item.dataset.category === filter;
    const searchMatch = item.dataset.name.includes(search);
    return catMatch && searchMatch;
  });
  if (sort === 'name-asc') items.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
  else if (sort === 'name-desc') items.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
  else if (sort === 'price-asc') items.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
  else if (sort === 'price-desc') items.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(item));
}

function renderAdoptables() {
  const grid = document.getElementById('adoptionGallery');
  grid.innerHTML = '';
  appData.adoptables.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-3 adoption-item';
    col.dataset.type = p.species;
    col.innerHTML = `
      <div class="glass-card">
        <img src="${p.image}" alt="${p.name}">
        <div class="adopt-info p-2">
          <strong>${p.name}</strong>
          <div class="small text-muted">${p.age} • ${p.breed}</div>
          <p class="small">${p.desc}</p>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
  updateStats();
}

function filterAdoptables(filter) {
  document.querySelectorAll('.adoption-item').forEach(item => {
    item.style.display = (filter === 'all' || item.dataset.type === filter) ? '' : 'none';
  });
}

function renderSuccessStories() {
  const box = document.getElementById('successStories');
  box.innerHTML = '';
  appData.successStories.forEach(s => {
    const el = document.createElement('div');
    el.className = 'mb-3 glass-card p-2';
    el.innerHTML = `
      <img src="${s.image}" style="width:100%;height:150px;object-fit:cover;border-radius:10px">
      <h6 class="mt-2">${s.title}</h6>
      <p class="small text-muted">${s.text}</p>
    `;
    box.appendChild(el);
  });
}

function renderEvents() {
  const box = document.getElementById('eventAnnouncements');
  box.innerHTML = '';
  appData.events.forEach(ev => {
    const el = document.createElement('div');
    el.className = 'mb-2 glass-card p-2';
    el.innerHTML = `<strong>${ev.title}</strong><div class="small text-muted">${ev.date} - ${ev.location}: ${ev.desc}</div>`;
    box.appendChild(el);
  });
}

function renderVetProfile() {
  const raw = localStorage.getItem('vetProfile');
  if (!raw) return;
  const v = JSON.parse(raw);
  const box = document.getElementById('vetDetails');
  box.innerHTML = `
    <img src="${v.image}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;margin-bottom:12px;">
    <strong>${v.name}</strong>
    <div class="small text-muted">${v.specialization}</div>
    <div class="small text-muted">${v.contact}</div>
  `;
  document.getElementById('vetProfileDisplay').style.display = '';
}

function renderFeedingGuide() {
  const body = document.getElementById('feedingTableBody');
  body.innerHTML = '';
  appData.feeding.forEach(f => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${f.stage}</td><td colspan="2">${f.guide}</td>`;
    body.appendChild(row);
  });
}

function renderGroomingVideos() {
  const container = document.getElementById('groomingVideos');
  container.innerHTML = '';
  appData.grooming.forEach(g => {
    const col = document.createElement('div');
    col.className = 'col-md-6';
    col.innerHTML = `
      <div class="video-wrap"><iframe src="https://www.youtube.com/embed/${g.videoId}" allowfullscreen></iframe></div>
      <small class="d-block mt-1">${g.title}</small>
    `;
    container.appendChild(col);
  });
}

function renderHealthTips() {
  const container = document.getElementById('healthTips');
  container.innerHTML = '';
  appData.healthChecklist.forEach(h => {
    const el = document.createElement('div');
    el.className = 'col-md-12 mb-2';
    el.innerHTML = `<div class="glass-card p-2 small">${h}</div>`;
    container.appendChild(el);
  });
}

function renderTrainingTips() {
  const list = document.getElementById('trainingTipsList');
  list.innerHTML = '';
  appData.trainingTips.forEach(t => {
    const item = document.createElement('li');
    item.className = 'list-group-item small';
    item.textContent = t;
    list.appendChild(item);
  });
}

function renderHelplines() {
  const body = document.getElementById('helplinesTable');
  body.innerHTML = '';
  appData.helplines.forEach(h => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${h.name}</td><td>${h.number}</td>`;
    body.appendChild(row);
  });
}

function updateStats() {
  document.getElementById('statPets').textContent = JSON.parse(localStorage.getItem('petProfiles'))?.length || 0;
  document.getElementById('statProducts').textContent = jsonProducts.length;
  document.getElementById('statAdopt').textContent = appData.adoptables.length;
}