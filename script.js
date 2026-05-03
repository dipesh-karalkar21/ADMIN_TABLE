// --- DATA & STATE ---
const categories = ['School', 'Institute (Educational / Training)','Private Office/initiatives', 'Restaurant', 
    'Café', 'Grocery Shop', 'General Store/Super-market', 'Organic Market', 'Government initiatives', 
    'Event (Festival, Workshop, Meetup, etc.)', 'Recycling Center', 'EV Charging', 'Solar Installation', 
    'Community Garden']

const eventCategories = ["Festival","Workshop","Seminar","Webinar","Meetup","Exhibition / Expo","Cultural Event",
    "Sports Event","Music Concert","Food Festival","Training Session","Awareness Campaign","Community Gathering",
    "Startup / Tech Event","Charity Event","School / College Event","Government Event",]

const filter = document.querySelector("#categoryFilter")
categories.forEach(cat => {
    filter.innerHTML += `<option value="${cat}">${cat}</option>`
});



var idTracker;
var fetchedData;
var places = []
let entries;
fetch(`https://admin-api-eb59.onrender.com/GetData`,{
    method:"GET",
    credentials: 'include',
}).then((res)=>{
    return res.json()
}).then((data)=>{
    if(data.status === 'ERROR' && data.message.includes('token')){
//        window.location.href = 'http://localhost:5500/signIn.html'
    }
    console.log(data)
    fetchedData = data
    idTracker = parseInt(fetchedData.verifiedData[fetchedData.verifiedData.length-1][0])
    places = [...data.userResp,...data.verifiedData]
    
    entries = generateEntries();
    init()
}).catch((err)=>{
//    window.location.href = 'http://localhost:5500/index.html'
})


// ['1', 'Management Institute', '18.5721', '73.9211', 
// 'Offers executive MBA programs and professional development courses.', 
// 'Institute (Educational / Training)', 'New Bypass Road, Wagholi', 
// 'https://drive.google.com/open?id=1p1thIjkOBVZD_a_Risw0EXTE4OPE5Zp_', 
// '', '', '', '', '', '', '', 
// 'Composting of organic waste, Zero‑waste initiatives, Vegan, Reusable containers encouraged', 'Pending']



// Helper to generate mock data
const generateEntries = () => {

    const data = [];
    const statuses = ['Verified', 'Pending', 'Rejected'];
    
    places.forEach((place)=>{
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const status = statuses[Math.floor(Math.random() * 3)];
        const isEvent = cat === 'Event (Festival, Workshop, Meetup, etc.)';

        data.push({
            id: place[17] == 'Verified' ? place[0] : 'Resp'+place[0],
            name: place[1],
            lat: place[2],
            lng: place[3],
            description: place[4],
            category: place[5],
            address: place[6],
            images: place[7].split(','),
            eventCat:place[8],
            startDate: place[9],
            endDate: place[10],
            startTime: place[11],
            endTime: place[12],
            WSM: place[13],
            contact: place[14],
            tags:place[15],
            practices: place[16],
            status: place[17],
        });
    })
    // Add specific fixed examples
    // data[0].name = "VoltCharge Downtown";
    // data[0].category = "EV Charging";
    // data[0].status = "Verified";
    // data[0].lat = "47.6062"; data[0].lng = "-122.3321";

    // data[1].name = "Green Earth Grocers";
    // data[1].category = "Organic Market";
    // data[1].status = "Pending";
    
    return data;
};


let currentEditId = null;
let tempImages = [];

// --- DOM ELEMENTS ---
const tableBody = document.getElementById('entriesTableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusCheckboxes = document.querySelectorAll('.status-filter');
const showingCount = document.getElementById('showingCount');

// Modal Elements
const modal = document.getElementById('editModal');
const modalCatSelect = document.getElementById('m_category');
const eventCatSelect = document.getElementById("m_eventCat")
const eventFields = document.getElementById('eventFieldsContainer');

// --- INITIALIZATION ---
const init = () => {
    // Populate Modal Category Select
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.innerText = c;
        modalCatSelect.appendChild(opt);
    });
    eventCategories.forEach(ec=>{
        const opt = document.createElement('option');
        opt.value = ec;
        opt.innerText = ec;
        eventCatSelect.appendChild(opt)
    })

    // Event Listeners
    searchInput.addEventListener('input', renderTable);
    categoryFilter.addEventListener('change', renderTable);
    statusCheckboxes.forEach(cb => cb.addEventListener('change', renderTable));

    renderTable();
};

