 //------------ region helper function -----------------//
const showLoading = (isLoading) => {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
};
document.getElementById("toggleCollapse").addEventListener("click", function() {
    const collapseElement = document.querySelector("#response");
    
    // Toggle kelas 'show' pada elemen dengan id 'response'
    collapseElement.classList.toggle("hide");
  });
  
//------------ endregion helper function -----------------//

//<---------- region create memhers --------->

// Mengambil elemen form dan message untuk interaksi dengan user
const form = document.getElementById('membershipForm');
const messageDiv = document.getElementById('message');

// Fungsi untuk mengenerate unique_key dengan panjang length karakter
const generateUniqueKey = (length) => {
    let key = '';
    while (key.length < length) {
        key += Math.random().toString(36).substring(2); // Tambah karakter acak
    }
    return key.substring(0, length); // Ambil hanya sepanjang length karakter
};

// Fungsi untuk mendapatkan epoch time UTC
const getCurrentEpochUTC = () => {
    const currentDate = new Date();
    const utcEpoch = Math.floor(currentDate.getTime() / 1000); // Konversi ke epoch UTC
    const utcDate = currentDate.toISOString(); // Mendapatkan waktu dalam format UTC (ISO string)
    
    console.log('Current local Date:', currentDate);
    console.log('Current UTC Date:', utcDate);
    console.log('Current UTC Epoch:', utcEpoch);
    
    return utcEpoch;
};

// Menangani submit form
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah form melakukan submit standar
    console.log('submit clicked..')

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const unique_key = generateUniqueKey(24); // Generate unique_key 24 karakter
    const expired_time = getCurrentEpochUTC(); // Mendapatkan epoch UTC saat ini

    const newMember = { name, email, unique_key, expired_time };

    // Mengirim data ke backend menggunakan fetch API
    try {
        const response = await fetch('http://localhost:5000/api/memberships', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newMember),
        });

        if (response.ok) {
            const result = await response.json();
            messageDiv.textContent = `Membership created with Unique Key: ${result.unique_key}`;
            messageDiv.style.color = 'green';
        } else {
            const errorResponse = await response.json(); // Menangkap error dari backend
            throw new Error(errorResponse.message || 'Failed to create membership');
        }
    } catch (err) {
        console.error('Error from backend:', err); // Log detail error di front-end
        messageDiv.textContent = err.message;
        messageDiv.style.color = 'red';
    }
});

//---------- endregion create memhers---------//


//---------------------- region get all memhers-------------------//
let cachedMemberships = null;

const fetchMemberships = async () => {
    // Cek apakah data sudah ada di localStorage
    const cachedData = localStorage.getItem('memberships');
    if (cachedData) {
        // Gunakan data dari cache (localStorage)
        cachedMemberships = JSON.parse(cachedData);
        loadAndDisplayMembers(cachedMemberships);
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/memberships');
        if (!response.ok) throw new Error('Failed to fetch memberships');
        cachedMemberships = await response.json();
        
        // Simpan data ke localStorage untuk digunakan di kemudian hari
        localStorage.setItem('memberships', JSON.stringify(cachedMemberships));
        
        loadAndDisplayMembers(cachedMemberships);
    } catch (error) {
        console.error(error.message);
    }
};

//fungsi laod members mannual
const refreshData = async () => {
    showLoading(true); // Menampilkan indikator loading
    try {
        const response = await fetch('http://localhost:5000/api/memberships');
        if (!response.ok) throw new Error('Failed to fetch memberships');
        const memberships = await response.json();
        cachedMemberships = memberships; // Perbarui cache

        // Simpan data yang terbaru ke localStorage
        localStorage.setItem('memberships', JSON.stringify(memberships));

        loadAndDisplayMembers(memberships); // Render ulang UI
    } catch (error) {
        console.error(error.message);
    } finally {
        showLoading(false); // Sembunyikan indikator loading
    }
};

document.getElementById('refreshButton').addEventListener('click', refreshData);

const loadAndDisplayMembers = (memberships) => {
    const tableBody = document.querySelector('#membersTable tbody');
    tableBody.innerHTML = ''; // Clear previous rows

    memberships.data.forEach((member) => {
        const dateInfo = epochToHumanDate(member.expired_time);
        console.log('Date Info:', dateInfo);  // Debugging informasi tanggal

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.id}</td>  <!-- Menampilkan ID member -->
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>
                <span id="span-${member.unique_key}" data-utc-epoch="${dateInfo.utc.epoch}">${dateInfo.local.date}</span>
                <div class="renew-form" id="renew-form-${member.id}">
                    <!-- Menggunakan ID member.id untuk input dan tombol -->
                    <input type="number" id="inputDaysDelta-${member.unique_key}" step="any" placeholder="1 = one day">
                    <button class="apply-btn" id="apply-btn-${member.unique_key}">Apply</button>
                </div>
            </td>
            <td>${member.unique_key}</td> <!-- Menampilkan unique_key -->
            <td><button class="renew-btn" id="renew-btn-${member.id}">Renew</button></td>
        `;
        tableBody.appendChild(row);

        // Menambahkan event listener untuk tombol Renew
        const renewBtn = document.querySelector(`#renew-btn-${member.id}`);
        renewBtn.addEventListener('click', () => {
            // Bisa langsung pakai member.id di sini tanpa perlu event.target
            handleRenewButton(member.id); 
        });
        // Menambahkan event listener untuk tombol Apply
        const applyBtn = document.querySelector(`#apply-btn-${member.unique_key}`);
        applyBtn.addEventListener('click', () => {
            handleApplyButton(member.unique_key); // Panggil fungsi handleApplyButton
        });

    });
};


