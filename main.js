const firebaseConfig = {
    apiKey: "AIzaSyC1_0S-863Y5Tm6D3eLk_ZA186U-MUIpJM",
    authDomain: "noman-clouth-house.firebaseapp.com",
    projectId: "noman-clouth-house",
    storageBucket: "noman-clouth-house.firebasestorage.app",
    messagingSenderId: "921836985089",
    appId: "1:921836985089:web:6305ea5d0cfc24e0cbd900",
    measurementId: "G-8576NHS6C9"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let products = [];
let cart = [];
let activeCategory = 'all';
let currentUid = '';
let currentOrderTab = 'pending';
let myUserOrders = [];

const pakistaniCities = [
    "Abbas Pur-Azad kashmir", "Abbottabad-Khyber Pakhtunkhwa", "Abdul Hakim-Punjab", 
    "Ahmed Pur East-Punjab", "Ahmedpur Sial-Punjab", "Akora Khattak-Khyber Pakhtunkhwa", 
    "Ali Pur Chatta-Punjab", "Arifwala-Punjab", "Attock-Punjab", "Badin-Sindh", 
    "Bagh-Azad kashmir", "Bahawalnagar-Punjab", "Bahawalpur-Punjab", "Bannu-Khyber Pakhtunkhwa", 
    "Bhalwal-Punjab", "Bhimber-A.K-Azad kashmir", "Burewala-Punjab", "Chakwal-Punjab", 
    "Charsadda-Khyber Pakhtunkhwa", "Chichawatni-Punjab", "Chiniot-Faisalabad-Punjab", 
    "Chishtian-Punjab", "Dadu-Sindh", "Dera Ghazi Khan-Punjab", "Faisalabad-Punjab", 
    "Gojra-Punjab", "Gujar Khan-Punjab", "Gujranwala-Punjab", "Gujrat-Punjab", 
    "Hafizabad-Punjab", "Haripur-Khyber Pakhtunkhwa", "Hyderabad-Sindh", "Islamabad-Federal", 
    "Jacobabad-Sindh", "Jaranwala-Punjab", "Jhang-Punjab", "Jhelum-Punjab", "Kamoke-Punjab", 
    "Karachi-Sindh", "Kasur-Punjab", "Khanewal-Punjab", "Khushab-Punjab", "Kohat-Khyber Pakhtunkhwa", 
    "Lahore-Punjab", "Larkana-Sindh", "Mandi Bahauddin-Punjab", "Mansehra-Khyber Pakhtunkhwa", 
    "Mardan-Khyber Pakhtunkhwa", "Mianwali-Punjab", "Multan-Punjab", "Murree-Punjab", 
    "Muzaffarabad-Azad kashmir", "Muzaffargarh-Punjab", "Nawabshah-Sindh", "Nowshera-Khyber Pakhtunkhwa", 
    "Okara-Punjab", "Pakpattan-Punjab", "Peshawar-Khyber Pakhtunkhwa", "Quetta-Balochistan", 
    "Rahim Yar Khan-Punjab", "Rawalpindi-Punjab", "Sadiqabad-Punjab", "Sahiwal-Punjab", 
    "Sargodha-Punjab", "Sheikhupura-Punjab", "Sialkot-Punjab", "Sukkur-Sindh", "Vehari-Punjab", "Wah Cantt-Punjab"
];
let selectedCity = "";

document.addEventListener('DOMContentLoaded', () => {
    auth.signInAnonymously().then((userCredential) => {
        currentUid = userCredential.user.uid;
        document.getElementById('userUidDisplay').innerText = currentUid;
    }).catch((error) => {
        console.error("Auth error:", error);
        document.getElementById('userUidDisplay').innerText = "Offline / Guest";
    });

    fetchProductsFromFirestore();
    lucide.createIcons();
});

function fetchProductsFromFirestore() {
    db.collection("products").get().then((querySnapshot) => {
        products = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let imgList = [];
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                imgList = data.images;
            } else if (data.image) {
                imgList = [data.image];
            } else {
                imgList = ["https://placehold.co/400x400/e2e8f0/1e293b?text=Noman+Cloth"];
            }

            products.push({ 
                firestoreId: doc.id, 
                id: Number(data.id) || Math.floor(1000 + Math.random() * 9000),
                name: data.title || data.name || "Outfit",
                category: data.category || data.catagory || "Men's Unstitched",
                price: Number(data.price) || 0,
                images: imgList,
                image: imgList[0],
                description: data.description || "Premium quality fabric, fast colors guarantee.",
                stock: (data.stockStatus === "Sold Out" || data.stockstatus === "Sold Out") ? 0 : 10
            });
        });

        applyFiltersAndRender();
        renderHomeTrending();
    }).catch((error) => {
        console.error("Error getting products: ", error);
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${tabId}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
        if (b.dataset.tab === tabId) {
            b.className = 'nav-btn active flex flex-col items-center gap-1 text-slate-900';
        } else {
            b.className = 'nav-btn flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900';
        }
    });
    window.scrollTo(0,0);
}

