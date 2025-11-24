import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    user: 'sa',
    password: '12345678',
    server: 'localhost',
    database: 'CNPM',
    port: 1433, 
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed! Bad Config: ', err);
        process.exit(1);
    });

export const connectDB = async () => {
    return poolPromise;
};

export const pool = poolPromise;

export { sql, poolPromise };