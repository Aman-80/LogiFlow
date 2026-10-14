"use strict";

/* =========================================
   LOGIFLOW DELIVERIES
   Browser demo - localStorage
========================================= */

const STORAGE_KEY = "logiflow.deliveries.v1";

const DELIVERY_STATUSES = [
    "Pending",
    "Assigned",
    "Picked Up",
    "In Transit",
    "Out for Delivery",
    "Delivered",
    "Delayed",
    "Failed",
    "Returned"
];

const DELIVERY_PRIORITIES = ["Standard", "Express", "Urgent"];

const TRANSPORT_MODES = [
    "Road", "Air", "Rail", "Sea", "Local Courier"
];

const REFUND_STATUSES = [
    "None", "Requested", "Processing", "Refunded"
];

const PHONE_COUNTRIES = {
    IN: { dial: "91", min: 10, max: 10 },
    US: { dial: "1", min: 10, max: 10 },
    CA: { dial: "1", min: 10, max: 10 },
    GB: { dial: "44", min: 10, max: 10 },
    AE: { dial: "971", min: 9, max: 9 },
    SG: { dial: "65", min: 8, max: 8 },
    AU: { dial: "61", min: 9, max: 9 },
    DE: { dial: "49", min: 7, max: 12 },
    FR: { dial: "33", min: 9, max: 9 },
    JP: { dial: "81", min: 9, max: 10 },
    CN: { dial: "86", min: 11, max: 11 },
    SA: { dial: "966", min: 9, max: 9 },
    PK: { dial: "92", min: 10, max: 10 },
    BD: { dial: "880", min: 10, max: 10 },
    NZ: { dial: "64", min: 8, max: 10 },
    NL: { dial: "31", min: 9, max: 9 },
    IT: { dial: "39", min: 9, max: 11 },
    ES: { dial: "34", min: 9, max: 9 },
    ZA: { dial: "27", min: 9, max: 9 },
    BR: { dial: "55", min: 10, max: 11 },
    MX: { dial: "52", min: 10, max: 10 },
    MY: { dial: "60", min: 9, max: 10 },
    ID: { dial: "62", min: 9, max: 12 },
    KR: { dial: "82", min: 9, max: 10 },
    TR: { dial: "90", min: 10, max: 10 },
    TH: { dial: "66", min: 9, max: 9 },
    QA: { dial: "974", min: 8, max: 8 }
};

/*
  Local reference data for common places.
  This is not a complete worldwide address database.
*/

const LOCATION_DATA = {
    IN: {
        states: [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
            "Chhattisgarh", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
            "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
            "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
            "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Delhi", "Chandigarh", "Jammu and Kashmir",
            "Ladakh", "Puducherry", "Andaman and Nicobar Islands",
            "Lakshadweep", "Dadra and Nagar Haveli and Daman and Diu"
        ],
        aliases: {
            "nct of delhi": "Delhi",
            "new delhi": "Delhi",
            "j&k": "Jammu and Kashmir",
            "jammu & kashmir": "Jammu and Kashmir",
            "jammu kashmir": "Jammu and Kashmir",
            "uttaranchal": "Uttarakhand",
            "orissa": "Odisha"
        },
        cities: {
            "gurugram": { name: "Gurugram", state: "Haryana" },
            "gurgaon": { name: "Gurugram", state: "Haryana" },
            "ambala": { name: "Ambala", state: "Haryana" },
            "faridabad": { name: "Faridabad", state: "Haryana" },
            "panipat": { name: "Panipat", state: "Haryana" },
            "karnal": { name: "Karnal", state: "Haryana" },
            "rohtak": { name: "Rohtak", state: "Haryana" },
            "chandigarh": { name: "Chandigarh", state: "Chandigarh" },
            "new delhi": { name: "New Delhi", state: "Delhi" },
            "delhi": { name: "Delhi", state: "Delhi" },
            "jaipur": { name: "Jaipur", state: "Rajasthan" },
            "udaipur": { name: "Udaipur", state: "Rajasthan" },
            "jodhpur": { name: "Jodhpur", state: "Rajasthan" },
            "lucknow": { name: "Lucknow", state: "Uttar Pradesh" },
            "noida": { name: "Noida", state: "Uttar Pradesh" },
            "agra": { name: "Agra", state: "Uttar Pradesh" },
            "kanpur": { name: "Kanpur", state: "Uttar Pradesh" },
            "varanasi": { name: "Varanasi", state: "Uttar Pradesh" },
            "prayagraj": { name: "Prayagraj", state: "Uttar Pradesh" },
            "srinagar": { name: "Srinagar", state: "Jammu and Kashmir" },
            "jammu": { name: "Jammu", state: "Jammu and Kashmir" },
            "kashmir": { name: "Kashmir", state: "Jammu and Kashmir" },
            "ludhiana": { name: "Ludhiana", state: "Punjab" },
            "amritsar": { name: "Amritsar", state: "Punjab" },
            "jalandhar": { name: "Jalandhar", state: "Punjab" },
            "mohali": { name: "Mohali", state: "Punjab" },
            "pune": { name: "Pune", state: "Maharashtra" },
            "mumbai": { name: "Mumbai", state: "Maharashtra" },
            "nagpur": { name: "Nagpur", state: "Maharashtra" },
            "bengaluru": { name: "Bengaluru", state: "Karnataka" },
            "bangalore": { name: "Bengaluru", state: "Karnataka" },
            "mysuru": { name: "Mysuru", state: "Karnataka" },
            "chennai": { name: "Chennai", state: "Tamil Nadu" },
            "coimbatore": { name: "Coimbatore", state: "Tamil Nadu" },
            "hyderabad": { name: "Hyderabad", state: "Telangana" },
            "kolkata": { name: "Kolkata", state: "West Bengal" },
            "ahmedabad": { name: "Ahmedabad", state: "Gujarat" },
            "surat": { name: "Surat", state: "Gujarat" },
            "vadodara": { name: "Vadodara", state: "Gujarat" },
            "kochi": { name: "Kochi", state: "Kerala" },
            "thiruvananthapuram": {
                name: "Thiruvananthapuram",
                state: "Kerala"
            },
            "bhopal": { name: "Bhopal", state: "Madhya Pradesh" },
            "indore": { name: "Indore", state: "Madhya Pradesh" },
            "patna": { name: "Patna", state: "Bihar" },
            "ranchi": { name: "Ranchi", state: "Jharkhand" },
            "dehradun": { name: "Dehradun", state: "Uttarakhand" },
            "shimla": { name: "Shimla", state: "Himachal Pradesh" },
            "guwahati": { name: "Guwahati", state: "Assam" },
            "bhubaneswar": { name: "Bhubaneswar", state: "Odisha" }
        }
    },

    US: {
        states: [
            "Alabama", "Alaska", "Arizona", "Arkansas", "California",
            "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
            "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
            "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
            "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
            "Nebraska", "Nevada", "New Hampshire", "New Jersey",
            "New Mexico", "New York", "North Carolina", "North Dakota",
            "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
            "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
            "Vermont", "Virginia", "Washington", "West Virginia",
            "Wisconsin", "Wyoming", "District of Columbia"
        ],
        aliases: {
            "dc": "District of Columbia",
            "washington dc": "District of Columbia"
        },
        cities: {
            "new york": { name: "New York", state: "New York" },
            "los angeles": { name: "Los Angeles", state: "California" },
            "san francisco": { name: "San Francisco", state: "California" },
            "chicago": { name: "Chicago", state: "Illinois" },
            "houston": { name: "Houston", state: "Texas" },
            "dallas": { name: "Dallas", state: "Texas" },
            "austin": { name: "Austin", state: "Texas" },
            "miami": { name: "Miami", state: "Florida" },
            "seattle": { name: "Seattle", state: "Washington" },
            "boston": { name: "Boston", state: "Massachusetts" },
            "washington": {
                name: "Washington",
                state: "District of Columbia"
            },
            "las vegas": { name: "Las Vegas", state: "Nevada" },
            "phoenix": { name: "Phoenix", state: "Arizona" }
        }
    },

    CA: {
        states: [
            "Alberta", "British Columbia", "Manitoba", "New Brunswick",
            "Newfoundland and Labrador", "Nova Scotia", "Ontario",
            "Prince Edward Island", "Quebec", "Saskatchewan",
            "Northwest Territories", "Nunavut", "Yukon"
        ],
        aliases: {
            "québec": "Quebec"
        },
        cities: {
            "toronto": { name: "Toronto", state: "Ontario" },
            "ottawa": { name: "Ottawa", state: "Ontario" },
            "vancouver": { name: "Vancouver", state: "British Columbia" },
            "calgary": { name: "Calgary", state: "Alberta" },
            "edmonton": { name: "Edmonton", state: "Alberta" },
            "montreal": { name: "Montreal", state: "Quebec" },
            "winnipeg": { name: "Winnipeg", state: "Manitoba" },
            "halifax": { name: "Halifax", state: "Nova Scotia" }
        }
    },

    GB: {
        states: ["England", "Scotland", "Wales", "Northern Ireland"],
        aliases: {
            "northern ireland": "Northern Ireland"
        },
        cities: {
            "london": { name: "London", state: "England" },
            "manchester": { name: "Manchester", state: "England" },
            "birmingham": { name: "Birmingham", state: "England" },
            "liverpool": { name: "Liverpool", state: "England" },
            "leeds": { name: "Leeds", state: "England" },
            "bristol": { name: "Bristol", state: "England" },
            "edinburgh": { name: "Edinburgh", state: "Scotland" },
            "glasgow": { name: "Glasgow", state: "Scotland" },
            "cardiff": { name: "Cardiff", state: "Wales" },
            "belfast": { name: "Belfast", state: "Northern Ireland" }
        }
    },

    AU: {
        states: [
            "New South Wales", "Victoria", "Queensland",
            "Western Australia", "South Australia", "Tasmania",
            "Northern Territory", "Australian Capital Territory"
        ],
        aliases: { "act": "Australian Capital Territory" },
        cities: {
            "sydney": { name: "Sydney", state: "New South Wales" },
            "melbourne": { name: "Melbourne", state: "Victoria" },
            "brisbane": { name: "Brisbane", state: "Queensland" },
            "perth": { name: "Perth", state: "Western Australia" },
            "adelaide": { name: "Adelaide", state: "South Australia" },
            "canberra": {
                name: "Canberra",
                state: "Australian Capital Territory"
            },
            "hobart": { name: "Hobart", state: "Tasmania" },
            "darwin": { name: "Darwin", state: "Northern Territory" }
        }
    },

    AE: {
        states: [
            "Abu Dhabi", "Dubai", "Sharjah", "Ajman",
            "Umm Al Quwain", "Fujairah", "Ras Al Khaimah"
        ],
        aliases: {},
        cities: {
            "abu dhabi": { name: "Abu Dhabi", state: "Abu Dhabi" },
            "dubai": { name: "Dubai", state: "Dubai" },
            "sharjah": { name: "Sharjah", state: "Sharjah" },
            "ajman": { name: "Ajman", state: "Ajman" }
        }
    }
};