function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    if(items.length === 0) {
        grid.innerHTML = `<p class="text-xs text-slate-400 text-center py-8 col-span-2">No products found.</p>`;
        return;
    }
    items.forEach(p => {
        const isOut = (p.stock !== undefined && p.stock <= 0);
        const imgCount = p.images ? p.images.length : 1;
        const card = `
            <div onclick="openProductDetail(${p.id})" class="cursor-pointer group">
                <div class="relative w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-2">
                    <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    <span class="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur">${imgCount} 📷</span>
                    ${isOut ? '<span class="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg">Sold Out</span>' : ''}
                    <button onclick="event.stopPropagation(); addToCart(${p.id});" class="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur text-slate-800 flex items-center justify-center shadow-xs hover:bg-slate-900 hover:text-white transition">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                    </button>
                </div>
                <h3 class="text-xs font-semibold text-slate-800 truncate">${p.name}</h3>
                <p class="text-[11px] font-bold text-slate-900">Rs. ${Number(p.price).toLocaleString()}</p>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
    lucide.createIcons();
}

function renderHomeTrending() {
    const container = document.getElementById('homeTrendingGrid');
    container.innerHTML = '';
    if(products.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 col-span-2">Loading...</p>`;
        return;
    }
    products.slice(0, 4).forEach(p => {
        const card = `
            <div onclick="openProductDetail(${p.id})" class="cursor-pointer bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
                <div class="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden mb-2">
                    <img src="${p.image}" class="w-full h-full object-cover">
                </div>
                <h4 class="text-xs font-bold text-slate-800 truncate">${p.name}</h4>
                <p class="text-[11px] font-semibold text-slate-900">Rs. ${Number(p.price).toLocaleString()}</p>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });
    lucide.createIcons();
}

function filterCategory(cat, btn) {
    activeCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(b => {
        b.className = 'cat-pill bg-slate-100 text-slate-600 px-4 py-2 rounded-xl whitespace-nowrap transition';
    });
    btn.className = 'cat-pill active bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition';

    document.getElementById('searchInput').value = '';
    applyFiltersAndRender();
}

function handleSearch() {
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();

    let result = products.filter(p => {
        return (activeCategory === 'all' || p.category === activeCategory);
    });

    if (query.length >= 2) {
        result = result.filter(p => {
            const nameStr = (p.name || '').toLowerCase();
            const descStr = (p.description || '').toLowerCase();
            const catStr = (p.category || '').toLowerCase();
            return nameStr.includes(query) || descStr.includes(query) || catStr.includes(query);
        });
    }

    renderProducts(result);
}

function openProductDetail(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('d-title').innerText = p.name;
    document.getElementById('d-price').innerText = `Rs. ${Number(p.price).toLocaleString()}`;
    document.getElementById('d-category').innerText = p.category;
    document.getElementById('d-desc').innerText = p.description || 'No description available.';

    const sliderContainer = document.getElementById('sliderImagesContainer');
    sliderContainer.innerHTML = '';
    const totalImgs = p.images.length;

    p.images.forEach((imgUrl) => {
        sliderContainer.insertAdjacentHTML('beforeend', `
            <div class="w-full h-full flex-shrink-0 snap-center">
                <img src="${imgUrl}" class="w-full h-full object-cover">
            </div>
        `);
    });

    document.getElementById('imageCounterBadge').innerText = `1/${totalImgs}`;

    sliderContainer.onscroll = function() {
        const scrollLeft = sliderContainer.scrollLeft;
        const width = sliderContainer.clientWidth;
        const currentIndex = Math.round(scrollLeft / width) + 1;
        document.getElementById('imageCounterBadge').innerText = `${currentIndex}/${totalImgs}`;
    };

    const addToCartBtn = document.getElementById('d-addToCartBtn');
    const stockVal = p.stock !== undefined ? p.stock : 10;

    if (stockVal > 0) {
        addToCartBtn.disabled = false;
        addToCartBtn.className = "w-full py-3.5 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition flex items-center justify-center gap-2";
        addToCartBtn.onclick = () => {
            addToCart(p.id);
            closeProductDetail();
            switchTab('cart');
        };
    } else {
        addToCartBtn.disabled = true;
        addToCartBtn.className = "w-full py-3.5 bg-slate-300 text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed flex items-center justify-center gap-2";
        addToCartBtn.onclick = null;
    }

    document.getElementById('productDetailView').classList.remove('hidden');
    window.scrollTo(0,0);
}

function closeProductDetail() {
    document.getElementById('productDetailView').classList.add('hidden');
}

function openCityModal() {
    document.getElementById('cityModal').classList.remove('hidden');
    renderCityList(pakistaniCities);
    lucide.createIcons();
}

function closeCityModal() {
    document.getElementById('cityModal').classList.add('hidden');
}

function renderCityList(cities) {
    const container = document.getElementById('cityListContainer');
    container.innerHTML = '';
    cities.forEach(city => {
        const item = `
            <div onclick="selectCity('${city}')" class="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <span class="text-slate-700">${city}</span>
                ${selectedCity === city ? '<i data-lucide="check" class="w-4 h-4 text-slate-900"></i>' : ''}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', item);
    });
    lucide.createIcons();
}

