const API_BASE_URL = "https://breakdown-api.onrender.com";

const map = L.map("map").setView([54.5, -3], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let breakdownMarker = null;
let workshopLayer = L.layerGroup().addTo(map);

document.getElementById("search-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // FIXED: Clean postcode before using it
  let postcode = document.getElementById("postcode").value.trim();
  if (!postcode) return;

  postcode = postcode.replace(/\s+/g, "").toUpperCase();

  try {
    const geoRes = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
    );
    const geoData = await geoRes.json();

    if (geoData.status !== 200) {
      alert("Invalid postcode");
      return;
    }

    const breakdownLat = geoData.result.latitude;
    const breakdownLon = geoData.result.longitude;

    if (breakdownMarker) map.removeLayer(breakdownMarker);

    breakdownMarker = L.marker([breakdownLat, breakdownLon], {
      icon: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    })
      .addTo(map)
      .bindPopup(`Breakdown location: ${postcode}`)
      .openPopup();

    map.setView([breakdownLat, breakdownLon], 10);

    const res = await fetch(
      `${API_BASE_URL}/garages/nearest?postcode=${encodeURIComponent(postcode)}`
    );
    const garages = await res.json();

    workshopLayer.clearLayers();

    garages.forEach((g, index) => {
      const miles = g.distance_km * 0.621371;

      let iconUrl;

      if (index < 20) {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
      } else if (miles <= 30) {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png";
      } else if (miles <= 40) {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
      } else if (miles > 50) {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-white.png";
      } else {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
      }

      const marker = L.marker([g.latitude, g.longitude], {
        icon: L.icon({
          iconUrl,
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      });

      const popupHtml = `
        <strong>${g.name}</strong><br/>
        Distance: ${miles.toFixed(1)} miles<br/>
        Postcode: ${g.postcode}<br/>
        ${g.phone ? `Phone: <a href="tel:${g.phone}">${g.phone}</a><br/>` : ""}
        ${g.email ? `Email: <a href="mailto:${g.email}">${g.email}</a><br/>` : ""}
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(workshopLayer);
    });
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
});
