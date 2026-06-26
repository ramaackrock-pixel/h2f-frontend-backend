import mongoose, { Schema } from 'mongoose';

const billingSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PAID', 'OVERDUE', 'PENDING', 'PARTIALLY PAID'],
        default: 'PENDING'
    },
    initials: { type: String },
    initialsBg: { type: String, default: 'bg-teal-100 text-teal-700' },
    billingType: { type: String },
    service: { type: Schema.Types.Mixed },
    subService: { type: Schema.Types.Mixed },
    packageCategory: { type: Schema.Types.Mixed },
    sessions: { type: Schema.Types.Mixed },
    paymentMode: { type: String, default: 'Cash' },
    paymentBreakdown: [{
        mode: { type: String },
        amount: { type: Number, required: true },
        date: { type: Date }
    }],
    brace: { type: String, default: '' },
    braceAmount: { type: Number, default: 0 },
    nutraceutical: { type: String, default: '' },
    nutraceuticalAmount: { type: Number, default: 0 },
    lab: { type: String, default: '' },
    labAmount: { type: Number, default: 0 }
}, {
    timestamps: true
});

export const Billing = mongoose.model('Billing', billingSchema);