// --- RENDERING TABLE ---
function renderTable() {
    // 1. Get Filters
    const search = searchInput.value.toLowerCase();
    const selectedCat = categoryFilter.value;
    const activeStatuses = Array.from(statusCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // 2. Filter Data
    const filtered = entries.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search) || 
                              item.id.toLowerCase().includes(search);
        const matchesCat = selectedCat === 'All' || item.category === selectedCat;
        const matchesStatus = activeStatuses.includes(item.status);
        return matchesSearch && matchesCat && matchesStatus;
    });

    // 3. Clear Table
    tableBody.innerHTML = '';
    
    // 4. Handle Empty
    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
    }

    // 5. Render Rows
    filtered.forEach(entry => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors group';

        // Status Badge Logic
        let statusBadge = '';
        if(entry.status === 'Verified') statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200"><i class="fa-solid fa-check mr-1"></i> Verified</span>';
        if(entry.status === 'Pending') statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"><i class="fa-solid fa-clock mr-1"></i> Pending</span>';
        if(entry.status === 'Rejected') statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"><i class="fa-solid fa-xmark mr-1"></i> Rejected</span>';

        // Category Badge Logic
        const catClass = getCategoryClass(entry.category);

        var id = entry.images[0].split("id")[1].replace("=","")
        console.log(id)
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-10 w-10 rounded overflow-hidden bg-slate-200">
                    <img src="https://drive.google.com/thumbnail?id=${id}&sz=w400" class="h-full w-full object-cover" onerror="this.src='https://via.placeholder.com/40'">
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-bold text-slate-800">${entry.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${catClass}">
                    ${entry.category}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600 truncate max-w-xs" title="${entry.address}">${entry.address}</td>
            <td class="px-6 py-4 text-xs text-slate-500 font-mono">
                ${entry.lat}° N, ${entry.lng}° W
            </td>
            <td class="px-6 py-4 text-center whitespace-nowrap">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div class="flex justify-center items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onclick="deleteEntry('${entry.id}')" class="text-slate-400 hover:text-rose-500 transition" title="Delete">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                    ${entry.status !== 'Verified' ? 
                        `<button onclick="updateStatus('${entry.id}', 'Verified')" class="text-slate-400 hover:text-brand-teal transition" title="Approve">
                            <i class="fa-solid fa-check"></i>
                         </button>` : ''
                    }
                    ${(entry.status !== 'Rejected' && entry.status !== 'Verified') ? 
                        `<button onclick="updateStatus('${entry.id}', 'Rejected')" class="text-slate-400 hover:text-rose-500 transition" title="Reject">
                            <span class="text-rose-500 font-bold text-lg">×</span>
                         </button>` : ''
                    }
                    <button onclick="openModal('${entry.id}')" class="text-slate-400 hover:text-brand-blue transition" title="Edit">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    showingCount.innerText = `Showing 1-${filtered.length} of ${filtered.length} entries`;
}

function getCategoryClass(cat) {
    if(cat.includes('Organic') || cat.includes('Garden')) return 'bg-lime-100 text-lime-800 border border-lime-200';
    if(cat.includes('EV') || cat.includes('Solar')) return 'bg-sky-100 text-sky-800 border border-sky-200';
    if(cat.includes('Recycling')) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if(cat.includes('Event')) return 'bg-pink-100 text-pink-800 border border-pink-200';
    return 'bg-red-100 text-red-700 border border-red-200';
}

// --- ACTIONS ---
function deleteEntry(id) {
    if(confirm("Are you sure you want to delete this submission? This cannot be undone.")) {
        const entry = entries.find(e => e.id === id);
        entries = entries.filter(e => e.id !== id);
        var req = Object.values(entry)
        req[0] = req[0].replace(/[A-Za-z]/g,'')
        req[7] = req[7].join(',')
        console.log(req)
        fetch(`https://admin-api-eb59.onrender.com/deleteData`,{
            method:'POST',
            headers:{"Content-Type":'application/json'},
            body:JSON.stringify({data:req}),
            credentials:'include',
        }).then(async(res)=>{
            console.log(await res.json())
        })
        renderTable();
    }
}

function updateStatus(id, newStatus) {
    const entry = entries.find(e => e.id === id);
    if(entry) {
        if(newStatus === 'Verified'){
            var req = Object.values(entry)
            req[0] = req[0].replace(/[A-Za-z]/g,'')
            req[7] = req[7].join(',')
            console.log(req)
            fetch(`https://admin-api-eb59.onrender.com/deleteData`,{
                method:'POST',
                headers:{"Content-Type":'application/json'},
                body:JSON.stringify({data:req}),
                credentials: 'include',
            }).then(async(res)=>{
                console.log(await res.json())
            })
            req[0] = `${idTracker+1}`
            entry.id = req[0]
            idTracker = idTracker+1
            req.pop()
            entry.status = newStatus;
            console.log(req)
            fetch(`https://admin-api-eb59.onrender.com/appendData`,{
                method:'POST',
                headers:{"Content-Type":'application/json'},
                body:JSON.stringify({data:req}),
                credentials: 'include',
            }).then(async(res)=>{
                console.log(await res.json())
            })
        }
        else if(newStatus === 'Rejected'){
            entry.status = newStatus
            var req = Object.values(entry)            
            req[0] = req[0].replace(/[A-Za-z]/g,'')
            req[7] = req[7].join(',')
            console.log(req)
            fetch(`https://admin-api-eb59.onrender.com/updateData`,{
                method:'POST',
                headers:{"Content-Type":'application/json'},
                body:JSON.stringify({data:req}),
                credentials: 'include',
            }).then(async(res)=>{
                console.log(await res.json())
            })
        }
        renderTable();
    }
}