function filterCityList() {
    const query = document.getElementById('citySearchInput').value.toLowerCase();
    const filtered = pakistaniCities.filter(c => c.toLowerCase().includes(query));
    renderCityList(filtered);
}

function selectCity(city) {
    selectedCity = city;
    document.getElementById('selectedCityText').innerText = city;
    document.getElementById('selectedCityText').className = "text-slate-900 font-bold";
    closeCityModal();
}

function openOrderHistory() {
    document.getElementById('orderHistoryModal').classList.remove('hidden');
    fetchMyOrders();
}

function closeOrderHistory() {
    document.getElementById('orderHistoryModal').classList.add('hidden');
}

function switchOrderTab(status, btn) {
    currentOrderTab = status;
    document.querySelectorAll('.order-tab-btn').forEach(b => {
        b.className = "order-tab-btn py-2.5 rounded-xl bg-slate-100 text-slate-600 transition text-center";
    });
    btn.className = "order-tab-btn py-2.5 rounded-xl bg-slate-900 text-white transition text-center shadow-xs";
    renderFilteredOrders();
}

function fetchMyOrders() {
    const container = document.getElementById('orderHistoryList');
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Loading orders...</p>`;

    db.collection("orders").where("userUid", "==", currentUid).get().then((snapshot) => {
        myUserOrders = [];
        snapshot.forEach(doc => {
            myUserOrders.push({ id: doc.id, ...doc.data() });
        });
        renderFilteredOrders();
    }).catch(err => {
        console.error("Error fetching orders:", err);
        container.innerHTML = `<p class="text-xs text-rose-500 text-center py-6">Failed to load orders.</p>`;
    });
}

function renderFilteredOrders() {
    const container = document.getElementById('orderHistoryList');
    container.innerHTML = '';

    const filtered = myUserOrders.filter(o => {
        const s = (o.status || 'pending').toLowerCase();
        if (currentOrderTab === 'pending') return s === 'pending';
        if (currentOrderTab === 'processing') return s === 'processing' || s === 'shipped';
        if (currentOrderTab === 'delivered') return s === 'delivered';
        return false;
    });

    if(filtered.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">No ${currentOrderTab} orders found.</p>`;
        return;
    }

    filtered.forEach(o => {
        const itemsStr = (o.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
        const card = `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2 text-xs">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-slate-900">${o.orderId || 'N/A'}</span>
                    <span class="font-bold text-slate-900">Rs. ${(o.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div class="text-[11px] text-slate-600 space-y-1">
                    <p><strong>Items:</strong> ${itemsStr}</p>
                    <p><strong>City:</strong> ${o.customerInfo ? o.customerInfo.city : 'N/A'}</p>
                    <p class="text-[10px] text-slate-400">Date: ${o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 uppercase tracking-wider text-slate-700">${o.status || 'pending'}</span>
                    <span class="text-[10px] text-slate-400">${o.paymentMethod || 'COD'}</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });
}

function openSubPage(type) {
    const titles = {
        faq: 'Frequently Asked Questions',
        feedback: 'Send Feedback',
        terms: 'Terms & Conditions',
        about: 'About Noman Cloth House'
    };
    const contents = {
        faq: '<p><strong>Q: How can I place an order?</strong><br>A: Simply add items to your cart, fill in your delivery details, and select Cash on Delivery.</p><p><strong>Q: What is delivery time?</strong><br>A: Delivery usually takes 3-5 business days across Pakistan.</p>',
        feedback: '<p>We love hearing from our customers! Reach out to us directly via WhatsApp or email for any support or feedback.</p>',
        terms: '<p>All orders placed on Noman Cloth House are processed under standard retail policies. Cash on Delivery requires correct recipient phone verification.</p>',
        about: '<p>Noman Cloth House is your premier online destination for high-quality stitched, unstitched clothing and footwear in Pakistan. Powered by secure Firebase infrastructure.</p>'
    };

    document.getElementById('subPageTitle').innerText = titles[type];
    document.getElementById('subPageContent').innerHTML = contents[type];
    document.getElementById('subPageModal').classList.remove('hidden');
    window.scrollTo(0,0);
}

function closeSubPage() {
    document.getElementById('subPageModal').classList.add('hidden');
}

function addToCart(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...p, qty: 1 });
    }
    updateCartUI();
}

function increaseQty(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty++;
        updateCartUI();
    }
}

function decreaseQty(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cartCountBadge');
    const container = document.getElementById('cartItemsList');
    let total = 0;

    if (cart.length > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');

    container.innerHTML = '';
    if (cart.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Your cart is empty</p>`;
    }

    cart.forEach(item => {
        total += item.price * item.qty;
        const html = `
            <div class="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-xs text-xs">
                <div class="flex items-center gap-3">
                    <img src="${item.image}" class="w-12 h-12 rounded-xl object-cover">
                    <div>
                        <p class="font-bold text-slate-800">${item.name}</p>
                        <p class="text-[11px] font-bold text-slate-900 mt-0.5">Rs. ${(item.price * item.qty).toLocaleString()}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <button onclick="decreaseQty(${item.id})" class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200">-</button>
                            <span class="font-bold text-slate-800 text-xs">${item.qty}</span>
                            <button onclick="increaseQty(${item.id})" class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200">+</button>
                        </div>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.id})" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    document.getElementById('cartTotalText').innerText = `Rs. ${total.toLocaleString()}`;
    lucide.createIcons();
}

function submitOrderToFirestore() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const whatsapp = document.getElementById('custWhatsapp').value.trim();
    const area = document.getElementById('custArea').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const landmark = document.getElementById('custLandmark').value.trim();

    if(!name || !phone || !selectedCity || !address) {
        alert("Please fill in Name, Phone, City, and Full Address!");
        return;
    }

    const orderId = "NCH-" + Math.floor(100000 + Math.random() * 900000);
    
    const orderPayload = {
        orderId: orderId,
        userUid: currentUid,
        createdAt: new Date().toISOString(),
        totalAmount: cart.reduce((acc, i) => acc + (i.price * i.qty), 0),
        status: 'pending',
        paymentMethod: 'Cash on Delivery (COD)',
        items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty
        })),
        customerInfo: {
            name: name,
            phone: phone,
            whatsapp: whatsapp,
            city: selectedCity,
            area: area,
            address: address,
            landmark: landmark
        }
    };

    db.collection("orders").add(orderPayload)
    .then(() => {
        alert("✅ Order Placed Successfully via COD!");
        cart = [];
        updateCartUI();
        switchTab('home');
    })
    .catch((error) => {
        console.error("Error adding order: ", error);
        alert("Error placing order. Check console.");
    });
}
