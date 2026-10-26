const NASA_KEY = "DEMO_KEY";
const LAUNCHES_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10";

const $ = (id) => document.getElementById(id);

// ---------- navigation ----------
document.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".app-section").forEach((s) => s.classList.add("hidden"));
        $(btn.dataset.section).classList.remove("hidden");
        document.querySelectorAll("[data-section]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

// ---------- 1) APOD ----------
const apodMedia = $("apod-media");
const apodInput = $("apod-date");
const today = new Date().toISOString().split("T")[0];
apodInput.max = today;
apodInput.value = today;

async function getApod(date) {
    apodMedia.innerHTML = `
            <div class="loader">
                <div class="spinner-border text-primary" role="status"></div>
                <span>Loading image...</span>
            </div>`;

    try {
        const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&date=${date}`);
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();

        if (data.media_type === "video") {
            apodMedia.innerHTML = `<iframe src="${data.url}" height="480" allowfullscreen></iframe>`;
        } else {
            apodMedia.innerHTML = `<img src="${data.url}" alt="${data.title}" />`;
        }

        const niceDate = formatDate(data.date);
        $("apod-subtitle-date").textContent = niceDate;
        $("apod-date-text").textContent = niceDate;
        $("apod-detail-date").textContent = data.date;
        $("apod-detail-type").textContent = data.media_type;
    } catch (err) {
        apodMedia.innerHTML = `<p class="text-muted-2 m-0">Couldn't load the image, try another date.</p>`;
        console.log(err);
    }
}

$("apod-load-btn").addEventListener("click", () => {
    if (apodInput.value) getApod(apodInput.value);
});

$("apod-today-btn").addEventListener("click", () => {
    apodInput.value = today;
    getApod(today);
});

// ---------- 2) Launches ----------
const fallbackImg = "./images/falcon2520925_image_20221009234147.png";

async function getLaunches() {
    $("launches-loader").classList.remove("hidden");
    try {
        const res = await fetch(LAUNCHES_URL);
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        const launches = data.results;

        $("launches-count").textContent = launches.length;
        showFeatured(launches[0]);
        showLaunchCards(launches.slice(1));
    } catch (err) {
        $("launches-grid").innerHTML = `<p class="text-muted-2">Couldn't load launches right now.</p>`;
        console.log(err);
    } finally {
        $("launches-loader").classList.add("hidden");
    }
}

function showFeatured(launch) {
    const launchDate = new Date(launch.net);
    const daysLeft = Math.ceil((launchDate - new Date()) / (1000 * 60 * 60 * 24));

    $("featured-status").textContent = launch.status?.abbrev || "TBD";
    $("featured-name").textContent = launch.name;
    $("featured-agency").textContent = launch.launch_service_provider?.name || "Unknown";
    $("featured-rocket").textContent = launch.rocket?.configuration?.name || "Unknown";
    $("featured-days").textContent = daysLeft > 0 ? daysLeft : 0;
    $("featured-date").textContent = launchDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    $("featured-time").textContent = launchDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
    $("featured-location").textContent = launch.pad?.location?.name || "Unknown";
    $("featured-country").textContent = launch.pad?.location?.country_code || "Unknown";
    $("featured-description").textContent = launch.mission?.description || "No description available.";
    $("featured-image").src = launch.image || fallbackImg;
}

function showLaunchCards(list) {
    $("launches-grid").innerHTML = list
        .map((l) => {
            const date = new Date(l.net).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            return `
                <div class="col-md-6 col-xl-4">
                    <div class="box launch-card overflow-hidden h-100">
                        <img src="${l.image || fallbackImg}" alt="${l.name}" />
                        <div class="p-3">
                            <span class="status-go">${l.status?.abbrev || "TBD"}</span>
                            <h6 class="fw-bold mt-1">${l.name}</h6>
                            <ul class="list-unstyled text-muted-2 small mb-0">
                                <li class="mb-1"><i class="fa-regular fa-calendar me-2"></i>${date}</li>
                                <li class="mb-1"><i class="fa-solid fa-rocket me-2"></i>${l.rocket?.configuration?.name || "Unknown"}</li>
                                <li><i class="fa-solid fa-location-dot me-2"></i>${l.pad?.location?.name || "Unknown"}</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
        })
        .join("");
}

// ---------- 3) Planets ----------
// the API uses french ids for some planets
const planetIds = {
    Mercury: "mercure",
    Venus: "venus",
    Earth: "terre",
    Mars: "mars",
    Jupiter: "jupiter",
    Saturn: "saturne",
    Uranus: "uranus",
    Neptune: "neptune",
};

const planetDescriptions = {
    Mercury: "The smallest planet and the closest one to the Sun, with extreme temperature swings between day and night.",
    Venus: "The hottest planet in the solar system, wrapped in a thick toxic atmosphere that traps heat.",
    Earth: "Our home planet and the only place we know of that supports life, with liquid water covering most of its surface.",
    Mars: "The red planet, a cold desert world with the tallest volcano in the solar system.",
    Jupiter: "The biggest planet in the solar system, a gas giant famous for its Great Red Spot storm.",
    Saturn: "A gas giant known for its huge and bright ring system made of ice and rock.",
    Uranus: "An ice giant that rotates on its side, giving it very unusual seasons.",
    Neptune: "The farthest planet from the Sun, a cold and windy ice giant with the fastest winds in the solar system.",
};

function sci(obj, valueKey, expKey) {
    if (!obj) return "--";
    return `${obj[valueKey]} × 10<sup>${obj[expKey]}</sup>`;
}

const fix = (v, digits) => (v || v === 0 ? Number(v).toFixed(digits) : "--");

// the API blocks browser requests (CORS), so the data was saved once into planets.json
let planetsCache = null;

async function loadPlanets() {
    if (!planetsCache) {
        const res = await fetch("./planets.json");
        if (!res.ok) throw new Error("Request failed");
        planetsCache = await res.json();
    }
    return planetsCache;
}

async function getPlanet(name) {
    try {
        const all = await loadPlanets();
        const p = all[planetIds[name]];

        $("planet-name").textContent = name;
        $("planet-description").textContent = planetDescriptions[name];
        $("planet-axis").textContent = p.semimajorAxis ? p.semimajorAxis.toLocaleString("en-US") + " km" : "--";
        $("planet-radius").textContent = p.meanRadius ? p.meanRadius.toLocaleString("en-US") + " km" : "--";
        $("planet-mass").innerHTML = sci(p.mass, "massValue", "massExponent") + " kg";
        $("planet-density").textContent = p.density + " g/cm³";
        $("planet-orbit").textContent = p.sideralOrbit + " days";
        $("planet-rotation").textContent = p.sideralRotation + " hours";
        $("planet-moons").textContent = p.moons ? p.moons.length : 0;
        $("planet-gravity").textContent = p.gravity + " m/s²";

        $("planet-discovered-by").textContent = p.discoveredBy || "Known since antiquity";
        $("planet-discovery-date").textContent = p.discoveryDate || "Unknown";
        $("planet-type").textContent = p.bodyType;
        $("planet-volume").innerHTML = sci(p.vol, "volValue", "volExponent") + " km³";

        $("quick-mass").innerHTML = sci(p.mass, "massValue", "massExponent") + " kg";
        $("quick-density").textContent = p.density + " g/cm³";
        $("quick-gravity").textContent = p.gravity + " m/s²";
        $("planet-escape").textContent = p.escape + " m/s";

        // orbital characteristics
        $("planet-perihelion").textContent = fix(p.perihelion / 1e6, 1) + "M km";
        $("planet-aphelion").textContent = fix(p.aphelion / 1e6, 1) + "M km";
        $("planet-eccentricity").textContent = fix(p.eccentricity, 5);
        $("planet-inclination").textContent = fix(p.inclination, 2) + "°";
        $("planet-tilt").textContent = fix(p.axialTilt, 2) + "°";
        // avgTemp comes in kelvin
        $("planet-temp").textContent = p.avgTemp ? Math.round(p.avgTemp - 273.15) + "°C" : "--";
        $("planet-escape-kms").textContent = fix(p.escape / 1000, 2) + " km/s";

        const wikiName = name === "Mercury" ? "Mercury_(planet)" : name;
        $("planet-learn-more").href = `https://en.wikipedia.org/wiki/${wikiName}`;
    } catch (err) {
        console.log(err);
    }
}

document.querySelectorAll(".planet-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const name = btn.querySelector(".small").textContent.trim();
        $("planet-image").src = btn.querySelector("img").src;
        getPlanet(name);
    });
});

