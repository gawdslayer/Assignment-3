const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');
const checkNoteOwnership = require('../middleware/noteOwnership');
const notesController = require('../controllers/notesController');

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
router.get('/', ensureAuthenticated, notesController.getAllNotes);

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private
 */
router.post('/', [ensureAuthenticated, ...noteValidationRules], notesController.createNote);

/**
 * @route   GET /api/notes/:id
 * @desc    Get a single note by ID
 * @access  Private
 */
router.get('/:id', [ensureAuthenticated, checkNoteOwnership], notesController.getNoteById);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update an existing note
 * @access  Private
 */
router.put('/:id', [ensureAuthenticated, checkNoteOwnership, ...noteValidationRules], notesController.updateNote);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note by ID
 * @access  Private
 */
router.delete('/:id', [ensureAuthenticated, checkNoteOwnership], notesController.deleteNote);

/**
 * @route   GET /api/notes/:id/download/txt
 * @desc    Download a note as a TXT file
 * @access  Private (Owner only)
 */
router.get('/:id/download/txt', [ensureAuthenticated, checkNoteOwnership], notesController.downloadNoteTxt);

/**
 * @route   GET /api/notes/:id/download/md
 * @desc    Download a note as a Markdown file
 * @access  Private (Owner only)
 */
router.get('/:id/download/md', [ensureAuthenticated, checkNoteOwnership], notesController.downloadNoteMd);

/**
 * @route   GET /api/notes/:id/download/pdf
 * @desc    Download a note as a PDF file
 * @access  Private (Owner only)
 */
router.get('/:id/download/pdf', [ensureAuthenticated, checkNoteOwnership], notesController.downloadNotePdf);

module.exports = router; 