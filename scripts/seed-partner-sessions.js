/**
 * seed-partner-sessions.js
 * user1@focustime.dev 기준 일주일간 하루 3개씩 파트너 세션 생성
 * 사용: node scripts/seed-partner-sessions.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DUMMY_HOSTS = [
  { email: 'host_a@focustime.dev', nickname: '김지훈', password: 'password' },
  { email: 'host_b@focustime.dev', nickname: '이수연', password: 'password' },
  { email: 'host_c@focustime.dev', nickname: '박민서', password: 'password' },
];

const MODES   = ['desk', 'any', 'moving'];
const HOURS   = [9, 14, 19];   // 오전 9시 / 오후 2시 / 저녁 7시

async function main() {
  // 1. user1 조회
  const user1 = await prisma.user.findUnique({ where: { email: 'user1@focustime.dev' } });
  if (!user1) { console.error('user1@focustime.dev 를 찾을 수 없습니다. 먼저 서버를 실행해 사용자를 생성하세요.'); process.exit(1); }
  console.log(`user1 found: id=${user1.id}, nickname=${user1.nickname}`);

  // 2. 더미 호스트 유저 upsert
  const hosts = [];
  for (const h of DUMMY_HOSTS) {
    let u = await prisma.user.findUnique({ where: { email: h.email } });
    if (!u) {
      const hash = await bcrypt.hash(h.password, 10);
      u = await prisma.user.create({ data: { email: h.email, nickname: h.nickname, passwordHash: hash } });
      console.log(`created host: ${h.email} (id=${u.id})`);
    } else {
      console.log(`host exists: ${h.email} (id=${u.id})`);
    }
    hosts.push(u);
  }

  // 3. 오늘 기준 7일간 각 3개 세션 생성 (user1 = partner)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;
  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < 3; slot++) {
      const host = hosts[slot % hosts.length];
      const startsAt = new Date(today);
      startsAt.setDate(today.getDate() + day);
      startsAt.setHours(HOURS[slot], 0, 0, 0);

      const durationMin = [25, 50, 25][slot];
      const focusMode   = MODES[slot];

      const session = await prisma.session.create({
        data: {
          hostId:     host.id,
          partnerId:  user1.id,
          startsAt,
          durationMin,
          focusMode,
          status:     'matched',
        }
      });

      // 참여자 레코드
      await prisma.sessionParticipant.createMany({
        data: [
          { sessionId: session.id, userId: host.id,   role: 'host'    },
          { sessionId: session.id, userId: user1.id,  role: 'partner' },
        ],
        skipDuplicates: true,
      });

      const dateStr = startsAt.toISOString().slice(0, 10);
      console.log(`  [day${day+1} slot${slot+1}] session id=${session.id}  ${dateStr} ${HOURS[slot]}:00  ${durationMin}min  ${focusMode}  host=${host.nickname}`);
      created++;
    }
  }

  console.log(`\n✓ 총 ${created}개 세션 생성 완료 (user1 파트너)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
