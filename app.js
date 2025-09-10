// function searchMasjids() {
//     const query = document.getElementById("searchInput").value.trim();
//     const results = document.getElementById("results");
  
//     if (!query) {
//       results.innerHTML = "<p>Please enter a city or zip code.</p>";
//       return;
//     }
  
//     // Placeholder data - in the future, use Google Maps or a real database
//     const fakeMasjids = [
//       {
//         name: "Masjid Al-Falah",
//         city: "Atlanta",
//         notes: ["Clean wudu area", "Open for all prayers"]
//       },
//       {
//         name: "Islamic Center of Raleigh",
//         city: "Raleigh",
//         notes: ["Large parking lot", "Women’s section available"]
//       }
//     ];
  
//     const filtered = fakeMasjids.filter(m =>
//       m.city.toLowerCase().includes(query.toLowerCase())
//     );
  
//     if (filtered.length === 0) {
//       results.innerHTML = "<p>No masjids found in that location.</p>";
//       return;
//     }
  
//     results.innerHTML = filtered
//       .map(
//         m => `
//         <div class="masjid">
//           <h3>${m.name}</h3>
//           <p><strong>City:</strong> ${m.city}</p>
//           <p><strong>Notes:</strong></p>
//           <ul>${m.notes.map(note => `<li>${note}</li>`).join("")}</ul>
//         </div>
//       `
//       )
//       .join("");
//   }

  


const markers = []; // keep track of all markers so we can show/hide them


  // Initialize the map (centered on USA by default)
const map = L.map('map').setView([37.8, -96], 4); // [lat, lng], zoom level

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Dummy masjid data
const masjids = [
  {
    name: "Masjid Al-Falah",
    coords: [33.749, -84.388], // Atlanta
    notes: ["Clean wudu area", "Open for all prayers"]
  },
  {
    name: "Islamic Center of Raleigh",
    coords: [35.7796, -78.6382], // Raleigh
    notes: ["Large parking lot", "Women’s section available"]
  },
  {
    name: "Masjid Darul Huda",
    coords: [40.7128, -74.006], // NYC
    notes: ["Daily classes", "Kids Quran program"]
  }
];

// Add markers
// masjids.forEach(masjid => {
//   const popupContent = `
//     <strong>${masjid.name}</strong><br>
//     <ul>${masjid.notes.map(note => `<li>${note}</li>`).join("")}</ul>
//   `;
//   L.marker(masjid.coords).addTo(map).bindPopup(popupContent);
// });

masjids.forEach(masjid => {
    const popupContent = `
      <strong>${masjid.name}</strong><br>
      <ul>${masjid.notes.map(note => `<li>${note}</li>`).join("")}</ul>
    `;
  
    const marker = L.marker(masjid.coords).bindPopup(popupContent);
    marker.addTo(map);
    markers.push({ marker, masjid });
  });

  
// Load custom masjids from localStorage
const saved = JSON.parse(localStorage.getItem("customMasjids")) || [];
saved.forEach(masjid => {
  const popupContent = `
    <strong>${masjid.name}</strong><br>
    <ul>${masjid.notes.map(note => `<li>${note}</li>`).join("")}</ul>
  `;
  const marker = L.marker(masjid.coords).bindPopup(popupContent);
  marker.addTo(map);
  markers.push({ marker, masjid });
});




// Try to locate user and zoom in
map.locate({ setView: true, maxZoom: 12 });

map.on('locationfound', function (e) {
  L.marker(e.latlng).addTo(map)
    .bindPopup("You are here!").openPopup();
    
    drawQiblaArrow(e.latlng.lat, e.latlng.lng);

// to draw the Qibla from map center instead of user, replace with:

//     const center = map.getCenter();
// drawQiblaArrow(center.lat, center.lng);

});

map.on('locationerror', function () {
  alert("Could not get your location. Showing USA map instead.");
});


