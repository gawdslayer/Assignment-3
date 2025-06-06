const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Note: `unique: true` in the schema fields already creates unique indexes.
// Adding `index: true` as shown above is good practice for fields frequently queried.
// If you had more complex compound indexes, you would define them here:
// userSchema.index({ field1: 1, field2: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error('Error hashing password for user:', this.username, error);
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Error comparing password for user:', this.username, error);
        throw error;
    }
};

// Override toJSON method to control what is sent in API responses
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    userObject.id = userObject._id.toString();
    delete userObject.password;
    delete userObject._id;
    delete userObject.__v;
    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 