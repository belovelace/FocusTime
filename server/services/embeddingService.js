const OpenAI = require('openai');
const prisma = require('../lib/prisma');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 텍스트 → 임베딩 벡터 변환
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * 두 벡터의 코사인 유사도 계산
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} -1 ~ 1
 */
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

/**
 * goal 저장 시 임베딩 생성 후 DB에 저장
 * @param {number} goalId
 * @param {string} text
 */
async function saveGoalEmbedding(goalId, text) {
  if (!text?.trim()) return;
  const vector = await generateEmbedding(text);
  await prisma.sessionGoal.update({
    where: { id: goalId },
    data: { goalEmbedding: vector },
  });
}

/**
 * 유저의 최근 목표 벡터 평균 → 대표 벡터 반환
 * @param {number} userId
 * @returns {Promise<number[] | null>}
 */
async function getUserRecentEmbedding(userId) {
  const goals = await prisma.sessionGoal.findMany({
    where: {
      userId,
      goalEmbedding: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { goalEmbedding: true },
  });

  if (goals.length === 0) return null;

  const vectors = goals.map((g) => g.goalEmbedding);
  const dim = vectors[0].length;

  // 벡터 평균
  const avg = Array(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      avg[i] += vec[i] / vectors.length;
    }
  }
  return avg;
}

/**
 * 코사인 유사도(−1~1)를 0~20점으로 정규화
 * @param {number} similarity
 * @returns {number}
 */
function similarityToScore(similarity) {
  // -1~1 → 0~1 → 0~20
  return ((similarity + 1) / 2) * 20;
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  saveGoalEmbedding,
  getUserRecentEmbedding,
  similarityToScore,
};