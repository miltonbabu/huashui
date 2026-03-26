const User = require('./models/User');
const sequelize = require('./config/database');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { email: 'admin@ncwu.site' } });

    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@ncwu.site',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✓ Admin user created: admin@ncwu.site / admin123');
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('✗ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
