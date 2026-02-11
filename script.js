const gasUrl = 'https://script.google.com/macros/s/AKfycbykbPrBVQIDCHVsIgYiZrGwOhZLdn8w_6cSeuD6gYhBO1PyoTw9l4vmeeeg3we8dxmx/exec'; // ★最新のURLに差し替え
let globalMaterialList = [];
let siteMasterData = [];

window.addEventListener('load', () => {
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
    fetchLists();

    // 施工箇所：初期3枠
    for(let i=0; i<3; i++) {
        createFixedRow('locationContainer', `施工箇所 ${i+1}`, 'loc-input');
    }

    // Enterキー誤送信防止（Textarea以外）
    document.getElementById('reportForm').onkeydown = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            if (e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        }
    };
});

async function fetchLists() {
    const siteSelect = document.getElementById('site');
    try {
        const res = await fetch(gasUrl);
        const data = await res.json();
        siteMasterData = data.sites;
        siteSelect.innerHTML = '<option value="" disabled selected>現場を選択</option>';
        siteMasterData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = s.name;
            siteSelect.appendChild(opt);
        });
        globalMaterialList = data.materials;
        addDynamicRow('materialContainer', 'mat-input');
    } catch (e) {
        siteSelect.innerHTML = '<option value="">読込失敗</option>';
    }
}

// 現場選択時に情報を自動セット
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
    div.innerHTML = `
        <input type="text" class="${inputClass} flex-grow" placeholder="${placeholder}">
        <input type="text" style="width: 70px;" class="loc-qty" placeholder="数量">
    `;
    container.appendChild(div);
}

function addDynamicRow(containerId, inputClass) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    let options = '<option value="" disabled selected>材料を選択</option>';
    globalMaterialList.forEach(m => { options += `<option value="${m}">${m}</option>`; });
    div.innerHTML = `
        <select class="${inputClass} flex-grow">${options}</select>
        <input type="text" style="width: 60px;" placeholder="数量">
        <button type="button" class="remove-btn">×</button>
    `;
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
    const container = document.getElementById(containerId);
    const buttons = container.querySelectorAll('.remove-btn');
    buttons.forEach(btn => { btn.disabled = (buttons.length <= 1); });
}

const showStep = (s) => {
    ['step1', 'step2', 'step3'].forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById(`step${s}`).style.display = 'block';
    window.scrollTo(0, 0);
};

// バリデーション
document.getElementById('nextBtn1').onclick = () => {
    const fields = ['company', 'date', 'startTime', 'endTime', 'weather', 'site', 'memberCount', 'memberName'];
    const firstLoc = document.querySelectorAll('.loc-input')[0].value;
    const firstQty = document.querySelectorAll('.loc-qty')[0].value;
    const allFilled = fields.every(id => document.getElementById(id).value) && firstLoc && firstQty;
    if (!allFilled) {
        alert('未入力の項目があります。');
        return;
    }
    showStep(2);
};

// 確認画面への反映
document.getElementById('nextBtn2').onclick = () => {
    document.getElementById('conf-company').innerText = document.getElementById('company').value;
    document.getElementById('conf-date').innerText = document.getElementById('date').value;
    document.getElementById('conf-time-weather').innerText = `${document.getElementById('startTime').value}～${document.getElementById('endTime').value} / ${document.getElementById('weather').value}`;
    document.getElementById('conf-site').innerText = document.getElementById('site').value;
    
    // 独立した行として表示
    document.getElementById('conf-meetingPlace').innerText = document.getElementById('meetingPlace').value;
    document.getElementById('conf-salesStaff').innerText = document.getElementById('salesStaff').value;
    
    document.getElementById('conf-name').innerText = document.getElementById('memberName').value;
    document.getElementById('conf-count').innerText = document.getElementById('memberCount').value;
    document.getElementById('conf-notes').innerText = document.getElementById('notes').value || "なし";
    
    renderConfirmList('loc-input', 'conf-locations-list');
    renderConfirmList('mat-input', 'conf-materials-list');
    showStep(3);
};

function renderConfirmList(inputClass, targetId) {
    const container = document.getElementById(targetId);
    container.innerHTML = '';
    document.querySelectorAll(`.${inputClass}`).forEach(input => {
        const qty = input.nextElementSibling.value || 0;
        if (input.value) {
            const div = document.createElement('div');
            div.innerText = `・${input.value} ： ${qty}`;
            container.appendChild(div);
        }
    });
}

document.getElementById('backBtn1').onclick = () => showStep(1);
document.getElementById('backBtn2').onclick = () => showStep(2);
document.getElementById('addMaterialBtn').onclick = () => addDynamicRow('materialContainer', 'mat-input');

document.getElementById('reportForm').onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerText = "送信中...";

    const locArray = Array.from(document.querySelectorAll('.loc-input')).map(v => ({ loc: v.value, qty: v.nextElementSibling.value || 0 })).filter(i => i.loc !== "");
    const matArray = Array.from(document.querySelectorAll('.mat-input')).map(v => ({ name: v.value, qty: v.nextElementSibling.value || 0 })).filter(i => i.name !== "");

    const payload = {
        company: document.getElementById('company').value,
        date: document.getElementById('date').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        weather: document.getElementById('weather').value,
        site: document.getElementById('site').value,
        meetingPlace: document.getElementById('meetingPlace').value,
        salesStaff: document.getElementById('salesStaff').value,
        name: document.getElementById('memberName').value,
        count: document.getElementById('memberCount').value,
        notes: document.getElementById('notes').value,
        locationArray: locArray,
        materialArray: matArray
    };

    try {
        await fetch(gasUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        alert('報告完了しました！');
        location.reload();
    } catch (e) {
        alert('エラーが発生しました。');
        btn.disabled = false;
        btn.innerText = "送信する";
    }
};