// --- 1. Supabaseの接続設定 ---
const SUPABASE_URL = 'https://vsrzssmiwbczqvftnuaz.supabase.co'; // ご自身のSupabaseのURLに書き換えてね
const SUPABASE_ANON_KEY = 'sb_publishable_gaIh0oTHZoeF6CMVWci1fA_LAiH_Qgl'; // ご自身のAnon Keyに書き換えてね

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allSites = []; // 取得した全データを保持する変数
let currentTag = 'all'; // 現在選択されているタグ

// --- 2. データの取得 ---
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

// --- 3. 画面にカードを表示する関数 ---
const siteList = document.getElementById('siteList');
function displaySites(sites) {
    siteList.innerHTML = '';

    if (sites.length === 0) {
        siteList.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10">作品がまだ見つからないよ…💦下のフォームから追加してね！</p>`;
        return;
    }

    sites.forEach(site => {
        // タグのバッジを作成
        const tagsHtml = site.tags ? site.tags.map(tag => 
            `<span class="bg-pink-100 text-pink-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold">#${tag}</span>`
        ).join('') : '';

        // カードのHTML要素を作成
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
            </div>
        `;
        siteList.appendChild(card);
    });
}

// --- 4. タグボタンを自動生成する関数 ---
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

// --- 5. 検索とタグ絞り込みの連動 ---
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

// --- 6. パスワード付き作品追加フォームの処理 ---
const addSiteForm = document.getElementById('addSiteForm');
addSiteForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // ページの再読み込みを防ぐ

    // パスワードの確認（お好みの合言葉に変更してね！）
    const passwordInput = document.getElementById('adminPassword').value;
    const CORRECT_PASSWORD = 'macaron123'; 

    if (passwordInput !== CORRECT_PASSWORD) {
        alert('パスワードが違うよ！💦 正しい合言葉を入力してね。');
        return;
    }

    // フォームに入力された値を取得
    const title = document.getElementById('newTitle').value;
    const description = document.getElementById('newDescription').value;
    const url = document.getElementById('newUrl').value;
    const thumbnail = document.getElementById('newThumbnail').value;
    const tagsInput = document.getElementById('newTags').value;

    // カンマ区切りのタグを配列に変換する（例: "ゲーム, パズル" → ["ゲーム", "パズル"]）
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== "") : [];

    // Supabaseにデータを送信
    const { data, error } = await supabaseClient
        .from('sites')
        .insert([{ title, description, url, thumbnail, tags }]);

    if (error) {
        console.error('データの追加に失敗しました:', error.message);
        alert('追加に失敗しちゃいました…💦 コンソールを確認してね！');
        return;
    }

    alert('パスワード認証OK！新しい作品を追加したよ！🎉');
    addSiteForm.reset(); // フォームを空にする
    fetchSites(); // 一覧画面を最新の状態に再読み込みする
});

// ページ読み込み時にデータを取得して実行
fetchSites();