// ---------- planets comparison table ----------
const comparisonOrder = ["Uranus", "Neptune", "Jupiter", "Mars", "Mercury", "Saturn", "Earth", "Venus"];

const planetTypes = {
    Mercury: "Terrestrial",
    Venus: "Terrestrial",
    Earth: "Terrestrial",
    Mars: "Terrestrial",
    Jupiter: "Gas Giant",
    Saturn: "Gas Giant",
    Uranus: "Ice Giant",
    Neptune: "Ice Giant",
};

const planetColors = {
    Mercury: "#6b7280",
    Venus: "#fb923c",
    Earth: "#3b82f6",
    Mars: "#ef4444",
    Jupiter: "#fdba74",
    Saturn: "#fde047",
    Uranus: "#22d3ee",
    Neptune: "#2563eb",
};

const AU_KM = 149597870.7;

function formatPeriod(days) {
    return days >= 365 ? (days / 365.25).toFixed(1) + " years" : Math.round(days) + " days";
}

async function showComparison() {
    try {
        const all = await loadPlanets();
        const earth = all[planetIds.Earth];
        const earthMass = earth.mass.massValue * 10 ** earth.mass.massExponent;

        $("comparison-body").innerHTML = comparisonOrder
            .map((name) => {
                const p = all[planetIds[name]];
                const mass = (p.mass.massValue * 10 ** p.mass.massExponent) / earthMass;
                const type = planetTypes[name];

                return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <span class="planet-dot" style="background:${planetColors[name]}"></span>
                            <strong>${name}</strong>
                        </div>
                    </td>
                    <td>${(p.semimajorAxis / AU_KM).toFixed(2)}</td>
                    <td>${Math.round(p.meanRadius * 2).toLocaleString("en-US")}</td>
                    <td>${mass.toFixed(3)}</td>
                    <td>${formatPeriod(p.sideralOrbit)}</td>
                    <td>${p.moons ? p.moons.length : 0}</td>
                    <td><span class="type-badge ${type.toLowerCase().replace(" ", "-")}">${type}</span></td>
                </tr>`;
            })
            .join("");
    } catch (err) {
        console.log(err);
    }
}

// ---------- init ----------
getApod(today);
getLaunches();
getPlanet("Earth");
showComparison();