const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');
const checkNoteOwnership = require('../middleware/noteOwnership');
const Note = require('../models/Note');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit'); // Import PDFKit

// Validation rules for creating/updating a note
const noteValidationRules = [
    check('title', 'Title is required and cannot be empty.').not().isEmpty().trim(),
    check('content', 'Content is required and cannot be empty.').not().isEmpty().trim(),
    check('tags', 'Tags must be an array of strings.').optional().isArray(),
    check('tags.*', 'Each tag must be a string.').optional().isString().trim()
];

/**
 * @route   GET /api/notes
 * @desc    Get all notes for the authenticated user
 * @access  Private
 */
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const tagToFilter = req.query.tag;

        let query = { user: userId }; // Reverted to original query for owned notes only

        if (tagToFilter) {
            query.tags = tagToFilter;
        }

        // Reverted to simpler find, removed populate for sharedWith
        const notes = await Note.find(query).populate('user', 'id username email').sort({ createdAt: -1 }); 
        
        res.json(notes);
    } catch (err) {
        console.error('Error fetching notes:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while fetching notes.' }] });
    }
});

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private
 */
router.post('/', [ensureAuthenticated, ...noteValidationRules], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;

    try {
        const newNote = new Note({
            user: req.user.id, // Associate note with the logged-in user
            title,
            content,
            tags: tags || []       // Default to empty array if not provided
        });

        const note = await newNote.save();
        res.status(201).json(note); // Return the created note
    } catch (err) {
        console.error('Error creating note:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while creating note.' }] });
    }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Get a single note by ID
 * @access  Private
 */
router.get('/:id', [ensureAuthenticated, checkNoteOwnership], async (req, res) => {
    try {
        // req.note is populated by checkNoteOwnership which is also reverted
        res.json(req.note);
    } catch (err) {
        console.error('Error fetching single note (after middleware):', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while fetching note.' }] });
    }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update an existing note
 * @access  Private
 */
router.put('/:id', [ensureAuthenticated, checkNoteOwnership, ...noteValidationRules], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;
    const noteFields = {};
    if (title) noteFields.title = title;
    if (content) noteFields.content = content;
    if (tags) noteFields.tags = tags;

    try {
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: noteFields },
            { new: true, runValidators: true }
        );

        res.json(updatedNote);
    } catch (err) {
        console.error('Error updating note:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while updating note.' }] });
    }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note by ID
 * @access  Private
 */
router.delete('/:id', [ensureAuthenticated, checkNoteOwnership], async (req, res) => {
    try {
        await req.note.deleteOne();

        res.json({ msg: 'Note successfully deleted.' });
    } catch (err) {
        console.error('Error deleting note:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while deleting note.' }] });
    }
});

// Helper function to sanitize filename
const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 100);
};

/**
 * @route   GET /api/notes/:id/download/txt
 * @desc    Download a note as a TXT file
 * @access  Private (Owner only)
 */
router.get('/:id/download/txt', [ensureAuthenticated, checkNoteOwnership], async (req, res) => {
    try {
        const note = req.note; // Note object from checkNoteOwnership middleware
        const filename = sanitizeFilename(note.title) + '.txt';
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'text/plain');
        res.charset = 'UTF-8';
        res.write(`# ${note.title}\n\n`);
        res.write(`Date Created: ${new Date(note.createdAt).toLocaleString()}\n`);
        res.write(`Last Updated: ${new Date(note.updatedAt).toLocaleString()}\n\n`);
        if (note.tags && note.tags.length > 0) {
            res.write(`Tags: ${note.tags.join(', ')}\n\n`);
        }
        res.write("------------------------------------\n\n");
        res.write(note.content);
        res.end();
    } catch (err) {
        console.error('Error downloading TXT note:', err.message);
        res.status(500).send('Server error while preparing TXT file.');
    }
});

/**
 * @route   GET /api/notes/:id/download/md
 * @desc    Download a note as a Markdown file
 * @access  Private (Owner only)
 */
router.get('/:id/download/md', [ensureAuthenticated, checkNoteOwnership], async (req, res) => {
    try {
        const note = req.note;
        const filename = sanitizeFilename(note.title) + '.md';
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'text/markdown; charset=UTF-8');
        let mdContent = `# ${note.title}\n\n`;
        mdContent += `**Date Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
        mdContent += `**Last Updated:** ${new Date(note.updatedAt).toLocaleString()}\n\n`;
        if (note.tags && note.tags.length > 0) {
            mdContent += `**Tags:** ${note.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
        }
        mdContent += "---\n\n"; // Horizontal rule
        mdContent += note.content; // Assuming note.content is plain text or already Markdown
        
        res.send(mdContent);
    } catch (err) {
        console.error('Error downloading MD note:', err.message);
        res.status(500).send('Server error while preparing Markdown file.');
    }
});

/**
 * @route   GET /api/notes/:id/download/pdf
 * @desc    Download a note as a PDF file
 * @access  Private (Owner only)
 */
router.get('/:id/download/pdf', [ensureAuthenticated, checkNoteOwnership], async (req, res) => {
    try {
        const note = req.note;
        const filename = sanitizeFilename(note.title) + '.pdf';
        
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/pdf');

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // Title
        doc.fontSize(20).text(note.title, { align: 'center' });
        doc.moveDown();

        // Metadata
        doc.fontSize(10).text(`Date Created: ${new Date(note.createdAt).toLocaleString()}`);
        doc.text(`Last Updated: ${new Date(note.updatedAt).toLocaleString()}`);
        if (note.tags && note.tags.length > 0) {
            doc.text(`Tags: ${note.tags.join(', ')}`);
        }
        doc.moveDown(2);
        
        // Content
        doc.fontSize(12).text(note.content);
        
        doc.end();

    } catch (err) {
        console.error('Error downloading PDF note:', err.message);
        // Ensure response is ended if error occurs mid-stream
        if (!res.headersSent) {
            res.status(500).send('Server error while preparing PDF file.');
        } else {
            // If headers are sent, we can only try to end the response abruptly.
            // The client might receive a corrupted PDF.
            res.end();
        }
    }
});

module.exports = router; 