// scripts/init-db.ts
import {Database} from 'arangojs';

async function initializeDatabase()
{
    // Connect to ArangoDB
    const dbConfig = {
        url: process.env.ARANGO_URL || 'http://localhost:8529',
        auth: {
            username: process.env.ARANGO_USERNAME || 'root',
            password: process.env.ARANGO_PASSWORD || ''
        }
    };

    const systemDb = new Database(dbConfig);
    const dbName = process.env.ARANGO_DB || 'auth_db';

    try
    {
        console.log(`Checking if database '${dbName}' exists...`);
        const databaseExists = await systemDb.listDatabases().then(dbs => dbs.includes(dbName));

        if (!databaseExists)
        {
            console.log(`Creating database '${dbName}'...`);
            await systemDb.createDatabase(dbName);
            console.log(`Database '${dbName}' created successfully.`);
        }
        else
        {
            console.log(`Database '${dbName}' already exists.`);
        }

        // Switch to the auth database
        const db = systemDb.database(dbName);

        // Create users collection if it doesn't exist
        const usersCollectionName = 'users';
        const usersCollectionExists = await db.listCollections().then(
            collections => collections.some(c => c.name === usersCollectionName)
        );

        if (!usersCollectionExists)
        {
            console.log(`Creating '${usersCollectionName}' collection...`);
            await db.createCollection(usersCollectionName);
            console.log(`Collection '${usersCollectionName}' created successfully.`);

            // Create email index for users collection
            console.log('Creating email index...');
            await db.collection(usersCollectionName).ensureIndex({
                type: 'persistent',
                fields: ['email'],
                unique: true
            });
            console.log('Email index created successfully.');
        }
        else
        {
            console.log(`Collection '${usersCollectionName}' already exists.`);
        }

        // Create urls collection if it doesn't exist
        const urlsCollectionName = 'urls';
        const urlsCollectionExists = await db.listCollections().then(
            collections => collections.some(c => c.name === urlsCollectionName)
        );

        if (!urlsCollectionExists)
        {
            console.log(`Creating '${urlsCollectionName}' collection...`);
            await db.createCollection(urlsCollectionName);
            console.log(`Collection '${urlsCollectionName}' created successfully.`);

            // Create slug index for urls collection
            console.log('Creating slug index...');
            await db.collection(urlsCollectionName).ensureIndex({
                type: 'persistent',
                fields: ['slug'],
                unique: true
            });
            console.log('Slug index created successfully.');
        }
        else
        {
            console.log(`Collection '${urlsCollectionName}' already exists.`);
        }

        console.log('Database initialization completed successfully.');
    }
    catch (error)
    {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase();