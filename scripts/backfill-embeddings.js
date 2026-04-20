// scripts/backfill-embeddings.js
// seed 데이터의 goal_text를 임베딩 벡터로 변환해 DB에 저장
// 실행: node scripts/backfill-embeddings.js

require('dotenv').config();
const prisma = require('../server/lib/prisma');
const { saveGoalEmbedding } = require('../server/services/embeddingService');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const goals = await prisma.$queryRaw`
    SELECT id, goal_text AS goalText
    FROM session_goals
    WHERE goal_text IS NOT NULL
      AND goal_embedding IS NULL
  `;

  if (goals.length === 0) {
    console.log('임베딩할 목표가 없습니다.');
    return;
  }

  console.log(`총 ${goals.length}개 목표 임베딩 시작...\n`);

  let success = 0;
  let failed = 0;

  for (const goal of goals) {
    try {
      await saveGoalEmbedding(Number(goal.id), goal.goalText);
      success++;
      process.stdout.write(`\r임베딩 완료: ${success}/${goals.length}`);
      await sleep(100); // rate limit 방지
    } catch (err) {
      failed++;
      console.error(`\ngoalId ${goal.id} 실패:`, err.message);
    }
  }

  console.log(`\n\n✅ 완료 — 성공: ${success}개 / 실패: ${failed}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
