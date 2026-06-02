require('dotenv').config();
const db = require('./src/config/database');

async function checkUserBranch() {
  try {
    console.log('Connecting to database...');
    
    // Check all users and their branches
    const usersResult = await db.pool.query(`
      SELECT u.id, u.username, u.name, u.role, u.branch_id, b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.is_active = true
      ORDER BY u.id
    `);
    
    console.log('\n=== ALL USERS ===');
    usersResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}, Branch: ${user.branch_name || 'NOT ASSIGNED'}`);
    });
    
    // Check all branches
    const branchesResult = await db.pool.query('SELECT * FROM branches ORDER BY id');
    
    console.log('\n=== ALL BRANCHES ===');
    branchesResult.rows.forEach(branch => {
      console.log(`ID: ${branch.id}, Name: ${branch.name}, Code: ${branch.code}, Active: ${branch.is_active}`);
    });
    
    // Check specific user 'makin'
    const makinResult = await db.pool.query(`
      SELECT u.*, b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.username = $1
    `, ['makin']);
    
    console.log('\n=== USER "makin" DETAILS ===');
    if (makinResult.rows.length > 0) {
      console.log(JSON.stringify(makinResult.rows[0], null, 2));
    } else {
      console.log('User "makin" NOT FOUND in database!');
    }
    
    await db.pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUserBranch();
