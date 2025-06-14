const Note = require('../models/Note');
const mongoose = require('mongoose');

/**
 * @desc    Render the homepage or dashboard
 * @route   GET /
 */
exports.renderDashboard = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('index', { title: 'Welcome' });
        }
        
        const tagToFilter = req.query.tag;
        const query = { user: req.session.user.id };

        if (tagToFilter) {
            query.tags = tagToFilter;
        }

        const notes = await Note.find(query).sort({ createdAt: 'desc' });
        const tags = await Note.find({ user: req.session.user.id }).distinct('tags');

        res.render('notes', {
            title: 'Dashboard',
            notes: notes,
            allTags: tags,
            currentTag: tagToFilter,
            username: req.session.user.username
        });
    } catch (err) {
        console.error('Dashboard Error:', err.message);
        req.flash('error_msg', 'There was a problem loading your dashboard.');
        res.redirect('/login');
    }
};

/**
 * @desc    Render the page to add a new note
 * @route   GET /notes/add
 */
exports.renderAddNoteForm = (req, res) => {
    res.render('add-note', {
        title: 'Add New Note'
    });
};

/**
 * @desc    Process the add note form submission
 * @route   POST /notes/add
 */
exports.createNote = async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        
        const newNote = new Note({
            title,
            content,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            user: req.session.user.id
        });

        await newNote.save();
        req.flash('success_msg', 'Note created successfully!');
        res.redirect('/');

    } catch (err) {
        console.error('Error creating note from web:', err.message);
        req.flash('error_msg', 'Failed to create note. Please check your input.');
        res.render('add-note', {
            title: 'Add New Note',
            note: req.body // Repopulate form
        });
    }
};

/**
 * @desc    Render the page to edit an existing note
 * @route   GET /notes/edit/:id
 */
exports.renderEditNoteForm = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note || note.user.toString() !== req.session.user.id) {
            req.flash('error_msg', 'Note not found or you do not have permission to edit it.');
            return res.status(404).redirect('/');
        }

        res.render('edit-note', {
            title: 'Edit Note',
            note: note
        });
    } catch (err) {
        console.error('Error fetching note for edit:', err.message);
        req.flash('error_msg', 'Could not find the requested note.');
        res.redirect('/');
    }
};

/**
 * @desc    Process the edit note form submission
 * @route   POST /notes/edit/:id
 */
exports.updateNote = async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const noteId = req.params.id;

        const note = await Note.findById(noteId);

        if (!note || note.user.toString() !== req.session.user.id) {
            req.flash('error_msg', 'Note not found or you do not have permission to edit it.');
            return res.status(404).redirect('/');
        }
        
        note.title = title;
        note.content = content;
        note.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
        
        await note.save();

        req.flash('success_msg', 'Note updated successfully!');
        res.redirect('/');

    } catch (err) {
        console.error('Error updating note from web:', err.message);
        req.flash('error_msg', 'Failed to update note.');
        res.redirect(`/notes/edit/${req.params.id}`);
    }
};

/**
 * @desc    Process the delete note request
 * @route   POST /notes/delete/:id
 */
exports.deleteNote = async (req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId);

        if (!note || note.user.toString() !== req.session.user.id) {
            req.flash('error_msg', 'Note not found or you do not have permission to delete it.');
            return res.status(404).redirect('/');
        }
        
        await note.deleteOne();

        req.flash('success_msg', 'Note deleted successfully.');
        res.redirect('/');

    } catch (err) {
        console.error('Error deleting note from web:', err.message);
        req.flash('error_msg', 'Failed to delete note.');
        res.redirect('/');
    }
};

/**
 * @desc    Render the user profile page
 * @route   GET /profile
 */
exports.renderProfilePage = (req, res) => {
    // The user object is already in req.session.user
    res.render('profile', {
        title: 'My Profile',
        // We pass the user object to the template
        user: req.session.user
    });
}; 