/* =========================================
   APPLICATION STATE
========================================= */

let deliveries = [];
let selectedDeliveryId = null;
let editingDeliveryId = null;
let pendingDeliveredEvent = null;
let activeOverviewFilter = null;
let storageWriteLocked = false;


/* =========================================
   DOM REFERENCES
========================================= */

const $ = id => document.getElementById(id);

const deliveryForm = $("delivery-form");
const deliveryModal = $("delivery-modal");
const deliveryDetailsModal = $("delivery-details-modal");
const deliveryStatusModal = $("delivery-status-modal");
const proofOfDeliveryModal = $("proof-of-delivery-modal");

const deliveryTableBody = $("delivery-table-body");
const deliverySearch = $("delivery-search");
const deliveryStatusFilter = $("delivery-status-filter");
const deliveryPriorityFilter = $("delivery-priority-filter");

const deliveryFormError = $("delivery-form-error");
const deliveryStatusError = $("delivery-status-error");
const podFormError = $("pod-form-error");

const allModals = [
    deliveryModal,
    deliveryDetailsModal,
    deliveryStatusModal,
    proofOfDeliveryModal
];

const GROUP_LABELS = {
    pending: "Pending Assignment",
    transit: "In Transit",
    out: "Out for Delivery",
    failed: "Failed / Returned",
    refund: "Refunds Pending"
};


/* =========================================
   BASIC HELPERS
========================================= */

function nowISO() {
    return new Date().toISOString();
}

function hoursAgo(hours) {
    return new Date(Date.now() - hours * 3600000).toISOString();
}

function hoursFromNow(hours) {
    return new Date(Date.now() + hours * 3600000).toISOString();
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateTimeValue(value) {
    const date = parseDate(value);
    if (!date) return "";

    const pad = number => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
        `${pad(date.getDate())}T${pad(date.getHours())}:` +
        pad(date.getMinutes());
}

function formatDateTime(value) {
    const date = parseDate(value);
    if (!date) return "Not available";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDate(value) {
    const date = parseDate(value);
    if (!date) return "Not available";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function generateId() {
    if (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function") {
        return `dlv_${crypto.randomUUID()}`;
    }

    return `dlv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
}

function getStatusClass(status) {
    return String(status || "Pending").toLowerCase().replace(/\s+/g, "-");
}

function getPriorityClass(priority) {
    return String(priority || "Standard").toLowerCase();
}

function createEvent({
    type = "status",
    status = "",
    title = "",
    time = nowISO(),
    location = "",
    reason = "",
    actor = "LogiFlow Admin"
}) {
    return {
        id: generateId(),
        type,
        status,
        title,
        time,
        location,
        reason,
        actor
    };
}

function findDelivery(id) {
    return deliveries.find(delivery => delivery.id === id);
}


/* =========================================
   PHONE HELPERS
========================================= */

function normalizeNationalPhone(value, country) {
    let digits = String(value ?? "").replace(/\D/g, "");

    // Most countries use a leading 0 for domestic calls.
    // Country code is selected separately in the form.
    if (country !== "IN" && digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    return digits;
}

function validatePhone(value, country, existingValue = null) {
    const raw = String(value ?? "").trim();

    if (!raw) return "";

    // Keep old masked demo data editable until the user changes that field.
    if (
        /[xX*]/.test(raw) &&
        existingValue !== null &&
        raw === existingValue
    ) {
        return "";
    }

    if (raw.startsWith("+")) {
        return "Select the country code from the dropdown and enter only the national phone number.";
    }

    const compact = raw.replace(/[\s().-]/g, "");

    if (!/^\d+$/.test(compact)) {
        return "Phone number must contain digits only. Remove letters and country-code symbols.";
    }

    const config = PHONE_COUNTRIES[country];

    if (!config) {
        return "Select a supported phone country code.";
    }

    const digits = normalizeNationalPhone(compact, country);

    if (digits.length < config.min || digits.length > config.max) {
        if (config.min === config.max) {
            return `This country's number should contain ${config.min} digits after the country code.`;
        }

        return `This country's number should contain ${config.min}–${config.max} digits after the country code.`;
    }

    return "";
}

function formatPhone(value, country) {
    if (!value) return "Not provided";

    const config = PHONE_COUNTRIES[country] || PHONE_COUNTRIES.IN;
    const text = String(value).trim();

    if (/[xX*]/.test(text)) {
        return `+${config.dial} ${text}`;
    }

    const digits = normalizeNationalPhone(text, country);

    return digits ? `+${config.dial} ${digits}` : "Not provided";
}


/* =========================================
   LOCATION SUGGESTIONS AND VALIDATION
========================================= */

function getLocationConfig(country) {
    return LOCATION_DATA[country] || null;
}

function canonicalRegion(country, value) {
    const config = getLocationConfig(country);
    if (!config) return null;

    const entered = normalizeText(value);
    if (!entered) return null;

    const alias = config.aliases?.[entered];

    if (alias) return alias;

    return config.states.find(state =>
        normalizeText(state) === entered
    ) || null;
}

function canonicalCity(country, value) {
    const config = getLocationConfig(country);
    if (!config) return null;

    return config.cities[normalizeText(value)] || null;
}

function fillDatalist(listId, values) {
    const datalist = $(listId);
    datalist.replaceChildren();

    [...new Set(values)].sort().forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        datalist.appendChild(option);
    });
}

