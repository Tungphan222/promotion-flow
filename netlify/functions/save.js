
// netlify/functions/save.js
// Token được ẩn trong Netlify Environment Variables — không ai đọc được từ browser

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = 'Tungphan222/promotion-flow';
  const FILE_PATH    = 'index.html';

  if (!GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN chưa được cấu hình' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { content } = body;
  if (!content) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu content' }) };
  }

  try {
    // 1. Lấy SHA của file hiện tại (bắt buộc để commit)
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'promotion-flow-app' } }
    );

    if (!getRes.ok) {
      const err = await getRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi lấy SHA: ' + err }) };
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;

    // 2. Commit nội dung mới lên GitHub
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'promotion-flow-app'
        },
        body: JSON.stringify({
          message: `Update promotion flow — ${now}`,
          content: btoa(unescape(encodeURIComponent(content))),
          sha: sha
        })
      }
    );

    if (!commitRes.ok) {
      const err = await commitRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi commit: ' + err }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Đã commit lên GitHub! Netlify sẽ deploy trong ~30 giây.' })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