// --- MODAL LOGIC ---
function openModal(id) {
    currentEditId = id;
    console.log(id)
    const entry = entries.find(e => e.id === id);
    if(!entry) return;

    // Populate Fields
    document.getElementById('m_name').value = entry.name;
    document.getElementById('m_category').value = entry.category;
    document.getElementById('m_description').value = entry.description;
    document.getElementById('m_practices').value = entry.practices;
    document.getElementById('m_address').value = entry.address;
//    document.getElementById('m_city').value = entry.city;
    document.getElementById('m_lat').value = entry.lat;
    document.getElementById('m_lng').value = entry.lng;
    document.getElementById('m_contact').value = entry.contact;
    document.getElementById('m_website').value = entry.WSM;

    // Event Fields
    document.getElementById('m_eventCat').value = entry.eventCat || '';
    document.getElementById('m_startDate').value = entry.startDate || '';
    document.getElementById('m_endDate').value = entry.endDate || '';
    document.getElementById('m_startTime').value = entry.startTime || '';
    document.getElementById('m_endTime').value = entry.endTime || '';


    // Handle Images
    tempImages = [...entry.images]; // deep copy
    renderModalImages();

    toggleEventFields(); // Check if event fields need showing
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentEditId = null;
}

function toggleEventFields() {
    const cat = document.getElementById('m_category').value;
    if(cat === 'Event (Festival, Workshop, Meetup, etc.)') {
        eventFields.classList.remove('hidden');
    } else {
        eventFields.classList.add('hidden');
    }
}

async function saveSubmission() {
    if(!currentEditId) return;
    const entry = entries.find(e => e.id === currentEditId);

    entry.name = document.getElementById('m_name').value;
    entry.category = document.getElementById('m_category').value;
    entry.description = document.getElementById('m_description').value;
    entry.practices = document.getElementById('m_practices').value;
    entry.address = document.getElementById('m_address').value;
    entry.lat = document.getElementById('m_lat').value;
    entry.lng = document.getElementById('m_lng').value;
    entry.contact = document.getElementById('m_contact').value;
    entry.WSM = document.getElementById('m_website').value;
    entry.images = [...tempImages];

    // Save Event Data if applicable
    if(entry.category === 'Event (Festival, Workshop, Meetup, etc.)') {
        entry.eventCat = document.getElementById('m_eventCat').value;
        entry.startDate = document.getElementById('m_startDate').value;
        entry.endDate = document.getElementById('m_endDate').value;
        entry.startTime = document.getElementById('m_startTime').value;
        entry.endTime = document.getElementById('m_endTime').value;
    }
    var req = Object.values(entry)
    req[0] = req[0].replace(/[A-Za-z]/g,'') 
    req[7] = req[7].join(',')
    console.log(req)
    fetch(`https://admin-api-eb59.onrender.com/updateData`,{
        method:'POST',
        headers:{"Content-Type":'application/json'},
        body:JSON.stringify({data:req}),
        credentials: 'include',
    }).then(async(res)=>{
        console.log(await res.json())
    })
    renderTable();
    closeModal();
}

// --- IMAGE HANDLING IN MODAL ---
function renderModalImages() {
    const container = document.getElementById('imageGallery');
    container.innerHTML = '';
    tempImages.forEach((url, index) => {
        const div = document.createElement('div');
        var id = url.split("id")[1].replace('=','')
        div.className = 'relative w-24 h-24 rounded overflow-hidden border border-slate-200 group';
        div.innerHTML = `
            <img src="https://drive.google.com/thumbnail?id=${id}&sz=w400" class="w-full h-full object-cover">
            <button type="button" onclick="removeImage(${index})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        `;
        container.appendChild(div);
    });
}

function addImageFromInput() {
    const input = document.getElementById('imgUrlInput');
    const url = input.value.trim();
    if(url) {
        tempImages.push(url);
        renderModalImages();
        input.value = '';
    }
}

function removeImage(index) {
    tempImages.splice(index, 1);
    renderModalImages();
}


setInterval(()=>{
    fetch(`https://admin-api-eb59.onrender.com/GetData`,{
        method:"GET",
        credentials: 'include',
    }).then((res)=>{
        return res.json()
    }).then((data)=>{
        if(data.status === 'ERROR' && data.error.includes('token')){
            window.location.href = 'http://localhost:5500/signIn.html'
        }
        console.log(data)
        fetchedData = data
        idTracker = parseInt(fetchedData.verifiedData[fetchedData.verifiedData.length-1][0])
        places = [...data.userResp,...data.verifiedData]
        
        entries = generateEntries();
        init()
    }).catch((err)=>{
        console.error(err)
        window.location.href = 'http://localhost:5500/index.html'
    })
},30000)

// Run Init
//document.addEventListener('DOMContentLoaded', init);
