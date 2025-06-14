const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [1, 'Title cannot be empty']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        minlength: [1, 'Content cannot be empty']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true,
    collection: 'notes'
});

// Add index for better query performance
noteSchema.index({ user: 1, createdAt: -1 });

// Add a method to format the note for display
noteSchema.methods.toJSON = function() {
    const noteObject = this.toObject();
    noteObject.id = noteObject._id.toString();
    delete noteObject._id;
    delete noteObject.__v;
    return noteObject;
};

// Add static method to find notes by user
noteSchema.statics.findByUser = function(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return Promise.resolve([]);
    }
    return this.find({ user: userId }).sort({ createdAt: -1 });
};

const Note = mongoose.model('Note', noteSchema);

// Log when the model is created
console.log('Note model initialized');

module.exports = Note; 