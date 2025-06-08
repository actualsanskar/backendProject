import mongoose from "mongoose";

const tweetSchma = new mongoose.Schema({
    tweetOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },


}, { timestamps: true});

export const Tweet = mongoose.model('Tweet', tweetSchma);