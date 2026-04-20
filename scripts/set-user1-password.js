#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../server/lib/prisma');

async function main(){
  const email = 'user1@focustime.dev';
  const plain = 'password';
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_TEST){
    console.error('No DATABASE_URL or DATABASE_URL_TEST configured in environment.');
    process.exit(1);
  }
  try{
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing){
      console.error('User not found:', email);
      process.exit(1);
    }
    const hash = await bcrypt.hash(plain, 10);
    const updated = await prisma.user.update({ where: { email }, data: { passwordHash: hash } });
    console.log('Updated user', String(updated.id), 'email:', updated.email);
    await prisma.$disconnect();
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    try{ await prisma.$disconnect(); }catch(e){}
    process.exit(1);
  }
}

main();
