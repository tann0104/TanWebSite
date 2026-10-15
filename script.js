// --- 1. Supabaseの接続設定 ---
const SUPABASE_URL = 'https://vsrzssmiwbczqvftnuaz.supabase.co'; // ご自身のSupabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_gaIh0oTHZoeF6CMVWci1fA_LAiH_Qgl'; // ご自身のAnon Key
const CORRECT_PASSWORD = '@Tann0104'; // 🔑 管理者用パスワード

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allSites = []; 
let currentTag = 'all'; 
let isAdmin = false; // 管理者フラグ

// --- 2. 管理者認証モーダルの処理 ---
const urlParams = new URLSearchParams(window.location.search);
const passwordModal = document.getElementById('passwordModal');
const passwordForm = document.getElementById('passwordForm');
const openFormBtn = document.getElementById('openFormBtn');

if (urlParams.has('admin')) {
    // ?admin がある場合は認証用モーダルを表示
    passwordModal.classList.remove('hidden');
}

passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputPassword = document.getElementById('inputPassword').value;

    if (inputPassword === CORRECT_PASSWORD) {
        isAdmin = true;
        passwordModal.classList.add('hidden');
        openFormBtn.classList.remove('hidden'); // 「作品を追加」ボタンを表示
        displaySites(allSites); // 削除ボタン付きでカードを再描画
        alert('管理者モードでログインしました 🔓');
    } else {
        alert('パスワードが間違っています 💦 トップページに戻ります。');
        window.location.href = 'https://tann.f5.si/'; // 指定のURLへ戻す
    }
});

// --- 3. 作品追加フォームモーダルの開閉 ---
const formModal = document.getElementById('formModal');
const closeFormBtn = document.getElementById('closeFormBtn');

openFormBtn.addEventListener('click', () => formModal.classList.remove('hidden'));
closeFormBtn.addEventListener('click', () => formModal.classList.add('hidden'));

// --- 4. データの取得 ---
async function fetchSites() {
    const { data, error } = await supabaseClient
        .from('sites')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('データの取得に失敗しました:', error.message);
        return;
    }

    allSites = data || [];
    displaySites(allSites);
    setupTagButtons(allSites);
}

// --- 5. 画面にカードを表示する関数 ---
const siteList = document.getElementById('siteList');
function displaySites(sites) {
    siteList.innerHTML = '';

    if (sites.length === 0) {
        siteList.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10">作品がまだ見つからないよ…💦</p>`;
        return;
    }

    sites.forEach(site => {
        const tagsHtml = site.tags ? site.tags.map(tag => 
            `<span class="bg-pink-100 text-pink-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold">#${tag}</span>`
        ).join('') : '';

        // 管理者モードの時だけ削除ボタンを組み立てる
        const deleteBtnHtml = isAdmin ? 
            `<button onclick="deleteSite(${site.id})" class="w-full mt-2 py-1 bg-red-100 hover:bg-red-200 text-red-500 rounded-full text-[11px] font-bold transition cursor-pointer">
                🗑️ 削除する
            </button>` : '';

        const card = document.createElement('div');
        card.className = "macaron-card bg-white rounded-3xl p-5 border border-pink-100 shadow-sm flex flex-col justify-between";
        card.innerHTML = `
            <div>
                ${site.thumbnail ? `<img src="${site.thumbnail}" alt="${site.title}" class="w-full h-36 object-cover rounded-2xl mb-4 bg-pink-50">` : ''}
                <h3 class="font-bold text-gray-700 text-lg mb-1">${site.title}</h3>
                <p class="text-xs text-gray-400 mb-3 line-clamp-2">${site.description || ''}</p>
            </div>
            <div>
                <div class="flex flex-wrap gap-1 mb-4">${tagsHtml}</div>
                <a href="${site.url}" target="_blank" class="block text-center w-full py-2 bg-pink-300 hover:bg-pink-400 text-white rounded-full text-xs font-bold transition shadow-sm">
                    サイトを見る 🚀
                </a>
                ${deleteBtnHtml}
            </div>
        `;
        siteList.appendChild(card);
    });
}

// --- 6. 作品削除処理 ---
async function deleteSite(id) {
    if (!confirm('本当にこの作品を削除しますか？')) return;

    const { error } = await supabaseClient
        .from('sites')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('削除に失敗しました:', error.message);
        alert('削除に失敗しました 💦');
        return;
    }

    alert('作品を削除しました 🗑️');
    fetchSites(); // 画面を更新
}

// --- 7. タグボタン生成 ＆ 検索機能 ---
function setupTagButtons(sites) {
    const tagSet = new Set();
    sites.forEach(site => {
        if (site.tags) site.tags.forEach(tag => tagSet.add(tag));
    });

    const tagFilters = document.getElementById('tagFilters');
    tagFilters.innerHTML = `<button class="tag-btn px-4 py-1.5 rounded-full text-xs font-bold bg-pink-400 text-white shadow-sm transition" data-tag="all">すべて</button>`;

    tagSet.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = "tag-btn px-4 py-1.5 rounded-full text-xs font-bold bg-white text-gray-500 border border-pink-200 hover:bg-pink-50 transition shadow-sm";
        btn.textContent = `#${tag}`;
        btn.dataset.tag = tag;
        tagFilters.appendChild(btn);
    });

    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tag-btn').forEach(b => {
                b.className = "tag-btn px-4 py-1.5 rounded-full text-xs font-bold bg-white text-gray-500 border border-pink-200 hover:bg-pink-50 transition shadow-sm";
            });
            e.target.className = "tag-btn px-4 py-1.5 rounded-full text-xs font-bold bg-pink-400 text-white shadow-sm transition";
            
            currentTag = e.target.dataset.tag;
            filterSites();
        });
    });
}

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', filterSites);

function filterSites() {
    const keyword = searchInput.value.toLowerCase();

    const filtered = allSites.filter(site => {
        const matchesTag = currentTag === 'all' || (site.tags && site.tags.includes(currentTag));
        const matchesKeyword = site.title.toLowerCase().includes(keyword) || (site.description && site.description.toLowerCase().includes(keyword));
        return matchesTag && matchesKeyword;
    });

    displaySites(filtered);
}

// --- 8. 作品追加の処理 ---
const addSiteForm = document.getElementById('addSiteForm');
addSiteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('newTitle').value;
    const description = document.getElementById('newDescription').value;
    const url = document.getElementById('newUrl').value;
    const thumbnail = document.getElementById('newThumbnail').value;
    const tagsInput = document.getElementById('newTags').value;

    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== "") : [];

    const { error } = await supabaseClient
        .from('sites')
        .insert([{ title, description, url, thumbnail, tags }]);

    if (error) {
        console.error('追加に失敗しました:', error.message);
        alert('追加に失敗しました 💦');
        return;
    }

    alert('新しい作品を追加したよ！🎉');
    addSiteForm.reset();
    formModal.classList.add('hidden'); // モーダルを閉じる
    fetchSites();
});

// ページ読み込み時に実行
fetchSites();