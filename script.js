const gasUrl = 'https://script.google.com/macros/s/AKfycbwCRpqqrB6nyhvy51wSG_MZhWyZ4thCC4fkN7xXSjNOwtv9Hgj2aPDUaWg_L0s2kgnr/exec';
let globalMaterialList = [];
let siteMasterData = [];

window.addEventListener('load', () => {
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
    fetchLists();
    for(let i=0; i<3; i++) { createFixedRow('locationContainer', `施工箇所 ${i+1}`, 'loc-input'); }
});

async function fetchLists() {
    try {
        const res = await fetch(gasUrl);
        const data = await res.json();
        siteMasterData = data.sites;
        const siteSelect = document.getElementById('site');
        siteSelect.innerHTML = '<option value="" disabled selected>現場を選択</option>';
        siteMasterData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = s.name;
            siteSelect.appendChild(opt);
        });
        globalMaterialList = data.materials;
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
    updateRemoveButtons(containerId); // 行追加時に判定
}

// ★削除ボタンの有効/無効を切り替える関数
function updateRemoveButtons(containerId) {
    const rows = document.getElementById(containerId).querySelectorAll('.dynamic-row');
    rows.forEach(row => {
        const btn = row.querySelector('.remove-btn');
        if (btn) {
            btn.disabled = (rows.length === 1); // 1つしかなければ無効化
        }
    });
}

const showStep = (s) => {
    ['step1', 'step2', 'step3'].forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById(`step${s}`).style.display = 'block';
    window.scrollTo(0, 0);
};

document.getElementById('nextBtn1').onclick = () => {
    const fields = ['company', 'date', 'startTime', 'endTime', 'weather', 'site', 'memberCount', 'memberName'];
    if (!fields.every(id => document.getElementById(id).value)) { alert('未入力あり'); return; }
    showStep(2);
};

document.getElementById('nextBtn2').onclick = () => {
    document.getElementById('conf-company').innerText = document.getElementById('company').value;
    document.getElementById('conf-date').innerText = document.getElementById('date').value;
    document.getElementById('conf-weather').innerText = document.getElementById('weather').value;
    document.getElementById('conf-time').innerText = `${document.getElementById('startTime').value} 〜 ${document.getElementById('endTime').value}`;
    document.getElementById('conf-site').innerText = document.getElementById('site').value;
    document.getElementById('conf-meetingPlace').innerText = document.getElementById('meetingPlace').value;
    document.getElementById('conf-salesStaff').innerText = document.getElementById('salesStaff').value;
    document.getElementById('conf-name').innerText = document.getElementById('memberName').value;
    document.getElementById('conf-count').innerText = document.getElementById('memberCount').value;
    document.getElementById('conf-notes').innerText = document.getElementById('notes').value || "なし";
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
            div.innerText = `・${input.value} ： ${input.nextElementSibling.value || 0}`;
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
    btn.disabled = true; btn.innerText = "送信中...";
    const locArray = Array.from(document.querySelectorAll('.loc-input')).map(v => ({ loc: v.value, qty: v.nextElementSibling.value || 0 })).filter(i => i.loc !== "");
    const matArray = Array.from(document.querySelectorAll('.mat-input')).map(v => ({ name: v.value, qty: v.nextElementSibling.value || 0 })).filter(i => i.name !== "");
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
        alert('報告完了！');
        location.reload();
    } catch (e) { alert('送信失敗'); btn.disabled = false; btn.innerText = "送信する"; }
};