function searchMasjids() {
    const query = document.getElementById("searchInput").value.trim();
  
    if (!query) {
      alert("Please enter a city, ZIP code, or address.");
      return;
    }
  
    // Use Nominatim API for geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          alert("Location not found.");
          return;
        }
  
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
  
        // Move the map to the searched location
        map.setView([lat, lon], 12);
  
        // Optional: Drop a marker on the searched location
        L.marker([lat, lon])
          .addTo(map)
          .bindPopup(`Search result: ${query}`)
          .openPopup();
      })
      .catch(err => {
        console.error("Error fetching location:", err);
        alert("Something went wrong with the search.");
      });
  }
  

  function updateVisibleMarkers() {
    const bounds = map.getBounds();
  
    markers.forEach(({ marker, masjid }) => {
      if (bounds.contains(marker.getLatLng())) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      } else {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    });
  }


  map.on("moveend", updateVisibleMarkers);

  const masjidForm = document.getElementById("masjidForm");

masjidForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("masjidName").value.trim();
  const lat = parseFloat(document.getElementById("masjidLat").value.trim());
  const lng = parseFloat(document.getElementById("masjidLng").value.trim());
  const notesInput = document.getElementById("masjidNotes").value.trim();
  const notes = notesInput ? notesInput.split(",").map(n => n.trim()) : [];

  if (!name || isNaN(lat) || isNaN(lng)) {
    alert("Please enter valid name, latitude, and longitude.");
    return;
  }

  const newMasjid = { name, coords: [lat, lng], notes };

  // Save to localStorage
  let saved = JSON.parse(localStorage.getItem("customMasjids")) || [];
  saved.push(newMasjid);
  localStorage.setItem("customMasjids", JSON.stringify(saved));

  // Add to map immediately
  const popupContent = `
    <strong>${newMasjid.name}</strong><br>
    <ul>${notes.map(note => `<li>${note}</li>`).join("")}</ul>
  `;
  const marker = L.marker([lat, lng]).bindPopup(popupContent);
  marker.addTo(map);
  markers.push({ marker, masjid: newMasjid });

  masjidForm.reset();
});

  updateVisibleMarkers(); // show only relevant markers at start


  const useLocationBtn = document.getElementById("useMyLocation");

useLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported on this device.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      document.getElementById("masjidLat").value = position.coords.latitude.toFixed(6);
      document.getElementById("masjidLng").value = position.coords.longitude.toFixed(6);
    },
    (err) => {
      alert("Failed to get your location.");
      console.error(err);
    }
  );
});

//  Qibla Direction

function getQiblaAngle(lat, lng) {
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;
  
    const phiK = makkahLat * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    const deltaLambda = (makkahLng - lng) * Math.PI / 180;
  
    const y = Math.sin(deltaLambda) * Math.cos(phiK);
    const x =
      Math.cos(phi) * Math.sin(phiK) -
      Math.sin(phi) * Math.cos(phiK) * Math.cos(deltaLambda);
  
    const theta = Math.atan2(y, x);
    const bearing = (theta * 180 / Math.PI + 360) % 360;
  
    return bearing;
  }

// function to draw a Qibla arrow:

  function drawQiblaArrow(fromLat, fromLng) {
    const angle = getQiblaAngle(fromLat, fromLng);
  
    const length = 0.05; // control length of the arrow (in degrees)
    const toLat = fromLat + length * Math.cos(angle * Math.PI / 180);
    const toLng = fromLng + length * Math.sin(angle * Math.PI / 180);
  
    const arrow = L.polyline(
      [
        [fromLat, fromLng],
        [toLat, toLng]
      ],
      {
        color: "green",
        weight: 4,
        dashArray: "5,5",
        className: "qibla-arrow" // 👈 custom class here!
      }
    ).addTo(map);

  // Label popup at the tip of the arrow
  L.popup({
    closeButton: false,
    autoClose: false,
    className: "qibla-label"
  })
    .setLatLng([toLat, toLng])
    .setContent("🧭 Qibla")
    .openOn(map);


    // Triangle pointing to Qibla
// const triangleIcon = L.divIcon({
//     html: "&#9654;", // Unicode triangle ▶
//     className: "qibla-triangle",
//     iconSize: [20, 20],
//     iconAnchor: [10, 10]
//   });
  
//   L.marker([toLat, toLng], { icon: triangleIcon }).addTo(map);
  
  
    return arrow;
  }
  
  
