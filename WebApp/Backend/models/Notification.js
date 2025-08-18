const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Notification message is required']
    },
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: ['order', 'device', 'report', 'system', 'maintenance', 'shift']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required']
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedTo: {
        model: {
            type: String,
            enum: ['Order', 'Device', 'Report']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    actionUrl: String,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ 'relatedTo.model': 1, 'relatedTo.id': 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
    const created = await this.create(data);

    // Populate sau khi đã tạo xong
    const notification = await this.findById(created._id)
        .populate('sender', 'username fullName')
        .populate('recipient', 'username fullName');

    // Emit socket event if socket.io is available
    if (global.io) {
        global.io.to(notification.recipient._id.toString()).emit('notification', notification);
    }

    return notification;
};

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function () {
    this.read = true;
    this.readAt = Date.now();
    await this.save();

    // Emit socket event if socket.io is available
    if (global.io) {
        global.io.to(this.recipient.toString()).emit('notification', {
            type: 'read',
            data: { id: this._id }
        });
    }

    return this;
};

// Method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({
        recipient: userId,
        read: false
    });
};

notificationSchema.statics.getReadCount = async function (userId) {
    return await this.countDocuments({
        recipient: userId,
        read: true
    });
};

// Method to get notifications for a user
notificationSchema.statics.getUserNotifications = async function (userId, options = {}) {
    const {
        limit = 20,
        skip = 0,
        type,
        read,
        priority,
        startDate,
        endDate
    } = options;

    const query = { recipient: userId };

    if (type) query.type = type;
    if (typeof read === 'boolean') query.read = read;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await this.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username fullName')
        .populate('recipient', 'username fullName');
};

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
