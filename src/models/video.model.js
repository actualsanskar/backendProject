import mongoose, { mongo } from "mongoose";



const videoSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true
        }, 
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            required: true,
            default: true
        },
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        videoOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }, {timestamps: true}
)





export const Video = mongoose.model("Video", videoSchema)