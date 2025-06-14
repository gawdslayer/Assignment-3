const mongoose = require('mongoose');
const Note = require('../models/Note');

const checkNoteOwnership = async (req, res, next) => {
    const noteId = req.params.id;
    const currentUserId = req.user.id; // req.user is set by ensureAuthenticated

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ errors: [{ msg: 'Invalid note ID format.' }] });
    }

    try {
        const note = await Note.findById(noteId);

        if (!note) {
            return res.status(404).json({ errors: [{ msg: 'Note not found.' }] });
        }

        // Ensure the note belongs to the logged-in user
        if (note.user.toString() !== currentUserId) { // Compare with currentUserId
            return res.status(403).json({ errors: [{ msg: 'User not authorized to access this note.' }] });
        }

        req.note = note; // Attach the note to the request object for use in the route handler
        next();
    } catch (err) {
        console.error('Error in checkNoteOwnership middleware:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while verifying note ownership.' }] });
    }
};

module.exports = checkNoteOwnership; 