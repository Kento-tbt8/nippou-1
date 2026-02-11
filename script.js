// GASのウェブアプリURL
const gasUrl = 'https://script.google.com/macros/s/AKfycbwCE1go-bKHrz8C4ZLOm6591Ou-dSEaQt-A_02yfdY4mlMvBDVylwxv1GOnURv-7KH8/exec';

let globalMaterialList = [];
let siteMasterData = [];

window.addEventListener('load', () => {
    const now = new Date();
    const y = now.getFullYear(), m = ("0"+(now.getMonth()+1)).slice(-2), d = ("0"+now.getDate()).slice(-2);
    document.getElementById('date').value = `${y}-${m}-${d}`;
    
    fetchLists();
    // 施工箇所3行をStep1のコンテナに作成
    for(let i=0; i<3; i++) { 
        createFixedRow('locationContainer', `箇所 ${i+1}`, 'loc-input'); 
    }
});

async function fetchLists() {
    try {
        const res = await fetch(gasUrl);
        const data = await res.json();
        siteMasterData = data.sites;
        globalMaterialList = data.materials;
        
        const siteSelect = document.getElementById('site');
        siteSelect.innerHTML = '<option value="" disabled selected>現場を選択</option>';
        siteMasterData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = s.name;
            siteSelect.appendChild(opt);
        });
        
        addDynamicRow('materialContainer', 'mat-input');
    } catch (e) { console.error('取得失敗'); }
}

document.getElementById('site').addEventListener('change', (e) => {
    const info = siteMasterData.find(s => s.name === e.target.value);
    if (info) {
        document.getElementById('meetingPlace').value = info.location || "未登録";
        document.getElementById('salesStaff').value = info.staff || "未登録";
    }
});

function createFixedRow(containerId, placeholder, inputClass) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<input type="text" class="${inputClass} flex-grow" placeholder="${placeholder}"><input type="text" style="width: 70px;" class="loc-qty" placeholder="数量">`;
    container.appendChild(div);
}

function addDynamicRow(containerId, inputClass) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    let options = '<option value="" disabled selected>材料を選択</option>';
    globalMaterialList.forEach(m => { options += `<option value="${m}">${m}</option>`; });
    div.innerHTML = `<select class="${inputClass} flex-grow">${options}</select><input type="text" style="width: 60px;" placeholder="数量"><button type="button" class="remove-btn">×</button>`;
    container.appendChild(div);
    div.querySelector('.remove-btn').onclick = () => {
        if (container.querySelectorAll('.dynamic-row').length > 1) {
            div.remove();
            updateRemoveButtons(containerId);
        }
    };
    updateRemoveButtons(containerId);
}

function updateRemoveButtons(containerId) {
    const rows = document.getElementById(containerId).querySelectorAll('.dynamic-row');
    rows.forEach(row => {
        const btn = row.querySelector('.remove-btn');
        if (btn) {
            btn.disabled = (rows.length === 1);
            btn.style.opacity = (rows.length === 1) ? "0.3" : "1";
        }
    });
}

const showStep = (s) => {
    ['step1', 'step2', 'step3'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    document.getElementById(`step${s}`).style.display = 'block';
    window.scrollTo(0, 0);
};

// ★ Step1 → Step2 移動時のバリデーション
document.getElementById('nextBtn1').onclick = () => {
    // 基本項目のチェック
    const fields = ['company', 'date', 'startTime', 'endTime', 'weather', 'site', 'memberCount', 'memberName'];
    if (!fields.every(id => document.getElementById(id).value)) { 
        alert('基本項目に未入力があります'); 
        return; 
    }

    // 施工箇所のチェック（少なくとも1つ入力があるか）
    const locInputs = document.querySelectorAll('.loc-input');
    const hasLocInput = Array.from(locInputs).some(input => input.value.trim() !== "");
    if (!hasLocInput) {
        alert('施工箇所を少なくとも1つは入力してください。');
        return; 
    }

    showStep(2);
};

// ★ Step2 → Step3 移動（材料は任意なのでチェックなし）
document.getElementById('nextBtn2').onclick = () => {
    const getVal = (id) => document.getElementById(id).value;
    document.getElementById('conf-company').innerText = getVal('company');
    document.getElementById('conf-date').innerText = getVal('date');
    document.getElementById('conf-weather').innerText = getVal('weather');
    document.getElementById('conf-time').innerText = `${getVal('startTime')} 〜 ${getVal('endTime')}`;
    document.getElementById('conf-site').innerText = getVal('site');
    document.getElementById('conf-meetingPlace').innerText = getVal('meetingPlace');
    document.getElementById('conf-salesStaff').innerText = getVal('salesStaff');
    document.getElementById('conf-name').innerText = getVal('memberName');
    document.getElementById('conf-count').innerText = getVal('memberCount');
    document.getElementById('conf-notes').innerText = getVal('notes') || "なし";
    
    renderConfirmList('loc-input', 'conf-locations-list', '【施工箇所】');
    renderConfirmList('mat-input', 'conf-materials-list', '【使用材料】');
    showStep(3);
};

function renderConfirmList(inputClass, targetId, title) {
    const container = document.getElementById(targetId);
    container.innerHTML = `<strong>${title}</strong>`;
    document.querySelectorAll(`.${inputClass}`).forEach(input => {
        if (input.value) {
            const div = document.createElement('div');
            const qtyInput = input.nextElementSibling;
            const qty = (qtyInput && qtyInput.value) ? qtyInput.value : 0;
            div.innerText = `・${input.value} ： ${qty}`;
            container.appendChild(div);
        }
    });
}

document.getElementById('addMaterialBtn').onclick = () => addDynamicRow('materialContainer', 'mat-input');
document.getElementById('backBtn1').onclick = () => showStep(1);
document.getElementById('backBtn2').onclick = () => showStep(2);

document.getElementById('reportForm').onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.innerText = "送信中...";
    
    const locArray = Array.from(document.querySelectorAll('.loc-input')).map(v => ({
        loc: v.value, qty: v.nextElementSibling.value || 0
    })).filter(i => i.loc !== "");
    
    const matArray = Array.from(document.querySelectorAll('.mat-input')).map(v => ({
        name: v.value, qty: v.nextElementSibling.value || 0
    })).filter(i => i.name !== "");
    
    const payload = {
        company: document.getElementById('company').value, date: document.getElementById('date').value,
        startTime: document.getElementById('startTime').value, endTime: document.getElementById('endTime').value,
        weather: document.getElementById('weather').value, site: document.getElementById('site').value,
        meetingPlace: document.getElementById('meetingPlace').value, salesStaff: document.getElementById('salesStaff').value,
        name: document.getElementById('memberName').value, count: document.getElementById('memberCount').value,
        notes: document.getElementById('notes').value, locationArray: locArray, materialArray: matArray
    };

    try {
        await fetch(gasUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        alert('日報の送信が完了しました！\nOKを押すとトーク画面に戻ります。');
        window.location.href = "https://s.lmes.jp/landing-qr/2008206389-v2GmkqBg?uLand=jHRWfS";
    } catch (e) { 
        alert('送信失敗'); btn.disabled = false; btn.innerText = "送信する"; 
    }
};