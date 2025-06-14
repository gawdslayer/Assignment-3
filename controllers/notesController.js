const { validationResult } = require('express-validator');
const Note = require('../models/Note');
const PDFDocument = require('pdfkit');

const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 100);
};

exports.getAllNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const tagToFilter = req.query.tag;

        let query = { user: userId };

        if (tagToFilter) {
            query.tags = tagToFilter;
        }

        const notes = await Note.find(query).populate('user', 'id username email').sort({ createdAt: -1 }); 
        
        res.json(notes);
    } catch (err) {
        console.error('Error fetching notes:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while fetching notes.' }] });
    }
};

exports.createNote = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;

    try {
        const newNote = new Note({
            user: req.user.id,
            title,
            content,
            tags: tags || []
        });

        const note = await newNote.save();
        res.status(201).json(note);
    } catch (err) {
        console.error('Error creating note:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while creating note.' }] });
    }
};

exports.getNoteById = async (req, res) => {
    try {
        res.json(req.note);
    } catch (err) {
        console.error('Error fetching single note (after middleware):', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while fetching note.' }] });
    }
};

exports.updateNote = async (req, res) => {
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
};

exports.deleteNote = async (req, res) => {
    try {
        await req.note.deleteOne();
        res.json({ msg: 'Note successfully deleted.' });
    } catch (err) {
        console.error('Error deleting note:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error while deleting note.' }] });
    }
};

exports.downloadNoteTxt = async (req, res) => {
    try {
        const note = req.note;
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
};

exports.downloadNoteMd = async (req, res) => {
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
        mdContent += "---\n\n";
        mdContent += note.content;
        
        res.send(mdContent);
    } catch (err) {
        console.error('Error downloading MD note:', err.message);
        res.status(500).send('Server error while preparing Markdown file.');
    }
};

exports.downloadNotePdf = async (req, res) => {
    try {
        const note = req.note;
        const filename = sanitizeFilename(note.title) + '.pdf';
        
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/pdf');

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        doc.fontSize(20).text(note.title, { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text(`Date Created: ${new Date(note.createdAt).toLocaleString()}`);
        doc.text(`Last Updated: ${new Date(note.updatedAt).toLocaleString()}`);
        if (note.tags && note.tags.length > 0) {
            doc.text(`Tags: ${note.tags.join(', ')}`);
        }
        doc.moveDown(2);
        
        doc.fontSize(12).text(note.content);
        
        doc.end();

    } catch (err) {
        console.error('Error downloading PDF note:', err.message);
        if (!res.headersSent) {
            res.status(500).send('Server error while preparing PDF file.');
        } else {
            res.end();
        }
    }
}; 