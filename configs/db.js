import knex from 'knex';

const createKnexInstance = (dbname) => {

    const db = dbname || 'ca_firm';

    const knexInstance = knex({
        client: 'mysql2',
        connection: {
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database:db 
        },
    });

    return new Promise((res,rej)=>{
        knexInstance.raw('SELECT DATABASE()').then(result => {
        console.log(`Connected to MySQL database! ----- ${db}`)
        res(knexInstance);
        }).catch(err => {            
        console.error(`Error connecting to database: ------ ${dbname}`, err);
        rej();
        });
    })

    
    // return knexInstance;
}

export default createKnexInstance;