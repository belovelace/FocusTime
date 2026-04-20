const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Simple privacy content endpoint. Content is static for now; can be moved to DB or markdown.
router.get('/', async (req, res) => {
  try {
    const html = `
      <h2>FocusTime 개인정보처리방침</h2>
      <p>이 페이지는 예시 정책 문서입니다. 실제 서비스의 정책은 법률 자문을 받아 작성하십시오.</p>
      <h3>수집 항목</h3>
      <ul>
        <li>이메일, 닉네임, 아바타 URL 등 계정 정보</li>
        <li>세션 참여 기록 및 세션 목표</li>
      </ul>
      <h3>목적</h3>
      <p>서비스 제공, 회원 관리, 알림 및 통계 분석을 위해 수집합니다.</p>
      <h3>보관 기간</h3>
      <p>법령에서 정한 기간 또는 서비스 운영 목적 달성 시까지 보관합니다.</p>
    `;
    res.json({ html });
  } catch (err) { console.error(err); res.status(500).json({ error: 'failed' }); }
});

module.exports = router;