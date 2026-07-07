import { Billing } from '../models/billing.model.js';
import { Patient } from '../models/patient.model.js';

// Create a new invoice
export const createInvoice = async (req, res) => {
    try {
        const { patientId, totalAmount, paidAmount, discount, status, billingType, service, subService, packageCategory, sessions, paymentMode, paymentBreakdown, brace, braceAmount, nutraceutical, nutraceuticalAmount, lab, labAmount } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const dueAmount = totalAmount - (discount || 0) - (paidAmount || 0);

        const billing = new Billing({
            patientId,
            patientName: patient.name,
            totalAmount,
            discount: discount || 0,
            paidAmount: paidAmount || 0,
            dueAmount,
            status: status || 'PENDING',
            initials: patient.initials,
            initialsBg: patient.initialsBg,
            billingType,
            service,
            subService,
            packageCategory,
            sessions,
            paymentMode,
            paymentBreakdown,
            brace,
            braceAmount: braceAmount || 0,
            nutraceutical,
            nutraceuticalAmount: nutraceuticalAmount || 0,
            lab,
            labAmount: labAmount || 0
        });

        await billing.save();

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            billing
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error creating invoice",
            error: error.message
        });
    }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
    try {
        const { status, patientId } = req.query;
        let query = {};

        if (status) query.status = status;
        if (patientId) query.patientId = patientId;

        const invoices = await Billing.find(query).sort({ date: -1 });

        return res.status(200).json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching invoices",
            error: error.message
        });
    }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }
        return res.status(200).json({
            success: true,
            invoice
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching invoice details",
            error: error.message
        });
    }
};

// Update invoice status/payment
export const updateInvoice = async (req, res) => {
    try {
        const { 
            totalAmount, discount, paidAmount, status, 
            billingType, service, subService, packageCategory, 
            sessions, paymentMode, paymentBreakdown, 
            brace, braceAmount, nutraceutical, nutraceuticalAmount, lab, labAmount, branch, date
        } = req.body;
        
        const invoice = await Billing.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        if (totalAmount !== undefined) invoice.totalAmount = totalAmount;
        if (discount !== undefined) invoice.discount = discount;
        if (paidAmount !== undefined) invoice.paidAmount = paidAmount;
        if (status !== undefined) invoice.status = status;
        
        invoice.dueAmount = invoice.totalAmount - (invoice.discount || 0) - (invoice.paidAmount || 0);

        if (billingType !== undefined) invoice.billingType = billingType;
        if (service !== undefined) invoice.service = service;
        if (subService !== undefined) invoice.subService = subService;
        if (packageCategory !== undefined) invoice.packageCategory = packageCategory;
        if (sessions !== undefined) invoice.sessions = sessions;
        if (paymentMode !== undefined) invoice.paymentMode = paymentMode;
        if (paymentBreakdown !== undefined) invoice.paymentBreakdown = paymentBreakdown;
        if (brace !== undefined) invoice.brace = brace;
        if (braceAmount !== undefined) invoice.braceAmount = braceAmount;
        if (nutraceutical !== undefined) invoice.nutraceutical = nutraceutical;
        if (nutraceuticalAmount !== undefined) invoice.nutraceuticalAmount = nutraceuticalAmount;
        if (lab !== undefined) invoice.lab = lab;
        if (labAmount !== undefined) invoice.labAmount = labAmount;
        if (branch !== undefined) invoice.branch = branch;
        if (date !== undefined) invoice.date = date;

        await invoice.save();

        return res.status(200).json({
            success: true,
            message: "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating invoice",
            error: error.message
        });
    }
};

// Delete an invoice
export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        await Billing.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Invoice deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting invoice",
            error: error.message
        });
    }
};
