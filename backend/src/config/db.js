import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log:[
        {level: 'query',emit: 'event'}, 
        {level: 'error',emit: 'stdout'},
        {level: 'warn',emit: 'stdout'}
    ],

    errorFormat: 'pretty',
});

if(process.env.NODE_ENV === 'development'){
    prisma.$on('query',(e)=>{
        console.log('Query: '+ e.query);
        console.log('Duration: '+ e.duration + 'ms')
    });
}

prisma.$connect()
    .then(()=>{
        console.log('Database connected successfully');
    })
    .catch((err)=>{
        console.error('Database connection error: ', err);
        process.exit(1);
    })


process.on('SIGINT', async()=>{
    console.log('\n Recieved SIGINT, closing database connection...')
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async()=>{
    console.log('\n Recieved SIGTERM, closing database connection...')
    await prisma.$disconnect();
    process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

export default prisma;