// Fungsi untuk menangani event Renew
const handleRenewButton = (id) => {
    console.log(`Renew button clicked from id: ${id}`);
    const renewForm = document.querySelector(`#renew-form-${id}`);
    if (!renewForm) {
        console.error(`Element #renew-form-${id} not found.`);
        return; // Menghentikan eksekusi jika elemen tidak ditemukan
    }
    renewForm.classList.toggle('show');
};

// Fungsi untuk menangani event Apply
const handleApplyButton = (id) => {
    console.log(`Trying to find input element for ID: #inputDaysDelta-${id}`);
    const inputElement = document.querySelector(`#inputDaysDelta-${id}`);
    
    if (!inputElement) {
        console.error(`Input element #inputDaysDelta-${id} not found.`);
        return;
    }

    const daysDelta = parseFloat(inputElement.value);
    console.log(`Apply button clicked from id: ${id}, inputDaysDelta: ${daysDelta}`);
    
    // Mengambil nilai UTC Epoch yang sudah ada
    const spanElement = document.querySelector(`#span-${id}`);
    const utcEpoch = spanElement ? parseInt(spanElement.getAttribute('data-utc-epoch')) : null;
    console.log(`UTC Epoch for member: ${id}, utcEpoch: ${utcEpoch}`);

    if (utcEpoch !== null) {
        // Menghitung jumlah detik berdasarkan daysDelta
        const secondsInOneDay = 86400; // 1 hari = 86400 detik
        const deltaInSeconds = daysDelta * secondsInOneDay;

        // Menambahkan atau mengurangi detik dari UTC Epoch
        const newUtcEpoch = utcEpoch + deltaInSeconds; // Gunakan '-' untuk mengurangi waktu

        console.log(`New UTC Epoch for member ${id}: ${newUtcEpoch}`);
        
        // Konversi kembali dari epoch menjadi tanggal yang bisa dibaca
        const newDate = new Date(newUtcEpoch * 1000); // Konversi ke milidetik
        console.log(`New Date for member ${id}: ${newDate.toLocaleString()}`);

        // Kirimkan PATCH request ke server
        patchMembership(id, newUtcEpoch);
    }
};

// Fungsi untuk melakukan PATCH request ke server
const patchMembership = async (id, newExpiredTime) => {
    try {
        const response = await fetch(`/api/memberships/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                expired_time: newExpiredTime, // Kirim expired_time yang sudah dihitung
            }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Membership successfully patched:', data);
        } else {
            console.error('Failed to patch membership:', data);
        }
    } catch (error) {
        console.error('Error while making PATCH request:', error);
    }
};

// Fungsi untuk mengonversi epoch time ke human-readable date
const epochToHumanDate = (epochTimeInSeconds) => {
    if (!epochTimeInSeconds || epochTimeInSeconds === 0) {
        return {
            local: { date: 'N/A', epoch: 0 },
            utc: { date: 'N/A', epoch: 0 }
        };
    }

    // Membuat objek Date dari epoch time
    const dateObject = new Date(epochTimeInSeconds * 1000);

    // Mendapatkan waktu dalam format lokal
    const localDate = dateObject.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '');

    // Mendapatkan waktu dalam format UTC
    const utcDate = dateObject.toLocaleString('en-US', {
        timeZone: 'UTC', // Zona waktu UTC
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '');

    return {
        local: { date: localDate, epoch: Math.floor(dateObject.getTime() / 1000) },
        utc: { date: utcDate, epoch: Math.floor(dateObject.getTime() / 1000) }
    };
};
// Fungsi untuk mengonversi human-readable date ke epoch time
const humanDateToEpoch = (humanReadableDate) => {
    const dateObject = new Date(humanReadableDate);
    if (isNaN(dateObject.getTime())) {
        console.error('Invalid Date Format:', humanReadableDate);
        return null;
    }
    return Math.floor(dateObject.getTime() / 1000);
};

//------------- region validate members -----------//
document.getElementById('validateMembership-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah form dari reload halaman
    
    // Ambil nilai dari input
    const uniqueKey = document.getElementById('uniqueKey').value;
    
    try {
      // Kirim permintaan ke server menggunakan fetch
      const response = await fetch('api/memberships/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unique_key: uniqueKey }),
      });
  
      // Parse respons menjadi JSON (ini sudah benar)
      const data = await response.json();
  
      // Cek dan parse jika game_list masih berupa string JSON
      if (data.data && typeof data.data.game_list === 'string') {
        try {
          // Parse game_list menjadi objek JavaScript
          data.data.game_list = JSON.parse(data.data.game_list);
        } catch (error) {
          console.error('Error parsing game_list:', error);
        }
      }
  
      // Tampilkan respons di halaman dengan format JSON yang rapi
      document.getElementById('response').textContent = JSON.stringify(data, null, 2);
    
    } catch (error) {
      // Tampilkan error jika ada
      document.getElementById('response').textContent = `Error: ${error.message}`;
    }
  });  
//------------- endregion validate members -----------//

// Panggil fetchMemberships setelah halaman dimuat
document.addEventListener('DOMContentLoaded', fetchMemberships);