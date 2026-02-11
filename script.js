// GASのウェブアプリURL（デプロイして発行されたURLに差し替えてください）
const gasUrl = 'https://script.google.com/macros/s/AKfycbwCRpqqrB6nyhvy51wSG_MZhWyZ4thCC4fkN7xXSjNOwtv9Hgj2aPDUaWg_L0s2kgnr/exec';

let siteList = [];
let materialList = [];

// ページ読み込み時の処理
window.onload = async () => {
    // 今日の日付をデフォルト設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    // GASからマスタデータを取得
    try {
        const response = await fetch(gasUrl);
        const data = await response.json();
        siteList = data.sites;
        materialList = data.materials;
        console.log('Data loaded:', data);
    } catch (e) {
        console.error('データ取得エラー:', e);
        alert('現場リストの取得に失敗しました。');
    }
};

// 現場選択時に他の情報を自動入力
function updateSiteInfo() {
    const siteName = document.getElementById('site').value;
    const site = siteList.find(s => s.name === siteName);
    if (site) {
        document.getElementById('meetingPlace').value = site.location || '';
        document.getElementById('salesStaff').value = site.staff || '';
    }
}

// 行の追加（施工内容 / 材料）
function addRow(containerId) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'dynamic-row';

    if (containerId === 'locationContainer') {
        div.innerHTML = `
            <input type="text" name="loc" placeholder="箇所" class="flex-grow">
            <input type="text" name="locQty" placeholder="数量" style="width:80px;">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
    } else {
        let options = materialList.map(m => `<option value="${m}">${m}</option>`).join('');
        div.innerHTML = `
            <select name="matName" class="flex-grow">
                <option value="">材料を選択</option>
                ${options}
            </select>
            <input type="text" name="matQty" placeholder="数量" style="width:80px;">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
    }
    container.appendChild(div);
}

// ステップ切り替え
function nextStep(step) {
    if (step === 3) {
        generateSummary();
    }
    document.querySelectorAll('.form-step').forEach(el => el.style.display = 'none');
    document.getElementById(`step${step}`).style.display = 'block';
    window.scrollTo(0, 0);
}

// 確認画面の生成
function generateSummary() {
    const summary = document.getElementById('summary');
    const getVal = (id) => document.getElementById(id).value;

    let locHtml = '';
    document.querySelectorAll('#locationContainer .dynamic-row').forEach(row => {
        const loc = row.querySelector('[name="loc"]').value;
        const qty = row.querySelector('[name="locQty"]').value;
        if (loc) locHtml += `<li>${loc}: ${qty}</li>`;
    });

    let matHtml = '';
    document.querySelectorAll('#materialContainer .dynamic-row').forEach(row => {
        const mat = row.querySelector('[name="matName"]').value;
        const qty = row.querySelector('[name="matQty"]').value;
        if (mat) matHtml += `<li>${mat}: ${qty}</li>`;
    });

    summary.innerHTML = `
        <p><strong>現場:</strong> ${getVal('site')}</p>
        <p><strong>作業者:</strong> ${getVal('name')}</p>
        <p><strong>時間:</strong> ${getVal('startTime')} ～ ${getVal('endTime')}</p>
        <hr>
        <p><strong>施工内容:</strong></p><ul>${locHtml || 'なし'}</ul>
        <p><strong>使用材料:</strong></p><ul>${matHtml || 'なし'}</ul>
        <p><strong>備考:</strong><br>${getVal('notes') || 'なし'}</p>
    `;
}

// データの送信処理
function submitData() {
    const btn = document.getElementById('submitBtn');
    if (btn.disabled) return; // 二重送信防止

    btn.disabled = true;
    btn.innerText = '送信中...';

    const getVal = (id) => document.getElementById(id).value;

    // 施工内容配列の作成
    const locationArray = [];
    document.querySelectorAll('#locationContainer .dynamic-row').forEach(row => {
        locationArray.push({
            loc: row.querySelector('[name="loc"]').value,
            qty: row.querySelector('[name="locQty"]').value
        });
    });

    // 材料配列の作成
    const materialArray = [];
    document.querySelectorAll('#materialContainer .dynamic-row').forEach(row => {
        materialArray.push({
            name: row.querySelector('[name="matName"]').value,
            qty: row.querySelector('[name="matQty"]').value
        });
    });

    const formData = {
        date: getVal('date'),
        company: getVal('company'),
        weather: getVal('weather'),
        site: getVal('site'),
        meetingPlace: getVal('meetingPlace'),
        salesStaff: getVal('salesStaff'),
        startTime: getVal('startTime'),
        endTime: getVal('endTime'),
        count: getVal('count'),
        name: getVal('name'),
        notes: getVal('notes'),
        locationArray: locationArray,
        materialArray: materialArray
    };

    fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(formData)
    })
    .then(() => {
        // 送信成功時
        alert('日報の送信が完了しました！\nOKを押すとトーク画面に戻ります。');
        
        // --- 強制的にLINEを閉じる処理 ---
        
        // 1. 標準的なLINEトークへ戻るURL
        window.location.href = "https://line.me/R/";
        
        // 2. 数秒待っても閉じない場合のバックアップ（自動でタブを閉じる）
        setTimeout(() => {
            window.open('about:blank', '_self').close();
        }, 500);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('送信中にエラーが発生しました。電波状況を確認してください。');
        btn.disabled = false;
        btn.innerText = '送信する';
    });
}