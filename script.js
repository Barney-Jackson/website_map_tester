// Global variable to hold event data
let eventsData = [];
let map;
let markers = [];


// Helper function to format the date from yyyy/mm/dd to dd/mm/yyyy
function formatDate(isoDate) {
    if (!isoDate || isoDate.trim() === "") return ""; // Handle empty or invalid dates gracefully

    const [year, month, day] = isoDate.split("/");
    return `${day}/${month}/${year}`; // Format: dd/mm/yyyy
}

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Calculate distance between two coordinates using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Load event data from CSV
function loadEventData() {
    Papa.parse("event_table.csv", {
        download: true,
        header: true,
        complete: function(results) {
            eventsData = results.data;
            populateTable(eventsData);
            populateMap(eventsData);
        },
        error: function(error) {
            console.error("Error loading event CSV:", error);
        }
    });
}

// Function to populate the table with grouped event data
function populateTable(data) {
    const tableBody = document.querySelector("table tbody");
    tableBody.innerHTML = "";

    let currentDate = "";

    data.forEach(event => {
        const eventDate = new Date(event.Date); // Parse yyyy/mm/dd directly
        const formattedDate = eventDate.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
        });

        if (formattedDate !== currentDate) {
            currentDate = formattedDate;

            const subheadingRow = document.createElement("tr");
            subheadingRow.classList.add('subheading-row');
            subheadingRow.innerHTML = `
                <td colspan="5" style="text-align: left; font-weight: bold; background-color: #222;">
                    ${currentDate}
                </td>
            `;
            tableBody.appendChild(subheadingRow);
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${event.Event_Title}</td>
            <td>${event.Time}</td>
            <td>${event.Venue}</td>
            <td>${event.Address}</td>
            <td><a href="${event.url}" target="_blank">Link</a></td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: { lat: -37.8136, lng: 144.9631 } // Melbourne as default center
    });
    loadEventData();
}

// Populate the map with markers and custom OverlayView for InfoWindow
function populateMap(data) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Add markers for events
    data.forEach(event => {
        const lat = parseFloat(event.Latitude);
        const lng = parseFloat(event.Longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = new google.maps.Marker({
                position: { lat, lng },
                map,
                title: event.Event_Title || "Untitled Event",
            });

            let customInfoWindow = null;

            // Add a click listener to open a custom InfoWindow
            marker.addListener("click", () => {
                // Close any existing InfoWindow
                if (customInfoWindow) {
                    customInfoWindow.setMap(null);
                    customInfoWindow = null;
                }

                // Create a custom InfoWindow using OverlayView
                class CustomInfoWindow extends google.maps.OverlayView {
                    constructor(position, content) {
                        super();
                        this.position = position;
                        this.content = content;
                    }
                
                    onAdd() {
                        const div = document.createElement("div");
                        div.style.position = "absolute";
                        div.style.backgroundColor = "#000";
                        div.style.color = "#fff";
                        div.style.padding = "10px";
                        div.style.borderRadius = "8px";
                        div.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.6)";
                        div.style.fontSize = "14px";
                        div.style.lineHeight = "1.5";
                        div.style.maxWidth = "200px"; // Maximum width for consistent layout
                        div.style.textAlign = "center";
                
                        // Add content and close button
                        div.innerHTML = `
                            <div style="position: relative;">
                                <div style="position: absolute; top: 0; right: 0; cursor: pointer; color: #fff; font-size: 18px;" id="close-button">
                                    &times;
                                </div>
                                ${this.content}
                            </div>
                        `;
                
                        // Close button listener
                        div.querySelector("#close-button").addEventListener("click", () => {
                            this.setMap(null);
                        });
                
                        this.div = div;
                
                        // Append to overlay pane
                        const panes = this.getPanes();
                        panes.floatPane.appendChild(div);
                    }
                
                    draw() {
                        if (!this.div) return;
                
                        const overlayProjection = this.getProjection();
                        const position = overlayProjection.fromLatLngToDivPixel(this.position);
                
                        // Center the info window above the marker
                        const divWidth = this.div.offsetWidth || 200; // Fallback to max-width
                        const divHeight = this.div.offsetHeight || 0;
                
                        this.div.style.left = `${position.x - divWidth / 2}px`; // Center horizontally
                        this.div.style.top = `${position.y - divHeight - 15}px`; // Adjust above marker with offset
                    }
                
                    onRemove() {
                        if (this.div) {
                            this.div.parentNode.removeChild(this.div);
                            this.div = null;
                        }
                    }
                }
                

                // Create and display the custom InfoWindow
                customInfoWindow = new CustomInfoWindow(
                    marker.getPosition(),
                    `<strong>${event.Event_Title}</strong><br>${event.Address}<br>${event.url
                        ? `<a href="${event.url}" target="_blank" style="color: #1e90ff; text-decoration: none;">Link</a>`
                        : "No Link Available"}`
                );
                customInfoWindow.setMap(map);
            });

            markers.push(marker);
        }
    });
}




function showTab(tabId, contentId) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tab buttons
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show the selected content and mark the tab as active
    document.getElementById(contentId).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    // If the map tab is being shown, trigger a map resize
    if (contentId === 'map-container') {
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
        }, 300); // Delay to ensure visibility changes are applied
    }
}

// Ensure the default tab is displayed
document.getElementById('map-tab').click();


// Filter events by radius
function applyRadiusFilter() {
    const inputAddress = document.getElementById("address").value;
    const radius = parseFloat(document.getElementById("radius").value);

    if (!inputAddress || isNaN(radius)) {
        alert("Please enter a valid address and radius.");
        return;
    }

    geocodeAddress(inputAddress, (userLat, userLon) => {
        const filteredEvents = eventsData.filter(event => {
            if (!isNaN(event.Latitude) && !isNaN(event.Longitude)) {
                const distance = calculateDistance(
                    userLat,
                    userLon,
                    parseFloat(event.Latitude),
                    parseFloat(event.Longitude)
                );
                return distance <= radius;
            }
            return false;
        });

        populateTable(filteredEvents);
        populateMap(filteredEvents); // Update the map with filtered data
    });
}

// Geocode an address to get latitude and longitude
function geocodeAddress(address, callback) {
    const apiKey = "AIzaSyBX9OiBSEsyLVrn86jYrYiKHrBOg7S9bCc";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                callback(location.lat, location.lng);
            } else {
                alert("Unable to find location. Please try another address.");
            }
        })
        .catch(error => {
            console.error("Geocoding error:", error);
            alert("An error occurred while geocoding the address.");
        });
}

// Function to filter events by the selected date range
function applyDateRangeFilter() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
        alert("Please select both a start and an end date.");
        return;
    }

    const start = new Date(startDate); // yyyy/mm/dd is ISO-like, so this works
    const end = new Date(endDate);

    const filteredData = eventsData.filter(event => {
        const eventDate = new Date(event.Date);
        return eventDate >= start && eventDate <= end;
    });

    populateTable(filteredData);
    populateMap(filteredData);
}

function initialize() {
    loadEventData()

}

initialize();