function refreshLocationSuggestions() {
    const country = $("delivery-country").value;
    const config = getLocationConfig(country);

    if (!config) {
        fillDatalist("delivery-state-options", []);
        fillDatalist("delivery-city-options", []);
        return;
    }

    fillDatalist("delivery-state-options", config.states);

    const enteredState = $("delivery-state").value;
    const selectedRegion = canonicalRegion(country, enteredState);

    let cities = Object.values(config.cities);

    if (selectedRegion) {
        cities = cities.filter(city => city.state === selectedRegion);
    }

    fillDatalist(
        "delivery-city-options",
        cities.map(city => city.name)
    );
}

function validateAddress(data) {
    const config = getLocationConfig(data.destinationCountry);

    if (!config) {
        return {
            error: "",
            warning: "This country does not have local reference data. Verify the address carefully before saving."
        };
    }

    const region = canonicalRegion(data.destinationCountry, data.state);
    const city = canonicalCity(data.destinationCountry, data.city);

    if (city && region && city.state !== region) {
        return {
            error:
                `"${city.name}" is listed in "${city.state}", not "${region}". ` +
                "Please correct the city or state/region."
        };
    }

    if (city && !region) {
        return {
            error:
                `The state/region "${data.state}" does not match the known ` +
                `region "${city.state}" for ${city.name}.`
        };
    }

    if (!region && config.states.length > 0) {
        return {
            error: "",
            warning:
                `"${data.state}" is not in this country's local region suggestions. ` +
                "Confirm the spelling and country. Continue only if the address is correct."
        };
    }

    if (!city) {
        return {
            error: "",
            warning:
                `"${data.city}" could not be verified in the built-in city list. ` +
                "The list is not exhaustive. Confirm that the city and address are correct."
        };
    }

    return { error: "", warning: "" };
}

function normalizeAddressValues(data) {
    const config = getLocationConfig(data.destinationCountry);
    if (!config) return data;

    const region = canonicalRegion(data.destinationCountry, data.state);
    const city = canonicalCity(data.destinationCountry, data.city);

    if (region) data.state = region;
    if (city) data.city = city.name;

    return data;
}

function validatePostalCode(country, postalCode) {
    const postal = String(postalCode ?? "").trim();
    if (!postal) return "";

    let valid = true;

    if (country === "IN") {
        valid = /^\d{6}$/.test(postal);
    } else if (country === "US") {
        valid = /^\d{5}(?:-\d{4})?$/.test(postal);
    } else if (country === "CA") {
        valid = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postal);
    } else if (country === "GB") {
        valid = /^[A-Za-z0-9 ]{5,8}$/.test(postal);
    } else {
        valid = /^[A-Za-z0-9 -]{3,12}$/.test(postal);
    }

    return valid
        ? ""
        : country === "IN"
            ? "Indian postal codes should contain 6 digits."
            : country === "US"
                ? "Enter a valid US ZIP code (5 digits or ZIP+4)."
                : country === "CA"
                    ? "Enter a valid Canadian postal code, for example M5V 2T6."
                    : country === "GB"
                        ? "Check the postal code format."
                        : "Postal code contains an invalid format.";
}


/* =========================================
   STORAGE AND SAMPLE DATA
========================================= */

function isValidHistoryEvent(item) {
    return item &&
        typeof item.id === "string" &&
        typeof item.time === "string" &&
        Boolean(parseDate(item.time));
}

function normalizeDelivery(item) {
    const now = nowISO();

    const history = Array.isArray(item.history)
        ? item.history
        : [];

    return {
        ...item,
        destinationCountry:
            item.destinationCountry && $( "delivery-country" )
                ? item.destinationCountry
                : "IN",
        recipientPhoneCountry: PHONE_COUNTRIES[item.recipientPhoneCountry]
            ? item.recipientPhoneCountry : "IN",
        driverPhoneCountry: PHONE_COUNTRIES[item.driverPhoneCountry]
            ? item.driverPhoneCountry : "IN",
        recipientPhone: item.recipientPhone || "",
        driverPhone: item.driverPhone || "",
        sourceWarehouse: item.sourceWarehouse || "",
        driverName: item.driverName || "",
        vehicleNumber: item.vehicleNumber || "",
        carrierName: item.carrierName || "",
        notes: item.notes || "",
        postalCode: item.postalCode || "",
        refundStatus: REFUND_STATUSES.includes(item.refundStatus)
            ? item.refundStatus : "None",
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || item.createdAt || now,
        estimatedDelivery: parseDate(item.estimatedDelivery)
            ? new Date(item.estimatedDelivery).toISOString()
            : hoursFromNow(24),
        history: history.map(entry => ({
            id: entry.id || generateId(),
            type: entry.type || "status",
            status: entry.status || item.status || "Pending",
            title: entry.title || entry.status || "Delivery event",
            time: parseDate(entry.time)
                ? new Date(entry.time).toISOString() : now,
            location: entry.location || "",
            reason: entry.reason || "",
            actor: entry.actor || "LogiFlow Admin"
        })),
        pod: item.pod || null
    };
}

function makeSample({
    id, trackingId, orderReference, priority, recipientName,
    recipientPhone, city, state, address, driverName, driverPhone,
    vehicleNumber, estimatedDelivery, status, hours, refundStatus = "None"
}) {
    const createdAt = hoursAgo(hours);
    const initialEvent = createEvent({
        type: "created",
        status: "Pending",
        title: "Delivery created",
        time: createdAt,
        location: "Warehouse",
        reason: "Sample delivery record created."
    });

    const history = [initialEvent];

    if (status !== "Pending") {
        history.push(createEvent({
            status,
            title: `${status} status recorded`,
            time: hoursAgo(Math.max(0.5, hours / 2)),
            location: city,
            reason: `Sample status: ${status}.`
        }));
    }

    return {
        id,
        trackingId,
        orderReference,
        priority,
        transportMode: "Road",
        sourceWarehouse: "WH-GGN-01",
        recipientName,
        recipientPhone,
        recipientPhoneCountry: "IN",
        driverName: driverName || "",
        driverPhone: driverPhone || "",
        driverPhoneCountry: "IN",
        vehicleNumber: vehicleNumber || "",
        carrierName: "LogiFlow Fleet",
        destinationCountry: "IN",
        city,
        state,
        postalCode: "",
        address,
        estimatedDelivery,
        notes: "",
        status,
        refundStatus,
        createdAt,
        updatedAt: nowISO(),
        history,
        pod: null
    };
}

