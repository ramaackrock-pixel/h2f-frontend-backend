import { MedicalRecord } from '../models/medicalRecord.model.js';
import fs from 'fs';
import path from 'path';

export const uploadChunk = async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, patientName, pid, recordType, doctor, uploadedDate, branch } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No chunk file provided' });
    }

    const tempDir = path.join('public', 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${uploadId}`);
    
    // Append the chunk to the temp file
    fs.appendFileSync(tempFilePath, fs.readFileSync(req.file.path));
    
    // Remove the multer temp chunk file
    fs.unlinkSync(req.file.path);

    // If it's the last chunk, move it to final destination and create DB record
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const finalFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(fileName)}`;
      const finalFilePath = path.join('public', 'uploads', finalFileName);
      
      fs.renameSync(tempFilePath, finalFilePath);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const recordData = {
        patientName,
        pid,
        recordType,
        doctor,
        uploadedDate,
        branch,
        fileName,
        fileUrl: `${baseUrl}/uploads/${finalFileName}`
      };
      
      const record = await MedicalRecord.create(recordData);
      return res.status(201).json({ success: true, data: record, finished: true });
    }

    res.status(200).json({ success: true, message: `Chunk ${chunkIndex} uploaded`, finished: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createRecord = async (req, res) => {
  try {
    const recordData = { ...req.body };
    
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      recordData.fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      if (!recordData.fileName) {
        recordData.fileName = req.file.originalname;
      }
    }

    const record = await MedicalRecord.create(recordData);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