function buildSampleDeliveries() {
    return [
        makeSample({
            id: "dlv_001",
            trackingId: "LF-DLV-1001",
            orderReference: "ORD-2026-1001",
            priority: "Express",
            recipientName: "Rahul Sharma",
            recipientPhone: "9876543210",
            city: "Chandigarh",
            state: "Chandigarh",
            address: "Industrial Area Phase I, Chandigarh",
            driverName: "Amit Kumar",
            driverPhone: "9876543234",
            vehicleNumber: "HR26AB1234",
            estimatedDelivery: hoursFromNow(3),
            status: "Out for Delivery",
            hours: 18
        }),
        makeSample({
            id: "dlv_002",
            trackingId: "LF-DLV-1002",
            orderReference: "ORD-2026-1002",
            priority: "Urgent",
            recipientName: "Priya Verma",
            recipientPhone: "9876543245",
            city: "New Delhi",
            state: "Delhi",
            address: "Connaught Place, New Delhi",
            driverName: "Rohit Singh",
            driverPhone: "9876543265",
            vehicleNumber: "HR55CD5678",
            estimatedDelivery: hoursFromNow(8),
            status: "In Transit",
            hours: 20
        }),
        makeSample({
            id: "dlv_003",
            trackingId: "LF-DLV-1003",
            orderReference: "ORD-2026-1003",
            priority: "Standard",
            recipientName: "Arjun Mehta",
            recipientPhone: "9876543212",
            city: "Jaipur",
            state: "Rajasthan",
            address: "Vaishali Nagar, Jaipur",
            driverName: "Sandeep Yadav",
            driverPhone: "9876543222",
            vehicleNumber: "DL1LAA4567",
            estimatedDelivery: hoursFromNow(20),
            status: "Pending",
            hours: 14
        }),
        makeSample({
            id: "dlv_004",
            trackingId: "LF-DLV-1004",
            orderReference: "ORD-2026-1004",
            priority: "Express",
            recipientName: "Neha Gupta",
            recipientPhone: "9876543256",
            city: "Lucknow",
            state: "Uttar Pradesh",
            address: "Gomti Nagar, Lucknow",
            driverName: "Vikas Rana",
            driverPhone: "9876543257",
            vehicleNumber: "UP32EF9012",
            estimatedDelivery: hoursAgo(3),
            status: "Delayed",
            hours: 30,
            refundStatus: "Requested"
        }),
        makeSample({
            id: "dlv_005",
            trackingId: "LF-DLV-1005",
            orderReference: "ORD-2026-1005",
            priority: "Standard",
            recipientName: "Karan Malhotra",
            recipientPhone: "9876543288",
            city: "Jaipur",
            state: "Rajasthan",
            address: "Malviya Nagar, Jaipur",
            driverName: "",
            driverPhone: "",
            vehicleNumber: "",
            estimatedDelivery: hoursFromNow(48),
            status: "Pending",
            hours: 2,
            refundStatus: "Processing"
        })
    ];
}

function validateStoredDelivery(item) {
    return item &&
        typeof item.id === "string" &&
        typeof item.trackingId === "string" &&
        typeof item.orderReference === "string" &&
        typeof item.recipientName === "string" &&
        typeof item.city === "string" &&
        typeof item.state === "string" &&
        typeof item.address === "string" &&
        DELIVERY_STATUSES.includes(item.status) &&
        DELIVERY_PRIORITIES.includes(item.priority) &&
        TRANSPORT_MODES.includes(item.transportMode) &&
        Boolean(parseDate(item.estimatedDelivery)) &&
        (item.history === undefined || Array.isArray(item.history));
}

function loadDeliveries() {
    let raw;

    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error("Delivery storage unavailable:", error);
        storageWriteLocked = true;
        alert("Browser storage is unavailable. Saving has been disabled.");
        return buildSampleDeliveries();
    }

    if (raw === null) {
        const samples = buildSampleDeliveries();

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
        } catch (error) {
            console.error("Could not initialize demo data:", error);
            storageWriteLocked = true;
            alert("Demo data loaded, but browser storage could not save it.");
        }

        return samples;
    }

    try {
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed) || !parsed.every(validateStoredDelivery)) {
            throw new Error("Saved delivery records have an invalid structure.");
        }

        const normalized = parsed.map(normalizeDelivery);

        // Migrate old browser data to the new optional fields.
        if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            } catch (error) {
                console.error("Could not migrate existing records:", error);
            }
        }

        return normalized;
    } catch (error) {
        console.error("Could not safely read delivery data:", error);
        storageWriteLocked = true;
        alert(
            "Saved delivery data could not be validated. " +
            "It has not been overwritten; saving is disabled for safety."
        );

        return [];
    }
}

function saveDeliveries(nextRecords) {
    if (storageWriteLocked) {
        alert(
            "Saving is disabled because existing storage could not be verified. " +
            "Resolve the browser storage issue before editing records."
        );
        return false;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
        deliveries = nextRecords;
        return true;
    } catch (error) {
        console.error("Could not save delivery records:", error);
        alert(
            "Changes could not be saved in browser storage. " +
            "Check available storage and try again."
        );
        return false;
    }
}


/* =========================================
   STATUS CALCULATIONS
========================================= */

function isOverdue(delivery) {
    const expected = parseDate(delivery.estimatedDelivery);

    if (!expected) return false;

    if (["Delivered", "Failed", "Returned"].includes(delivery.status)) {
        return false;
    }

    return expected.getTime() < Date.now();
}

function isRefundPending(delivery) {
    return ["Requested", "Processing"].includes(delivery.refundStatus);
}

function getGroupMatch(delivery, group) {
    switch (group) {
        case "pending":
            return delivery.status === "Pending";

        case "transit":
            return ["Picked Up", "In Transit"].includes(delivery.status);

        case "out":
            return delivery.status === "Out for Delivery";

        case "failed":
            return ["Failed", "Returned"].includes(delivery.status);

        case "refund":
            return isRefundPending(delivery);

        default:
            return true;
    }
}


/* =========================================
   STATISTICS
========================================= */

function setProgress(id, count, total) {
    const bar = $(id);
    const percent = total > 0 ? Math.min(100, count / total * 100) : 0;
    bar.style.width = `${percent}%`;
}

function renderStatistics() {
    const total = deliveries.length;

    const pending = deliveries.filter(item =>
        item.status === "Pending"
    ).length;

    const transit = deliveries.filter(item =>
        ["Picked Up", "In Transit"].includes(item.status)
    ).length;

    const out = deliveries.filter(item =>
        item.status === "Out for Delivery"
    ).length;

    const failed = deliveries.filter(item =>
        ["Failed", "Returned"].includes(item.status)
    ).length;

    const delivered = deliveries.filter(item =>
        item.status === "Delivered"
    ).length;

    const inProgress = deliveries.filter(item =>
        ["Assigned", "Picked Up", "In Transit",
            "Out for Delivery", "Delayed"].includes(item.status)
    ).length;

    const delayed = deliveries.filter(item =>
        item.status === "Delayed" || isOverdue(item)
    ).length;

    const refunds = deliveries.filter(isRefundPending).length;

    $("total-deliveries").textContent = formatNumber(total);
    $("in-progress-deliveries").textContent = formatNumber(inProgress);
    $("completed-deliveries").textContent = formatNumber(delivered);
    $("delayed-deliveries").textContent = formatNumber(delayed);

    $("pending-count").textContent = formatNumber(pending);
    $("transit-count").textContent = formatNumber(transit);
    $("out-for-delivery-count").textContent = formatNumber(out);
    $("failed-count").textContent = formatNumber(failed);
    $("refund-count").textContent = formatNumber(refunds);

    setProgress("pending-progress", pending, total);
    setProgress("transit-progress", transit, total);
    setProgress("out-for-delivery-progress", out, total);
    setProgress("failed-progress", failed, total);
    setProgress("refund-progress", refunds, total);
}


/* =========================================
   CLICKABLE STATISTICS FILTERS
========================================= */

function updateOverviewFilterUI() {
    document.querySelectorAll(".overview-filter").forEach(card => {
        const selected = card.dataset.deliveryGroup === activeOverviewFilter;

        card.classList.toggle("is-selected", selected);
        card.setAttribute("aria-pressed", String(selected));
    });

    const banner = $("overview-filter-banner");
    banner.hidden = !activeOverviewFilter;

    $("delivery-list-title").textContent = activeOverviewFilter
        ? GROUP_LABELS[activeOverviewFilter]
        : "Delivery Records";

    if (activeOverviewFilter) {
        $("overview-filter-label").textContent =
            `Showing: ${GROUP_LABELS[activeOverviewFilter]}`;
    }
}

function setOverviewFilter(group) {
    activeOverviewFilter = activeOverviewFilter === group ? null : group;

    // Avoid a conflicting status dropdown filter.
    deliveryStatusFilter.value = "all";

    updateOverviewFilterUI();
    renderDeliveryTable();

    if (activeOverviewFilter) {
        $("delivery-list-title").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

document.querySelectorAll(".overview-filter").forEach(card => {
    card.addEventListener("click", () => {
        setOverviewFilter(card.dataset.deliveryGroup);
    });

    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOverviewFilter(card.dataset.deliveryGroup);
        }
    });
});

$("clear-overview-filter").addEventListener("click", () => {
    activeOverviewFilter = null;
    updateOverviewFilterUI();
    renderDeliveryTable();
});


/* =========================================
   SEARCH AND FILTERS
========================================= */

function getFilteredDeliveries() {
    const query = $("delivery-search").value.trim().toLowerCase();
    const status = deliveryStatusFilter.value;
    const priority = deliveryPriorityFilter.value;

    return deliveries.filter(delivery => {
        const searchableText = [
            delivery.trackingId,
            delivery.orderReference,
            delivery.recipientName,
            formatPhone(delivery.recipientPhone, delivery.recipientPhoneCountry),
            delivery.city,
            delivery.state,
            delivery.destinationCountry,
            delivery.address,
            delivery.postalCode,
            delivery.driverName,
            formatPhone(delivery.driverPhone, delivery.driverPhoneCountry),
            delivery.vehicleNumber,
            delivery.carrierName,
            delivery.sourceWarehouse,
            delivery.status,
            delivery.transportMode,
            delivery.refundStatus
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(query);
        const matchesStatus = status === "all" || delivery.status === status;
        const matchesPriority = priority === "all" || delivery.priority === priority;
        const matchesGroup = !activeOverviewFilter ||
            getGroupMatch(delivery, activeOverviewFilter);

        return matchesSearch && matchesStatus && matchesPriority && matchesGroup;
    });
}


/* =========================================
   TABLE RENDERING
========================================= */

function renderDeliveryTable() {
    const filtered = getFilteredDeliveries();

    $("delivery-record-count").textContent =
        `${filtered.length} ${filtered.length === 1 ? "delivery" : "deliveries"}`;

    if (activeOverviewFilter) {
        $("overview-filter-label").textContent =
            `Showing: ${GROUP_LABELS[activeOverviewFilter]} (${filtered.length})`;
    }

    if (filtered.length === 0) {
        deliveryTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    No matching deliveries. Try different filters or clear the selection.
                </td>
            </tr>`;
        return;
    }

    deliveryTableBody.innerHTML = filtered.map(delivery => {
        const overdue = isOverdue(delivery);

        const driver = delivery.driverName || "Not assigned";
        const vehicle = delivery.vehicleNumber || "No vehicle assigned";
        const recipientPhone = formatPhone(
            delivery.recipientPhone,
            delivery.recipientPhoneCountry
        );

        const podButton = delivery.pod
            ? ""
            : `<button type="button" class="action-btn"
                   data-action="pod" data-id="${escapeHTML(delivery.id)}">POD</button>`;

        return `
            <tr>
                <td>
                    <div class="delivery-identity">
                        <div class="delivery-avatar" aria-hidden="true">➜</div>
                        <div>
                            <strong>${escapeHTML(delivery.trackingId)}</strong>
                            <small>${escapeHTML(delivery.orderReference)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="recipient-cell">
                        <strong>${escapeHTML(delivery.recipientName)}</strong>
                        <small>${escapeHTML(recipientPhone)}</small>
                    </div>
                </td>
                <td>
                    <div class="destination-cell">
                        <strong>${escapeHTML(delivery.city)}, ${escapeHTML(delivery.state)}</strong>
                        <small>${escapeHTML(delivery.destinationCountry || "IN")}${delivery.postalCode
                            ? " · " + escapeHTML(delivery.postalCode) : ""}</small>
                    </div>
                </td>
                <td>
                    <div class="driver-cell">
                        <strong>${escapeHTML(driver)}</strong>
                        <small>${escapeHTML(vehicle)}</small>
                    </div>
                </td>
                <td>
                    <div class="eta-cell ${overdue ? "overdue" : ""}">
                        <strong>${escapeHTML(formatDate(delivery.estimatedDelivery))}</strong>
                        <small>${escapeHTML(formatDateTime(delivery.estimatedDelivery))}</small>
                        <small>${overdue ? "Past estimated time" : "On schedule"}</small>
                    </div>
                </td>
                <td>
                    <span class="priority-badge ${getPriorityClass(delivery.priority)}">
                        ${escapeHTML(delivery.priority)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${getStatusClass(delivery.status)}">
                        ${escapeHTML(delivery.status)}
                    </span>
                    ${isRefundPending(delivery)
                        ? `<small class="refund-label">Refund: ${escapeHTML(delivery.refundStatus)}</small>`
                        : ""}
                </td>
                <td>
                    <div class="action-group">
                        <button type="button" class="action-btn" data-action="view"
                            data-id="${escapeHTML(delivery.id)}">View</button>
                        <button type="button" class="action-btn" data-action="edit"
                            data-id="${escapeHTML(delivery.id)}">Edit</button>
                        <button type="button" class="action-btn" data-action="status"
                            data-id="${escapeHTML(delivery.id)}"
                            ${delivery.status === "Delivered" ? "disabled title='Already delivered'" : ""}>Status</button>
                        ${podButton}
                        <button type="button" class="action-btn danger" data-action="delete"
                            data-id="${escapeHTML(delivery.id)}">Delete</button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

function renderPage() {
    renderStatistics();
    updateOverviewFilterUI();
    renderDeliveryTable();
}


/* =========================================
   MODAL UTILITIES
========================================= */

function syncBodyScroll() {
    document.body.style.overflow =
        allModals.some(modal => !modal.hidden) ? "hidden" : "";
}

function openModal(modal) {
    modal.hidden = false;
    syncBodyScroll();
}

function closeModal(modal) {
    modal.hidden = true;
    syncBodyScroll();
}

function showFormError(element, message) {
    element.textContent = message;
    element.hidden = false;
}

function clearFormError(element) {
    element.textContent = "";
    element.hidden = true;
}


/* =========================================
   FORM CONFIGURATION
========================================= */

function configureFormStatus(delivery) {
    const select = $("delivery-status");
    const label = document.querySelector('label[for="delivery-status"]');

    if (delivery) {
        select.innerHTML = `<option value="${escapeHTML(delivery.status)}">${escapeHTML(delivery.status)}</option>`;
        select.value = delivery.status;
        select.disabled = true;
        label.textContent = "Current Status (update separately) *";
    } else {
        select.innerHTML = `
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>`;
        select.value = "Pending";
        select.disabled = false;
        label.textContent = "Initial Status *";
    }
}

const FORM_FIELDS = {
    "tracking-id": "trackingId",
    "order-reference": "orderReference",
    "delivery-priority": "priority",
    "transport-mode": "transportMode",
    "source-warehouse": "sourceWarehouse",
    "recipient-name": "recipientName",
    "recipient-phone": "recipientPhone",
    "recipient-phone-country": "recipientPhoneCountry",
    "delivery-country": "destinationCountry",
    "delivery-city": "city",
    "delivery-state": "state",
    "delivery-postal-code": "postalCode",
    "delivery-address": "address",
    "driver-name": "driverName",
    "driver-phone": "driverPhone",
    "driver-phone-country": "driverPhoneCountry",
    "vehicle-number": "vehicleNumber",
    "carrier-name": "carrierName",
    "refund-status": "refundStatus",
    "delivery-notes": "notes"
};

function openDeliveryModal(delivery = null) {
    deliveryForm.reset();
    clearFormError(deliveryFormError);

    editingDeliveryId = delivery ? delivery.id : null;

    $("delivery-modal-title").textContent =
        delivery ? "Edit Delivery" : "Create Delivery";

    $("save-delivery").textContent =
        delivery ? "Update Delivery" : "Save Delivery";

    $("delivery-id").value = delivery ? delivery.id : "";

    configureFormStatus(delivery);

    $("delivery-created-at").value = delivery
        ? formatDateTime(delivery.createdAt)
        : formatDateTime(nowISO());

    if (delivery) {
        Object.entries(FORM_FIELDS).forEach(([elementId, property]) => {
            const input = $(elementId);
            if (input) input.value = delivery[property] ?? "";
        });
    } else {
        $("delivery-country").value = "IN";
        $("recipient-phone-country").value = "IN";
        $("driver-phone-country").value = "IN";
        $("refund-status").value = "None";
    }

    $("estimated-delivery").value = delivery
        ? toLocalDateTimeValue(delivery.estimatedDelivery)
        : toLocalDateTimeValue(hoursFromNow(24));

    refreshLocationSuggestions();
    openModal(deliveryModal);
    $("tracking-id").focus();
}

function closeDeliveryModal() {
    closeModal(deliveryModal);
    deliveryForm.reset();
    clearFormError(deliveryFormError);
    editingDeliveryId = null;
    configureFormStatus(null);
    refreshLocationSuggestions();
}

function getDeliveryFormValues() {
    const values = {};

    Object.entries(FORM_FIELDS).forEach(([elementId, property]) => {
        values[property] = $(elementId).value.trim();
    });

    values.trackingId = values.trackingId.toUpperCase();
    values.orderReference = values.orderReference.toUpperCase();
    values.vehicleNumber = values.vehicleNumber.toUpperCase();
    values.status = editingDeliveryId
        ? findDelivery(editingDeliveryId)?.status
        : $("delivery-status").value;

    values.estimatedDelivery = $("estimated-delivery").value;

    return values;
}


/* =========================================
   VALIDATE DELIVERY FORM
========================================= */

function validateDelivery(data, currentId = null) {
    const required = [
        ["Tracking ID", data.trackingId],
        ["Order reference", data.orderReference],
        ["Recipient name", data.recipientName],
        ["Destination city", data.city],
        ["State / region", data.state],
        ["Delivery address", data.address]
    ];

    const missing = required.find(([, value]) => !value);

    if (missing) return `${missing[0]} is required.`;

    if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(data.trackingId)) {
        return "Tracking ID must be 3–40 characters using letters, numbers, hyphens or underscores.";
    }

    if (!DELIVERY_PRIORITIES.includes(data.priority)) {
        return "Select a valid priority.";
    }

    if (!TRANSPORT_MODES.includes(data.transportMode)) {
        return "Select a valid transport mode.";
    }

    if (!DELIVERY_STATUSES.includes(data.status)) {
        return "Select a valid delivery status.";
    }

    if (!REFUND_STATUSES.includes(data.refundStatus)) {
        return "Select a valid refund status.";
    }

    if (!PHONE_COUNTRIES[data.recipientPhoneCountry]) {
        return "Choose a valid recipient phone country code.";
    }

    if (!PHONE_COUNTRIES[data.driverPhoneCountry]) {
        return "Choose a valid driver phone country code.";
    }

    const eta = parseDate(data.estimatedDelivery);

    if (!eta) return "Enter a valid estimated delivery date and time.";

    const duplicate = deliveries.some(delivery =>
        delivery.trackingId.toLowerCase() === data.trackingId.toLowerCase() &&
        delivery.id !== currentId
    );

    if (duplicate) {
        return "This tracking ID already exists. Enter a unique ID.";
    }

    const existing = currentId ? findDelivery(currentId) : null;

    const recipientPhoneError = validatePhone(
        data.recipientPhone,
        data.recipientPhoneCountry,
        existing?.recipientPhone ?? null
    );

    if (recipientPhoneError) {
        return `Recipient phone: ${recipientPhoneError}`;
    }

    const driverPhoneError = validatePhone(
        data.driverPhone,
        data.driverPhoneCountry,
        existing?.driverPhone ?? null
    );

    if (driverPhoneError) {
        return `Driver phone: ${driverPhoneError}`;
    }

    const postalError = validatePostalCode(
        data.destinationCountry,
        data.postalCode
    );

    if (postalError) return postalError;

    const addressResult = validateAddress(data);

    if (addressResult.error) return addressResult.error;

    return "";
}


/* =========================================
   SAVE CREATE / EDIT DELIVERY
========================================= */

function handleDeliverySubmit(event) {
    event.preventDefault();
    clearFormError(deliveryFormError);

    if (!deliveryForm.reportValidity()) return;

    let data = getDeliveryFormValues();

    const validationError = validateDelivery(data, editingDeliveryId);

    if (validationError) {
        showFormError(deliveryFormError, validationError);
        return;
    }

    const addressResult = validateAddress(data);

    if (addressResult.warning && !confirm(
        `${addressResult.warning}\n\nDo you want to continue saving this address?`
    )) {
        return;
    }

    data = normalizeAddressValues(data);

    data.recipientPhone = normalizeStoredPhone(
        data.recipientPhone,
        data.recipientPhoneCountry,
        editingDeliveryId,
        "recipientPhone"
    );

    data.driverPhone = normalizeStoredPhone(
        data.driverPhone,
        data.driverPhoneCountry,
        editingDeliveryId,
        "driverPhone"
    );

    const currentTime = nowISO();

    if (editingDeliveryId) {
        const existing = findDelivery(editingDeliveryId);

        if (!existing) {
            showFormError(deliveryFormError, "Delivery record not found. Reload and try again.");
            return;
        }

        const auditEntry = createEvent({
            type: "audit",
            status: existing.status,
            title: "Delivery details updated",
            time: currentTime,
            location: existing.city,
            reason: "Recipient, address, assignment, ETA, or follow-up details edited."
        });

        const updated = {
            ...existing,
            ...data,
            status: existing.status,
            createdAt: existing.createdAt,
            updatedAt: currentTime,
            history: [...existing.history, auditEntry]
        };

        const next = deliveries.map(item =>
            item.id === editingDeliveryId ? updated : item
        );

        if (saveDeliveries(next)) {
            closeDeliveryModal();
            renderPage();
        }

        return;
    }

    const created = createEvent({
        type: "created",
        status: data.status,
        title: "Delivery created",
        time: currentTime,
        location: data.sourceWarehouse || data.city,
        reason: "Delivery record created."
    });

    const statusEntry = createEvent({
        type: "status",
        status: data.status,
        title: `Initial status: ${data.status}`,
        time: currentTime,
        location: data.sourceWarehouse || data.city,
        reason: "Initial delivery status recorded."
    });

    const newDelivery = {
        id: generateId(),
        ...data,
        estimatedDelivery: new Date(data.estimatedDelivery).toISOString(),
        createdAt: currentTime,
        updatedAt: currentTime,
        history: [created, statusEntry],
        pod: null
    };

    if (saveDeliveries([...deliveries, newDelivery])) {
        closeDeliveryModal();
        renderPage();
    }
}

function normalizeStoredPhone(value, country, currentId, property) {
    const raw = String(value ?? "").trim();

    if (/[xX*]/.test(raw)) {
        const existing = currentId ? findDelivery(currentId) : null;
        if (existing && existing[property] === raw) return raw;
    }

    return normalizeNationalPhone(raw, country);
}


/* =========================================
   DETAILS AND TIMELINE
========================================= */

function detailItem(label, value, fullWidth = false) {
    return `
        <div class="detail-item ${fullWidth ? "full-width" : ""}">
            <span class="detail-label">${escapeHTML(label)}</span>
            <span class="detail-value">${escapeHTML(value || "Not provided")}</span>
        </div>`;
}

function renderDeliveryDetails(delivery) {
    $("delivery-details-title").textContent = delivery.recipientName;
    $("delivery-details-tracking").textContent =
        `${delivery.trackingId} · ${delivery.orderReference}`;

    $("delivery-details-content").innerHTML = [
        detailItem("Current Status", delivery.status),
        detailItem("Priority", delivery.priority),
        detailItem("Refund Status", delivery.refundStatus || "None"),
        detailItem("Transport Mode", delivery.transportMode),
        detailItem("Recipient", delivery.recipientName),
        detailItem("Recipient Phone", formatPhone(
            delivery.recipientPhone,
            delivery.recipientPhoneCountry
        )),
        detailItem("Destination Country", delivery.destinationCountry),
        detailItem("City", delivery.city),
        detailItem("State / Region", delivery.state),
        detailItem("Postal Code", delivery.postalCode || "Not provided"),
        detailItem("Driver", delivery.driverName),
        detailItem("Driver Phone", formatPhone(
            delivery.driverPhone,
            delivery.driverPhoneCountry
        )),
        detailItem("Vehicle", delivery.vehicleNumber),
        detailItem("Carrier", delivery.carrierName),
        detailItem("Origin Warehouse", delivery.sourceWarehouse),
        detailItem("Estimated Delivery", formatDateTime(delivery.estimatedDelivery)),
        detailItem("Created", formatDateTime(delivery.createdAt)),
        detailItem("Last Updated", formatDateTime(delivery.updatedAt)),
        detailItem("Delivery Address", delivery.address, true),
        detailItem("Notes", delivery.notes || "No additional notes", true)
    ].join("");

    renderTimeline(delivery);
    renderPodSummary(delivery);

    $("update-delivery-status").disabled = delivery.status === "Delivered";

    const podButton = $("record-proof-from-details");

    if (podButton) podButton.hidden = Boolean(delivery.pod);
}

function renderTimeline(delivery) {
    const events = [...delivery.history].sort((a, b) =>
        new Date(a.time) - new Date(b.time)
    );

    const timeline = $("delivery-timeline");

    if (!events.length) {
        timeline.innerHTML = `<p class="empty-state">No timeline events available.</p>`;
        return;
    }

    timeline.innerHTML = events.map(entry => `
        <article class="timeline-event">
            <div class="timeline-marker-wrap"><span class="timeline-marker"></span></div>
            <div class="timeline-body">
                <div class="timeline-event-header">
                    <strong>${escapeHTML(entry.title || entry.status || "Delivery event")}</strong>
                    <time datetime="${escapeHTML(entry.time)}">${escapeHTML(formatDateTime(entry.time))}</time>
                </div>
                ${entry.location ? `<div class="timeline-location">Location: ${escapeHTML(entry.location)}</div>` : ""}
                ${entry.reason ? `<div class="timeline-note">${escapeHTML(entry.reason)}</div>` : ""}
                ${entry.actor ? `<div class="timeline-actor">Recorded by ${escapeHTML(entry.actor)}</div>` : ""}
            </div>
        </article>
    `).join("");
}

function renderPodSummary(delivery) {
    const section = $("pod-summary-section");
    const content = $("pod-summary-content");

    if (!delivery.pod) {
        section.hidden = true;
        content.innerHTML = "";
        return;
    }

    section.hidden = false;
    const pod = delivery.pod;

    content.innerHTML = `
        <div class="pod-summary-card">
            ${[
                ["Received / Confirmed By", pod.receivedBy],
                ["Method", pod.method],
                ["Proof Reference", pod.reference || "Not provided"],
                ["Actual Delivery", formatDateTime(pod.deliveredAt)]
            ].map(([label, value]) => `
                <div class="pod-summary-row">
                    <span class="pod-summary-label">${escapeHTML(label)}</span>
                    <span class="pod-summary-value">${escapeHTML(value)}</span>
                </div>
            `).join("")}
            ${pod.notes ? `<div class="pod-summary-note">${escapeHTML(pod.notes)}</div>` : ""}
        </div>`;
}

function openDeliveryDetails(delivery) {
    selectedDeliveryId = delivery.id;
    renderDeliveryDetails(delivery);

    let podButton = $("record-proof-from-details");

    if (!podButton) {
        podButton = document.createElement("button");
        podButton.id = "record-proof-from-details";
        podButton.type = "button";
        podButton.className = "secondary-btn";
        podButton.textContent = "Record Proof of Delivery";

        $("update-delivery-status").parentElement.insertBefore(
            podButton,
            $("update-delivery-status")
        );

        podButton.addEventListener("click", () => {
            const current = findDelivery(selectedDeliveryId);
            if (!current || current.pod) return;

            closeModal(deliveryDetailsModal);
            openProofOfDeliveryModal();
        });
    }

    podButton.hidden = Boolean(delivery.pod);
    openModal(deliveryDetailsModal);
}

function closeDeliveryDetails() {
    closeModal(deliveryDetailsModal);
}


/* =========================================
   TABLE ACTIONS
========================================= */

function deleteDelivery(id) {
    const delivery = findDelivery(id);
    if (!delivery) return;

    const confirmed = confirm(
        `Delete delivery ${delivery.trackingId}?\n\nThis removes it from this browser's demo records.`
    );

    if (!confirmed) return;

    const next = deliveries.filter(item => item.id !== id);

    if (saveDeliveries(next)) {
        if (selectedDeliveryId === id) closeDeliveryDetails();
        renderPage();
    }
}

function handleDeliveryTableAction(event) {
    const button = event.target.closest("button[data-action]");

    if (!button || button.disabled) return;

    const delivery = findDelivery(button.dataset.id);
    if (!delivery) {
        alert("Delivery record not found. Refresh and try again.");
        return;
    }

    switch (button.dataset.action) {
        case "view":
            openDeliveryDetails(delivery);
            break;

        case "edit":
            openDeliveryModal(delivery);
            break;

        case "status":
            openStatusModal(delivery);
            break;

        case "pod":
            selectedDeliveryId = delivery.id;
            openProofOfDeliveryModal();
            break;

        case "delete":
            deleteDelivery(delivery.id);
            break;
    }
}


/* =========================================
   STATUS UPDATE
========================================= */

function openStatusModal(delivery) {
    if (!delivery || delivery.status === "Delivered") {
        alert("Delivered records are already completed.");
        return;
    }

    selectedDeliveryId = delivery.id;
    clearFormError(deliveryStatusError);

    $("new-delivery-status").value = delivery.status;
    $("status-event-time").value = toLocalDateTimeValue(nowISO());
    $("status-event-location").value = delivery.city || "";
    $("status-event-reason").value = "";

    closeModal(deliveryDetailsModal);
    openModal(deliveryStatusModal);
}

function closeStatusModal() {
    closeModal(deliveryStatusModal);
    clearFormError(deliveryStatusError);
}

function handleStatusSubmit(event) {
    event.preventDefault();
    clearFormError(deliveryStatusError);

    const delivery = findDelivery(selectedDeliveryId);

    if (!delivery) {
        showFormError(deliveryStatusError, "Delivery record not found.");
        return;
    }

    if (delivery.status === "Delivered") {
        showFormError(deliveryStatusError, "This delivery is already completed.");
        return;
    }

    const nextStatus = $("new-delivery-status").value;
    const dateValue = $("status-event-time").value;
    const eventLocation = $("status-event-location").value.trim();
    const reason = $("status-event-reason").value.trim();
    const eventDate = parseDate(dateValue);

    if (!DELIVERY_STATUSES.includes(nextStatus)) {
        showFormError(deliveryStatusError, "Choose a valid status.");
        return;
    }

    if (nextStatus === delivery.status) {
        showFormError(deliveryStatusError, "Choose a different status.");
        return;
    }

    if (!eventDate) {
        showFormError(deliveryStatusError, "Enter a valid event date and time.");
        return;
    }

    if (eventDate.getTime() > Date.now() + 60000) {
        showFormError(deliveryStatusError, "Event time cannot be in the future.");
        return;
    }

    if (!reason) {
        showFormError(deliveryStatusError, "Enter a reason for this status update.");
        return;
    }

    if (nextStatus === "Delivered") {
        pendingDeliveredEvent = {
            time: eventDate.toISOString(),
            location: eventLocation || delivery.city,
            reason
        };

        closeModal(deliveryStatusModal);
        openProofOfDeliveryModal();

        $("pod-delivered-at").value =
            toLocalDateTimeValue(pendingDeliveredEvent.time);
        return;
    }

    const statusHistoryEntry = createEvent({
        type: "status",
        status: nextStatus,
        title: `${nextStatus} status recorded`,
        time: eventDate.toISOString(),
        location: eventLocation || delivery.city,
        reason
    });

    const updated = {
        ...delivery,
        status: nextStatus,
        updatedAt: nowISO(),
        history: [...delivery.history, statusHistoryEntry]
    };

    const next = deliveries.map(item =>
        item.id === delivery.id ? updated : item
    );

    if (saveDeliveries(next)) {
        closeStatusModal();
        renderPage();
    }
}


/* =========================================
   PROOF OF DELIVERY
========================================= */

function openProofOfDeliveryModal() {
    const delivery = findDelivery(selectedDeliveryId);

    if (!delivery) {
        alert("Delivery record not found.");
        return;
    }

    if (delivery.pod) {
        alert("Proof of delivery has already been recorded.");
        return;
    }

    $("proof-of-delivery-form").reset();
    clearFormError(podFormError);

    $("pod-received-by").value = delivery.recipientName || "";
    $("pod-method").value = "Receiver Name";
    $("pod-reference").value = "";
    $("pod-delivered-at").value =
        toLocalDateTimeValue(pendingDeliveredEvent?.time || nowISO());
    $("pod-notes").value = "";

    openModal(proofOfDeliveryModal);
}

function closeProofOfDeliveryModal() {
    closeModal(proofOfDeliveryModal);
    pendingDeliveredEvent = null;
    clearFormError(podFormError);
}

function handleProofOfDeliverySubmit(event) {
    event.preventDefault();
    clearFormError(podFormError);

    const delivery = findDelivery(selectedDeliveryId);

    if (!delivery) {
        showFormError(podFormError, "Delivery record not found.");
        return;
    }

    if (delivery.pod) {
        showFormError(podFormError, "Proof has already been recorded.");
        return;
    }

    const receivedBy = $("pod-received-by").value.trim();
    const method = $("pod-method").value;
    const reference = $("pod-reference").value.trim();
    const deliveredAt = parseDate($("pod-delivered-at").value);
    const notes = $("pod-notes").value.trim();

    if (!receivedBy) {
        showFormError(podFormError, "Enter the receiver's name.");
        return;
    }

    if (!deliveredAt) {
        showFormError(podFormError, "Enter the actual delivery date and time.");
        return;
    }

    if (deliveredAt.getTime() > Date.now() + 60000) {
        showFormError(podFormError, "Actual delivery time cannot be in the future.");
        return;
    }

    const currentTime = nowISO();

    const pod = {
        receivedBy,
        method,
        reference,
        deliveredAt: deliveredAt.toISOString(),
        notes,
        recordedAt: currentTime
    };

    const reasons = [];

    if (pendingDeliveredEvent?.reason) {
        reasons.push(pendingDeliveredEvent.reason);
    }

    reasons.push(`Handover confirmed by ${receivedBy} using ${method}.`);

    if (reference) reasons.push(`Proof reference: ${reference}.`);

    const deliveredHistoryEntry = createEvent({
        type: "status",
        status: "Delivered",
        title: "Delivery confirmed",
        time: deliveredAt.toISOString(),
        location: pendingDeliveredEvent?.location || delivery.city,
        reason: reasons.join(" ")
    });

    const updated = {
        ...delivery,
        status: "Delivered",
        pod,
        updatedAt: currentTime,
        history: [...delivery.history, deliveredHistoryEntry]
    };

    const next = deliveries.map(item =>
        item.id === delivery.id ? updated : item
    );

    if (saveDeliveries(next)) {
        closeProofOfDeliveryModal();
        renderPage();

        if (
            !deliveryDetailsModal.hidden &&
            selectedDeliveryId === delivery.id
        ) {
            openDeliveryDetails(updated);
        }
    }
}


/* =========================================
   LOCATION FIELD EVENTS
========================================= */

$("delivery-country").addEventListener("change", () => {
    $("delivery-city").value = "";
    $("delivery-state").value = "";
    $("delivery-postal-code").value = "";
    refreshLocationSuggestions();
});

$("delivery-state").addEventListener("input", refreshLocationSuggestions);


/* =========================================
   EVENT LISTENERS
========================================= */

$("open-delivery-modal").addEventListener("click", () => {
    openDeliveryModal();
});

$("close-delivery-modal").addEventListener("click", closeDeliveryModal);
$("cancel-delivery").addEventListener("click", closeDeliveryModal);

deliveryForm.addEventListener("submit", handleDeliverySubmit);

deliverySearch.addEventListener("input", renderDeliveryTable);

deliveryStatusFilter.addEventListener("change", () => {
    activeOverviewFilter = null;
    updateOverviewFilterUI();
    renderDeliveryTable();
});

deliveryPriorityFilter.addEventListener("change", renderDeliveryTable);

deliveryTableBody.addEventListener("click", handleDeliveryTableAction);

$("close-delivery-details").addEventListener("click", closeDeliveryDetails);
$("close-details-button").addEventListener("click", closeDeliveryDetails);

$("edit-from-details").addEventListener("click", () => {
    const delivery = findDelivery(selectedDeliveryId);
    if (!delivery) return;

    closeDeliveryDetails();
    openDeliveryModal(delivery);
});

$("update-delivery-status").addEventListener("click", () => {
    const delivery = findDelivery(selectedDeliveryId);
    if (delivery) openStatusModal(delivery);
});

$("close-status-modal").addEventListener("click", closeStatusModal);
$("cancel-status-update").addEventListener("click", closeStatusModal);

$("delivery-status-form").addEventListener("submit", handleStatusSubmit);

$("close-pod-modal").addEventListener("click", closeProofOfDeliveryModal);
$("cancel-pod").addEventListener("click", closeProofOfDeliveryModal);

$("proof-of-delivery-form").addEventListener(
    "submit",
    handleProofOfDeliverySubmit
);

allModals.forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target !== modal) return;

        if (modal === deliveryModal) {
            closeDeliveryModal();
        } else if (modal === deliveryDetailsModal) {
            closeDeliveryDetails();
        } else if (modal === deliveryStatusModal) {
            closeStatusModal();
        } else if (modal === proofOfDeliveryModal) {
            closeProofOfDeliveryModal();
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (!proofOfDeliveryModal.hidden) {
        closeProofOfDeliveryModal();
    } else if (!deliveryStatusModal.hidden) {
        closeStatusModal();
    } else if (!deliveryDetailsModal.hidden) {
        closeDeliveryDetails();
    } else if (!deliveryModal.hidden) {
        closeDeliveryModal();
    }
});


/* =========================================
   INITIALIZE PAGE
========================================= */

deliveries = loadDeliveries();

refreshLocationSuggestions();
renderPage();

console.log(
    `LogiFlow Deliveries initialized: ${deliveries.length} record(s).`
);